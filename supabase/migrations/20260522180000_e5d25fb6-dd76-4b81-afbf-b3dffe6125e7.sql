-- ============================================================================
-- 002 — CTE Directory Expansion
-- ============================================================================
-- Applies on top of the live Career Compass schema (last applied migration:
-- 20260520190517_e2736405).
--
-- Strategy: ADDITIVE ONLY. No drops, no destructive ALTERs. Existing tables,
-- columns, and seeded data are untouched.
--
-- What this migration adds:
--   - 5 new tables: opportunities, opportunity_sub_cluster_tags, testimonials,
--     school_partnerships, analytics_events
--   - 9 new enum types (skips industry / career_area — live uses ACTE)
--   - New columns on companies:  tagline, cs_ai_description, hq_city,
--     hq_state, public_careers_url, school-relations contacts,
--     internal contacts, verification, attestations, size, published_at
--   - New columns on interviews: video_url, thumbnail_url, transcript_text,
--     captions_status, duration_seconds, key_topics, featured,
--     years_at_company, background_blurb
--   - Triggers:  refresh_opportunity_expiry, set_published_at
--   - Storage buckets: interview-thumbnails, testimonial-photos
--                      (matching the owner-write / public-read pattern used
--                      for company-logos and interview-audio)
--   - pg_trgm extension + trigram GIN index on companies.name
--   - RLS on all new tables, matching the live pattern:
--     "public read if parent company is published, otherwise owner-or-admin"
--
-- Naming notes:
--   - Live `companies.description` plays the role of the design doc's `about`
--     field. No `about` column is added.
--   - Live uses `companies.status` (content_status enum); the design doc's
--     `company_status` enum is NOT introduced.
--   - Live `companies.industry` is plain TEXT; the design doc's `industry`
--     enum is NOT introduced. The ACTE taxonomy is the canonical career model.
--   - Interview personalization uses live `interviewee_name` / `interviewee_role`.
--     The design doc's `person_name` / `person_role` are NOT introduced.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------------------

create extension if not exists "pg_trgm";


-- ----------------------------------------------------------------------------
-- New enum types
-- ----------------------------------------------------------------------------

create type public.verification_status as enum ('unverified', 'verified', 'flagged');
create type public.company_size        as enum ('1-10', '11-50', '51-200', '201-1000', '1000+');

create type public.opportunity_type as enum (
  'internship',
  'apprenticeship',
  'job_shadow',
  'externship',
  'fellowship',
  'entry_level'
);

create type public.opportunity_status as enum ('draft', 'active', 'expired', 'filled', 'archived');

create type public.work_format as enum ('in_person', 'remote', 'hybrid');

create type public.grade_level as enum (
  'grade_9', 'grade_10', 'grade_11', 'grade_12',
  'college_freshman', 'college_sophomore', 'college_junior', 'college_senior',
  'recent_graduate'
);

create type public.interview_topic as enum (
  'day_in_the_life',
  'career_path',
  'how_i_got_hired',
  'skills_i_use',
  'advice_for_students'
);

create type public.captions_status as enum ('yt_auto', 'vtt_uploaded', 'manual_review_done');

create type public.school_type as enum (
  'high_school', 'two_year_college', 'four_year_college', 'technical_college'
);

create type public.relationship_type as enum (
  'hiring_pipeline',
  'curriculum_partner',
  'guest_speakers',
  'equipment_donation',
  'internship_host'
);


-- ============================================================================
-- 1. Extend public.companies
-- ============================================================================

alter table public.companies
  add column if not exists tagline                         text,
  add column if not exists cs_ai_description               text,
  add column if not exists hq_city                         text,
  add column if not exists hq_state                        text default 'MN',
  add column if not exists public_careers_url              text,
  add column if not exists school_relations_contact_name   text,
  add column if not exists school_relations_contact_email  text,
  add column if not exists internal_contact_name           text,
  add column if not exists internal_contact_email          text,
  add column if not exists internal_contact_phone          text,
  add column if not exists verification_status             public.verification_status not null default 'unverified',
  add column if not exists last_verified_date              date,
  add column if not exists attestation_minor_safety        boolean not null default false,
  add column if not exists attestation_terms               boolean not null default false,
  add column if not exists size                            public.company_size,
  add column if not exists published_at                    timestamptz;

comment on column public.companies.tagline             is 'One-line public tagline, ≤80 chars.';
comment on column public.companies.cs_ai_description   is 'Public-facing description of CS/AI work at this company, ≤1500 chars.';
comment on column public.companies.public_careers_url  is 'Outbound link to the company''s own careers page. Wrapped with UTM params at click time.';
comment on column public.companies.published_at        is 'First time status flipped to ''published''. Set by trigger.';

