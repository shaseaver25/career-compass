## Problem

Two issues compound the broken sign-in flow:

1. **Magic-link race condition.** When the magic link lands on `/dashboard#access_token=…`, Supabase needs a moment to parse the hash and fire `SIGNED_IN`. Our `useAuth` calls `getSession()` in parallel — it resolves first with `null`, flips `loading` to `false`, and `RequireRole` immediately bounces the user to `/auth?redirect=/dashboard`. By the time the session is actually established, we're already back on the login page.

2. **No onboarding for new reps.** A brand-new rep has no `companies` row, so even after we fix the redirect the dashboard is just an empty form. The user wants an explicit "create your company dashboard" moment.

## Fix

### 1. Resolve the auth race

Update `src/hooks/useAuth.tsx`:

- Detect an auth callback in the URL (`window.location.hash` contains `access_token` or `?code=`). If present, **do not** mark `loading=false` from `getSession()` — wait for the first `onAuthStateChange` event instead.
- Track loading off the first auth event we see (whichever arrives first: initial session or state change), so the provider only reports "ready" once Supabase has finished processing the URL.
- Roles fetch stays gated behind the same readiness flag.

This eliminates the false-negative redirect on `/dashboard` after a magic-link click.

### 2. Make `/auth` forward-aware

`src/pages/Auth.tsx` already redirects when `user` is set, but only after `authLoading` is false. With fix #1 that becomes reliable. Add a small belt-and-suspenders check: if the URL has an auth hash, render a spinner instead of the sign-in form while we wait.

### 3. First-time "Create company dashboard" modal

In `src/pages/Dashboard.tsx`:

- After the `my-company` query resolves, if `company === null`, open a modal (`<Dialog>`) titled **"Create your company dashboard"** instead of showing the empty inline form.
- Modal fields: company name (required), industry, city, state, logo emoji.
- On submit:
  - Insert into `companies` with `owner_id = user.id`, generated slug, `status = 'draft'`.
  - Insert primary `company_locations` row if city/state filled.
  - Invalidate the `my-company` query.
  - Close the modal — the dashboard now renders normally, scrolled to the profile card with a toast: "Dashboard created. Finish your profile, then submit for review."
- Modal cannot be dismissed without either creating or signing out (no accidental empty state).

No schema changes — `companies` and `company_locations` already exist with correct RLS.

### Technical notes

- `useAuth` change is the critical fix; everything else builds on it.
- Keep `RequireRole`'s loading spinner; it now actually waits for the real signal.
- The modal reuses the existing form state shape in `Dashboard.tsx` so the second-pass edit screen stays identical.
- No new dependencies.

### Files touched

- `src/hooks/useAuth.tsx` — fix loading state for URL-callback case
- `src/pages/Auth.tsx` — show spinner when an auth hash is present
- `src/pages/Dashboard.tsx` — add "Create company dashboard" dialog for new reps
