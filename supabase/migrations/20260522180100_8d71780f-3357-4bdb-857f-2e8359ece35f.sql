-- ============================================================================
-- 003 — Tighten handle_new_user (signup role grant)
-- ============================================================================
-- Security fix. The current handle_new_user() trigger inserts a row into
-- public.user_roles with role='company_rep' for every new auth user.
--
-- That's fine while signup is closed and only the team adds users by hand.
-- The moment public signup is enabled, anyone with an email becomes a
-- company_rep — and company_rep can create companies, opportunities,
-- testimonials, interviews, partnerships under the policies in migration 002.
--
-- This migration removes the auto-grant. After applying:
--   - New signups still get a profiles row.
--   - New signups do NOT get any user_roles row.
--   - Admins must promote a user to company_rep manually before they can
--     create company content.
--
-- Apply order: this should be applied at or before the time public signup is
-- enabled. Existing company_rep rows (if any) are NOT removed by this
-- migration.
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  -- Intentionally no role grant. Admins must promote users explicitly:
  --   insert into public.user_roles (user_id, role)
  --   values (<uuid>, 'company_rep'::app_role);

  return new;
end;
$function$;

comment on function public.handle_new_user is
  'Provisions profiles row only. Role assignment is manual (admin) — see migration 003.';

-- The trigger itself does not need to change; it already calls handle_new_user.
-- Confirm with:
--   select tgname from pg_trigger where tgrelid = 'auth.users'::regclass;

-- Optional audit step (uncomment to log existing company_rep users so you can
-- review who already has the role before tightening signup):
-- select ur.user_id, p.email, ur.created_at
-- from public.user_roles ur
-- join public.profiles p on p.id = ur.user_id
-- where ur.role = 'company_rep'::public.app_role
-- order by ur.created_at;
