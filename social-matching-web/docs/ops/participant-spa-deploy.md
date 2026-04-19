# Deploying the participant SPA (Vite + Supabase)

**Audience:** Whoever ships `social-matching-web` to staging or production.  
**Related:** [`.env.production.example`](../../.env.production.example), [`public-readiness-smoke-checklist.md`](public-readiness-smoke-checklist.md), [`e2e-slice.md`](e2e-slice.md) (local validation only).

## 1. Build

From `social-matching-web/`:

```bash
npm ci
npm run typecheck
npm run build
```

Artifacts land in `dist/`. It is a static SPA; the server must serve `index.html` for client-side routes (history fallback).

Preview locally:

```bash
npm run preview
```

## 2. Environment variables (runtime)

Set in the hosting provider (or `.env.production` locally for preview — **never commit secrets**):

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser-safe anon key |
| `VITE_SUPABASE_PROJECT_ID` | Project ref (diagnostics / links) |
| `VITE_SUPPORT_EMAIL` | Optional — if set, landing shows a **צור קשר** `mailto:` link |

See [`.env.production.example`](../../.env.production.example) for shape. **Staging** vs **production** must use **different** Supabase projects/keys when both exist.

Service role keys and DB URLs belong to **Edge/cron/ops**, not the Vite bundle.

## 3. Supabase Auth URLs

In Supabase Dashboard → Authentication → URL configuration:

- **Site URL** — production app origin (e.g. `https://app.example.com`).
- **Redirect URLs** — include your app origin with paths used by the auth flow, e.g. `https://app.example.com/auth/callback` (add staging origins separately).

Mismatch here is the most common “works locally, fails in prod” issue.

## 4. Hosting checklist

- HTTPS enabled.
- All routes (`/events`, `/questionnaire`, `/dashboard`, …) resolve to the SPA (no 404 on refresh).
- Correct cache headers for `index.html` (often short TTL) vs hashed assets (long TTL).

## 5. After deploy

Run [`public-readiness-smoke-checklist.md`](public-readiness-smoke-checklist.md) against the deployed URL, then keep `npm run typecheck` + `npx playwright test --project=chromium` green on `main` for regressions.