-- Length caps (safe — net-new columns are empty).
alter table public.companies
  add constraint companies_tagline_len
    check (tagline is null or char_length(tagline) <= 80);

alter table public.companies
  add constraint companies_cs_ai_description_len
    check (cs_ai_description is null or char_length(cs_ai_description) <= 1500);

-- ---------------------------------------------------------------------------
-- Backfill for pre-existing published rows
-- ---------------------------------------------------------------------------
-- At the time of writing, the live DB has ~95 companies with status='published'
-- that were inserted by seed migrations (DEED top employers, state agencies,
-- federal agencies, manual_editorial_seed). None of them went through an
-- attestation flow because the attestation columns didn't exist yet.
--
-- We grandfather those rows: mark attestations true and stamp published_at to
-- created_at. The CHECK constraint below then enforces that any FUTURE publish
-- requires real attestations. Querying for "companies that have actually
-- attested" should filter on `source` to exclude the grandfathered seeds:
--
--   where attestation_minor_safety = true
--     and attestation_terms       = true
--     and (source is null or source not in ('manual_editorial_seed',
--          'deed_top_employers', 'state_agencies_seed', 'federal_seed'))
-- ---------------------------------------------------------------------------

update public.companies
   set attestation_minor_safety = true,
       attestation_terms        = true,
       published_at             = coalesce(published_at, created_at)
 where status = 'published'::public.content_status;

-- Block publishing without attestations (going forward).
alter table public.companies
  add constraint companies_attestations_required_for_publish
    check (
      status <> 'published'::public.content_status
      or (attestation_minor_safety and attestation_terms)
    );

-- Trigram index on name for fuzzy search.
create index if not exists idx_companies_name_trgm
  on public.companies using gin (name gin_trgm_ops);


-- Stamp published_at the first time status flips to 'published'.
create or replace function public.set_companies_published_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'published'::public.content_status
     and (old.status is null or old.status <> 'published'::public.content_status)
     and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_companies_set_published_at on public.companies;
create trigger trg_companies_set_published_at
  before insert or update on public.companies
  for each row execute function public.set_companies_published_at();


-- ============================================================================
-- 2. Extend public.interviews (add video fields; keep audio + Q&A model)
-- ============================================================================

alter table public.interviews
  add column if not exists video_url           text,
  add column if not exists thumbnail_url       text,
  add column if not exists transcript_text     text,
  add column if not exists captions_status     public.captions_status,
  add column if not exists duration_seconds    int,
  add column if not exists key_topics          public.interview_topic[],
  add column if not exists featured            boolean not null default false,
  add column if not exists years_at_company    int,
  add column if not exists background_blurb    text,
  add column if not exists display_order       int not null default 0;

alter table public.interviews
  add constraint interviews_duration_positive
    check (duration_seconds is null or duration_seconds > 0);

alter table public.interviews
  add constraint interviews_years_nonneg
    check (years_at_company is null or years_at_company >= 0);

alter table public.interviews
  add constraint interviews_background_blurb_len
    check (background_blurb is null or char_length(background_blurb) <= 300);

create index if not exists idx_interviews_company_display_order
  on public.interviews(company_id, display_order);


-- ============================================================================
-- 3. New table: opportunities
-- ============================================================================

create table public.opportunities (
  id                       uuid primary key default gen_random_uuid(),
  company_id               uuid not null references public.companies(id) on delete cascade,
  owner_id                 uuid references auth.users(id) on delete set null,
  title                    text not null check (char_length(title) <= 100),
  type                     public.opportunity_type not null,
  grade_level_eligibility  public.grade_level[] not null check (array_length(grade_level_eligibility, 1) > 0),
  format                   public.work_format not null,
  location_city            text,
  location_state           text,
  duration                 text not null,
  hours_per_week_min       int check (hours_per_week_min >= 0),
  hours_per_week_max       int check (hours_per_week_max is null or hours_per_week_max >= hours_per_week_min),
  paid                     boolean not null,
  compensation             text,
  description              text not null check (char_length(description) <= 1500),
  responsibilities         text[] not null default '{}',
  preferred_skills         text[] not null default '{}',
  requirements             text[] not null default '{}',
  application_url          text not null,
  application_deadline     date,
  start_date               date,
  positions_available      int check (positions_available is null or positions_available > 0),
  status                   public.opportunity_status not null default 'draft',
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  expires_at               timestamptz not null default (now() + interval '90 days'),

  constraint opportunities_location_required_unless_remote
    check (format = 'remote' or (location_city is not null and location_state is not null)),
  constraint opportunities_comp_required_if_paid
    check (paid = false or compensation is not null)
);

