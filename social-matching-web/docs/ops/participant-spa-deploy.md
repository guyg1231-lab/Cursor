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

Preview locally (needs `VITE_*` present **before** `npm run build`, or use `npm run preview:staging` which builds with `--mode staging` and reads `.env.staging.local`):

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

**Vercel:** for each `VITE_*` variable, open the variable → under *Environment*, enable **Production** and **Preview** (and *Development* if you use `vercel dev`). If Preview is unchecked, preview deployments bake empty values and auth shows “בעיה בהגדרת השרת”. Variables must be present **before** the deployment build runs.

### One-shot sync (CLI + APIs)

Copy [`.env.ops.local.example`](../../.env.ops.local.example) to **`.env.ops.local`** only if you need overrides. The sync script also tries **Vercel CLI** auth (`auth.json` on macOS/Linux), then **`supabase projects api-keys -o json`** when `supabase` is on `PATH` and logged in (works with macOS Keychain even without `~/.supabase/access-token`), then **`SUPABASE_ACCESS_TOKEN`** / **`~/.supabase/access-token`**, and matching **`VITE_*` / `PRODUCTION_*` / `STAGING_*`** in `.env.production.local` / `.env.staging.local` when the ref matches. **`vercel link`** still supplies **`.vercel/project.json`** for project/team ids.

Then from `social-matching-web/`:

```bash
npm run ops:sync-vercel-vite-env
```

Alternatively export the same variables in the shell:

```bash
cd social-matching-web
export VERCEL_TOKEN=…           # https://vercel.com/account/tokens
export VERCEL_PROJECT_ID=…      # prj_… or project name as in the URL
# export VERCEL_TEAM_ID=…       # only if the app lives under a Vercel team
export SUPABASE_ACCESS_TOKEN=…  # same PAT style as prebuilt-prod-deploy
# optional: export SUPABASE_PROJECT_REF=nshgmuqlivuhlimwdwhe
npm run ops:sync-vercel-vite-env
```

This upserts `VITE_SUPABASE_URL`, `VITE_SUPABASE_PROJECT_ID`, and `VITE_SUPABASE_PUBLISHABLE_KEY` (anon / publishable from Management API, **Supabase CLI**, or matching local env) for **production**, **preview**, and **development** targets. Then **redeploy** so a new build inlines them.

Preview with `DRY_RUN=1` (resolves the key the same way as a real run — PAT, CLI, or local env):

```bash
DRY_RUN=1 npm run ops:sync-vercel-vite-env
```

**Concrete refs in this repo (non-secret):** production frontend is shaped around project ref `nshgmuqlivuhlimwdwhe`; local/staging examples use `huzcvjyyyuudchnrosvx`. If Production hosting still bakes in the staging host, you will see intermittent auth issues and misleading smoke results — fix Vercel **Production** `VITE_*` values, then trigger a **new production deploy** (env changes do not rewrite an already-built `dist/`).

After deploy, confirm the live bundle (not only Vercel’s env screen):

```bash
cd social-matching-web
npm run ops:verify-deploy-supabase
# or override:
VERIFY_DEPLOY_URL=https://your-prod-host.example VERIFY_EXPECT_SUPABASE_REF=nshgmuqlivuhlimwdwhe npm run ops:verify-deploy-supabase
```

**Vercel CLI gotcha:** if `vercel deploy --prod` fails immediately with *Git author … must have access to the team*, the team blocks CLI builds when commit metadata points at a non-member. A working path is **prebuilt**: set Production `VITE_*` in the dashboard (so Git-based deploys stay healthy), then locally run `node scripts/ops/prebuilt-prod-deploy.mjs` with `SUPABASE_ACCESS_TOKEN` set (see script header) so `npm run build` inlines the correct Supabase host, then `vercel build` + `vercel deploy --prebuilt --prod`.

**Supabase Management API:** `PATCH /v1/projects/{ref}/config/auth` expects `uri_allow_list` as a **comma-separated** list of redirect URLs (not newline-separated).

Service role keys and DB URLs belong to **Edge/cron/ops**, not the Vite bundle.

## 3. Supabase Auth URLs

Email **OTP vs magic link**: the SPA expects a **6-digit code**; the Supabase “Magic link” template must include `{{ .Token }}`. See [`supabase-auth-email-templates.md`](supabase-auth-email-templates.md).

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
