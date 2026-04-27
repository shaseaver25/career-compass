# CTE Careers — v1 Build Plan

A statewide career-exploration platform for high schoolers, teachers, and company reps. Fresh & energetic visual style, mobile-first, WCAG AA, built on the existing Supabase schema.

## Design system

- **Vibe**: Fresh & energetic — clean white surfaces, confident teal/green primary, lively accent for badges and CTAs. Rounded cards, generous spacing, friendly type. Consumer-app feel, not edu-tech.
- **Tokens** (HSL, defined in `index.css`):
  - Primary: teal-green ~`160 70% 40%`
  - Accent: warm amber ~`38 95% 55%` (growth badges, highlights)
  - Background: near-white, soft muted surface for cards
  - Dark mode included
- **Typography**: Inter via Google Fonts. Bold display weights for headings.
- **Components**: shadcn/ui (Button, Card, Input, Badge, Select, Tabs, Dialog, Sheet, Skeleton, Sonner toasts, Avatar, Form).
- **Accessibility**: visible focus rings, semantic landmarks, alt text on logos, aria-labels on icon buttons, color contrast AA.

## Pages & routes

### Public (no auth)
1. **`/` Landing** — hero with search (routes to `/careers?q=`), two CTAs, featured careers grid (6), featured companies grid (4), two role explainer cards (students/teachers vs companies).
2. **`/careers`** — search box + filters (industry, growth outlook, education level), responsive card grid. Debounced client-side filtering over fetched list.
3. **`/careers/:slug`** — title, O*NET code, growth badge, description, typical day, three stat cards (median salary, education, top skills), skills as badges, ordered Pathway timeline, "Companies that hire for this role" cards, embedded interview audio/video players. SEO + OG tags.
4. **`/companies`** — search + industry/location filters, company card grid.
5. **`/companies/:slug`** — logo, name, industry, location, description, responsive YouTube/Vimeo embeds, careers-at-this-company cards, published interviews list with inline audio.
6. **`/auth`** — magic-link sign in (Supabase) for company reps and admins. Email-only form, friendly copy.

### Company rep (auth, role = `company_rep`)
7. **`/dashboard`** — overview tiles + tabs:
   - **Profile**: edit name, description, industry, website, logo upload (Supabase Storage), location (company_locations), video links. "Submit for review" button → sets status to pending.
   - **Careers we hire for**: searchable picker over careers catalog, add/remove rows in `company_careers`. "Request a new career" opens dialog that creates an admin task (audit_log entry).
   - **Interviews**: list of own interviews with status badges (draft / pending / published).
8. **`/dashboard/interviews/new`** — upload audio file (or browser MediaRecorder) → Supabase Storage, structured form with all 11 fields from brief, autosave draft every few seconds, "Submit for review" finalizes draft.
9. **`/dashboard/interviews/:id`** — edit a draft until submitted.

### Admin (auth, role = `admin`)
10. **`/admin`** — tabs:
    - Pending company submissions (approve / request changes)
    - Interview drafts (listen inline, edit fields, approve to publish)
    - Careers catalog manager (create/edit/delete career, manage pathway_steps in order, set salary/outlook)
    - Users (promote to company_rep or admin via user_roles)

### Bookmarks
- Save/unsave button on every career and company card and detail page.
- Stored in `localStorage` only (no DB writes for anon users).
- `/bookmarks` page lists saved items grouped by type.

## Bookmarks behavior
LocalStorage only, exactly as briefed. Two arrays: `bookmarked_careers`, `bookmarked_companies` (slug arrays). Hydration-safe hook; bookmark button optimistic with sonner toast.

## Anonymous-first principle
Every public page is reachable without auth. Auth is only triggered on `/dashboard` and `/admin` routes with a friendly redirect.

## Auth & roles
- Supabase magic link (email).
- Roles read from existing `user_roles` table via `has_role()` security-definer function.
- Route guards: `<RequireRole role="company_rep">` and `<RequireRole role="admin">` wrappers.
- Anonymous browsing untouched.

## SEO & sharing
- `react-helmet-async` per page: title, description, canonical, OG title/description/image.
- OG image: company logo for company pages; a generated branded card for careers (static SVG fallback for v1).
- Sitemap not in v1.

## Seed data (4 companies × 10 careers, richly pre-linked)

**Companies**
- Mercy Regional Hospital (Healthcare, Springfield)
- Apex Precision Manufacturing (Manufacturing, Peoria)
- Ironworks Construction Co. (Construction, Rockford)
- NorthStar IT Solutions (IT, Chicago)

**Careers** (with O*NET-style codes, median salary, growth outlook, pathway steps, skills)
- Healthcare: Registered Nurse, Surgical Technologist, Medical Assistant
- Manufacturing: CNC Machinist, Industrial Maintenance Technician
- Construction: Electrician, Carpenter, Construction Project Manager
- IT: Network Administrator, Cybersecurity Analyst

Each career links to 1–3 relevant companies via `company_careers`. Two seeded published interviews (one nurse at Mercy, one electrician at Ironworks) so interview UI shows real content. Each company has a description, location, one YouTube embed.

Seeded via a SQL migration that upserts on slug so it's safe to re-run.

## File audio playback
Custom shadcn-styled audio player wrapping the native `<audio>` element with play/pause, scrubber, time, download link.

## YouTube/Vimeo embed
Helper that detects URL type and renders a responsive 16:9 iframe wrapped in `aspect-video`.

## Out of scope (confirmed)
Teacher accounts, lesson plans, any AI, mentor matching, payments, O*NET/BLS sync, CTE standards picker.

---

## Technical notes

- Stack: existing Vite + React + TS + Tailwind + shadcn/ui + React Router + TanStack Query + Lovable Cloud (Supabase).
- New deps: `react-helmet-async` (SEO).
- Storage buckets to create via SQL migration:
  - `company-logos` (public)
  - `interview-audio` (public read for published; reps can write to their own folder)
  - RLS policies on `storage.objects` scoped by `auth.uid()` folder prefix.
- Use existing tables as-is; no schema changes expected. If `user_roles`/`has_role` don't exist yet, add them per the standard secure pattern.
- Magic link `emailRedirectTo: window.location.origin + '/dashboard'`.
- All Supabase mutations gated behind authenticated session; client never trusts role claims — RLS enforces.
- Build order:
  1. Design tokens + layout shell + nav/footer
  2. Seed migration + storage buckets + roles
  3. Landing → Careers directory → Career detail
  4. Companies directory → Company detail
  5. Auth + dashboard (profile, careers links, interview upload)
  6. Admin moderation queue
  7. Bookmarks page + SEO polish