comment on table public.opportunities is 'Internships, apprenticeships, job shadows, and entry-level roles offered by a company.';
comment on column public.opportunities.expires_at is 'Reset to now()+90d on every update via trigger. A scheduled job should flip status to ''expired'' where expires_at < now().';

alter table public.opportunities enable row level security;

create trigger trg_opportunities_updated
  before update on public.opportunities
  for each row execute function public.set_updated_at();

-- Refresh expires_at on every insert/update.
create or replace function public.refresh_opportunity_expiry()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.expires_at = now() + interval '90 days';
  return new;
end;
$$;

create trigger trg_opportunities_refresh_expiry
  before insert or update on public.opportunities
  for each row execute function public.refresh_opportunity_expiry();

-- Indexes for student-facing filters.
create index idx_opportunities_company on public.opportunities(company_id);
create index idx_opportunities_active_by_expiry on public.opportunities(status, expires_at)
  where status = 'active';
create index idx_opportunities_grade_levels on public.opportunities using gin (grade_level_eligibility);
create index idx_opportunities_type_active on public.opportunities(type) where status = 'active';
create index idx_opportunities_format_active on public.opportunities(format) where status = 'active';

-- RLS — matches the live "owner manage + public read if parent published" pattern.
create policy "opportunities public read"
  on public.opportunities for select using (
    status = 'active'
    and exists (
      select 1 from public.companies c
      where c.id = company_id and c.status = 'published'::public.content_status
    )
    or auth.uid() = owner_id
    or exists (
      select 1 from public.companies c
      where c.id = company_id and (c.owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'::public.app_role))
    )
  );

create policy "opportunities owner insert"
  on public.opportunities for insert with check (
    exists (
      select 1 from public.companies c
      where c.id = company_id and (c.owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'::public.app_role))
    )
  );

create policy "opportunities owner update"
  on public.opportunities for update using (
    exists (
      select 1 from public.companies c
      where c.id = company_id and (c.owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'::public.app_role))
    )
  );

create policy "opportunities admin delete"
  on public.opportunities for delete using (
    public.has_role(auth.uid(), 'admin'::public.app_role)
  );


-- ============================================================================
-- 4. New table: opportunity_sub_cluster_tags
-- (M2M opportunity → ACTE sub-cluster, mirrors career_sub_cluster_tags pattern)
-- ============================================================================

create table public.opportunity_sub_cluster_tags (
  opportunity_id  uuid not null references public.opportunities(id) on delete cascade,
  sub_cluster_id  uuid not null references public.acte_sub_clusters(id) on delete cascade,
  is_primary      boolean not null default false,
  created_at      timestamptz not null default now(),
  primary key (opportunity_id, sub_cluster_id)
);

create index idx_opp_subcluster_subcluster on public.opportunity_sub_cluster_tags(sub_cluster_id);

alter table public.opportunity_sub_cluster_tags enable row level security;

create policy "opp_subcluster public read"
  on public.opportunity_sub_cluster_tags for select using (
    exists (
      select 1 from public.opportunities o
      join public.companies c on c.id = o.company_id
      where o.id = opportunity_id
        and o.status = 'active'
        and c.status = 'published'::public.content_status
    )
    or exists (
      select 1 from public.opportunities o
      join public.companies c on c.id = o.company_id
      where o.id = opportunity_id
        and (c.owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'::public.app_role))
    )
  );

create policy "opp_subcluster owner manage"
  on public.opportunity_sub_cluster_tags for all using (
    exists (
      select 1 from public.opportunities o
      join public.companies c on c.id = o.company_id
      where o.id = opportunity_id
        and (c.owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'::public.app_role))
    )
  ) with check (
    exists (
      select 1 from public.opportunities o
      join public.companies c on c.id = o.company_id
      where o.id = opportunity_id
        and (c.owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'::public.app_role))
    )
  );


-- ============================================================================
-- 5. New table: testimonials
-- ============================================================================

create table public.testimonials (
  id                   uuid primary key default gen_random_uuid(),
  company_id           uuid not null references public.companies(id) on delete cascade,
  person_name          text not null,
  school_or_program    text not null,
  year                 int  not null check (year between 2000 and 2100),
  role_held            text not null,
  quote                text not null check (char_length(quote) <= 400),
  photo_url            text,
  linkedin_url         text,
  consent_on_file      boolean not null default false,
  display_order        int  not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

comment on column public.testimonials.consent_on_file is
  'Internal flag — parental consent required if person was under 18 when quote was given.';

alter table public.testimonials enable row level security;

create trigger trg_testimonials_updated
  before update on public.testimonials
  for each row execute function public.set_updated_at();

create index idx_testimonials_company on public.testimonials(company_id, display_order);

create policy "testimonials public read"
  on public.testimonials for select using (
    exists (
      select 1 from public.companies c
      where c.id = company_id
        and (c.status = 'published'::public.content_status
             or c.owner_id = auth.uid()
             or public.has_role(auth.uid(), 'admin'::public.app_role))
    )
  );

create policy "testimonials owner manage"
  on public.testimonials for all using (
    exists (
      select 1 from public.companies c
      where c.id = company_id
        and (c.owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'::public.app_role))
    )
  ) with check (
    exists (
      select 1 from public.companies c
      where c.id = company_id
        and (c.owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'::public.app_role))
    )
  );


-- ============================================================================
-- 6. New table: school_partnerships
-- ============================================================================

create table public.school_partnerships (
  id                   uuid primary key default gen_random_uuid(),
  company_id           uuid not null references public.companies(id) on delete cascade,
  school_name          text not null,
  school_type          public.school_type not null,
  city                 text not null,
  state                text not null,
  relationship_types   public.relationship_type[] not null
    check (array_length(relationship_types, 1) > 0),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table public.school_partnerships enable row level security;

create trigger trg_school_partnerships_updated
  before update on public.school_partnerships
  for each row execute function public.set_updated_at();

create index idx_partnerships_company on public.school_partnerships(company_id);

create policy "partnerships public read"
  on public.school_partnerships for select using (
    exists (
      select 1 from public.companies c
      where c.id = company_id
        and (c.status = 'published'::public.content_status
             or c.owner_id = auth.uid()
             or public.has_role(auth.uid(), 'admin'::public.app_role))
    )
  );

create policy "partnerships owner manage"
  on public.school_partnerships for all using (
    exists (
      select 1 from public.companies c
      where c.id = company_id
        and (c.owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'::public.app_role))
    )
  ) with check (
    exists (
      select 1 from public.companies c
      where c.id = company_id
        and (c.owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'::public.app_role))
    )
  );


-- ============================================================================
-- 7. New table: analytics_events
-- ============================================================================

create table public.analytics_events (
  id                    uuid primary key default gen_random_uuid(),
  event_name            text not null,
  company_id            uuid references public.companies(id)    on delete set null,
  opportunity_id        uuid references public.opportunities(id) on delete set null,
  interview_id          uuid references public.interviews(id)   on delete set null,
  anonymous_session_id  text,
  referrer              text,
  user_agent            text,
  metadata              jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now()
);

comment on table public.analytics_events is
  'Anonymous event log. No PII, no user IDs. anonymous_session_id is a rotating browser hash.';

alter table public.analytics_events enable row level security;

create index idx_events_company     on public.analytics_events(company_id, created_at desc);
create index idx_events_opportunity on public.analytics_events(opportunity_id, created_at desc);
create index idx_events_interview   on public.analytics_events(interview_id, created_at desc);
create index idx_events_name        on public.analytics_events(event_name, created_at desc);

-- Anyone (including anon) can insert events. No one but admins can read.
create policy "events anon insert"
  on public.analytics_events for insert
  with check (true);

create policy "events admin read"
  on public.analytics_events for select using (
    public.has_role(auth.uid(), 'admin'::public.app_role)
  );


-- ============================================================================
-- 8. Storage buckets
-- ============================================================================

insert into storage.buckets (id, name, public) values
  ('interview-thumbnails', 'interview-thumbnails', true),
  ('testimonial-photos',   'testimonial-photos',   true)
on conflict (id) do nothing;

-- Owner-write / public-read policies (matching the live company-logos pattern).
create policy "interview thumbnails owner write" on storage.objects for insert with check (
  bucket_id = 'interview-thumbnails' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "interview thumbnails owner update" on storage.objects for update using (
  bucket_id = 'interview-thumbnails' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "interview thumbnails owner delete" on storage.objects for delete using (
  bucket_id = 'interview-thumbnails' and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "testimonial photos owner write" on storage.objects for insert with check (
  bucket_id = 'testimonial-photos' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "testimonial photos owner update" on storage.objects for update using (
  bucket_id = 'testimonial-photos' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "testimonial photos owner delete" on storage.objects for delete using (
  bucket_id = 'testimonial-photos' and auth.uid()::text = (storage.foldername(name))[1]
);

-- Public read is granted via bucket-public flag (consistent with company-logos
-- and interview-audio buckets after migration 20260427194628).


-- ============================================================================
-- End of migration 002.
-- ============================================================================
