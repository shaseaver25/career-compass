
## Overview
Three coordinated changes: (1) a migration adding DEED mirror tables and seeding 60 top MN employers as draft companies, (2) an Edge Function + weekly cron that refreshes the DEED list, (3) an Admin "Data" tab for monitoring + manual sync, and a Minnesota Tech Association card on `/explore`.

## 1. Database migration
New migration file (auto-timestamped) containing:
- `ALTER TABLE public.companies` add `mn_employees int`, `deed_rank int`, `source text` + partial index on `deed_rank`.
- `CREATE TABLE public.deed_employers` (raw DEED mirror; unique on `organization`; FK `matched_company_id → companies`, `suggested_cluster_id → acte_clusters`; tracks `first_seen_at`, `last_seen_at`, `removed_from_source`). RLS: admin write, public read. Trigger `set_updated_at`.
- `CREATE TABLE public.deed_sync_log` (audit log per run). RLS: admin read, service insert.
- Seed all 60 employers verbatim into `deed_employers`, then 12 cluster-mapping `UPDATE` statements (HHS, PSS, MKS, EDU, FIN, AMF, DTC, AGR, HUS, HET, CON, ENR) keyed by `acte_clusters.code`.
- Insert into `public.companies` from `deed_employers` (slug = slugified org name, industry = cluster name, status='draft', owner_id=NULL), skipping any name already present.
- Backfill `deed_employers.matched_company_id` from the new companies.
- Create one `company_locations` stub row per seeded company (city='Multiple', state='MN', is_primary=true).
- Insert one initial `deed_sync_log` row (`triggered_by='manual:initial_seed'`).

## 2. Edge Function `sync-deed-employers`
New file `supabase/functions/sync-deed-employers/index.ts`:
- Fetches DEED xlsx, SHA-256 hashes it, short-circuits with `skipped_unchanged` log row if hash matches last successful run.
- Parses "Top Employers" sheet via SheetJS (`npm:xlsx`).
- Diffs against existing `deed_employers`: inserts new rows, updates changed ones, bumps `last_seen_at` on unchanged, flips `removed_from_source=true` for orgs no longer in the file (never deletes).
- Inserts a `deed_sync_log` row with counts + duration + `triggered_by` (defaults `cron`, overridable via `x-triggered-by` header).
- CORS preflight + error responses with CORS headers. Uses `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (auto-provided).

## 3. Weekly cron (via `supabase--insert`, not migration)
Enable `pg_cron` + `pg_net`, then `cron.schedule('deed_employer_weekly_sync', '0 11 * * 1', net.http_post(...))` calling the function URL with the project anon key. Cron is nice-to-have — manual button is the primary trigger since the file updates ~annually.

## 4. Admin Data tab
- Add a "Data" tab to existing `src/pages/Admin.tsx` (alongside Companies / Interviews / Careers) — no new route needed; matches current tab pattern.
- **Last sync card**: latest `deed_sync_log` row + "Sync DEED now" button that calls `supabase.functions.invoke('sync-deed-employers', { headers: { 'x-triggered-by': 'manual:<email>' } })`, shows spinner, toasts result, invalidates queries.
- **DEED employers table**: rank, organization (link to matched company or "Create company"), mn_employees, suggested cluster (colored dot from grouping color), status badge (In catalog / Not matched / Removed from source). Filter chips.
- **Recent sync log**: last 10 rows with status, counts, triggered_by, duration, error preview.

## 5. /explore — Minnesota Tech Association card
Add a new section to `src/pages/Explore.tsx` below the wheel and above the consortia map: "Minnesota Tech Ecosystem" heading + one card with icon, title, description, and external link button to the MN Tech Association dashboard. Uses shadcn `Card` + lucide icon + existing tokens — no new design system work.

## Verification
- `deed_employers` count = 60
- `companies WHERE source='deed_top_employers_2026_03'` = 60 (all draft)
- `deed_employers WHERE suggested_cluster_id IS NOT NULL` = 60
- `/admin` → Data tab renders with 1 sync log entry + 60 employers
- Manual "Sync DEED now" returns `skipped_unchanged` or `success`
- `/explore` shows the new MN Tech card; existing routes unaffected
- Public `/companies` does not show the new drafts

## Open question
The cron in Change 3 needs the function URL + an auth token. The plan uses the anon key via `supabase--insert` so it isn't committed to migrations. Confirm OK, or skip cron entirely and rely on the manual button (DEED updates yearly).
