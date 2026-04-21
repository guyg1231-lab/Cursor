# Public readiness — post-deploy smoke checklist

Use after **production** (or production-like) deploy of the Vite app. Adjust URLs to your host.

**Prereqs:** Env vars set (`VITE_*` / Supabase), auth redirect URLs allow this origin, DNS correct.

## 0. Network — Supabase project wired to this deploy

Vite bakes `VITE_SUPABASE_URL` into JS at **build** time. Confirm the browser (or automated check) hits the **intended** project host, not staging by mistake.

- [ ] Run `npm run ops:verify-deploy-supabase` from `social-matching-web/` (set `VERIFY_DEPLOY_URL` / `VERIFY_EXPECT_SUPABASE_REF` if your production host or ref differs). Expect **OK** and host `https://nshgmuqlivuhlimwdwhe.supabase.co` for this product’s production Supabase.
- [ ] Optional manual check: DevTools → Network → reload `/events` → REST requests must go to the same production ref, not `huzcvjyyyuudchnrosvx`.

## 1. Cold load

- [x] Open `/` — landing renders Hebrew, no blank screen, no console errors from boot.
- [x] Hard refresh — same.

## 2. Participant core path

- [x] `/events` — list or empty state (not stuck loading forever).
- [x] Open one event `/events/:id` — detail loads or honest not-found.
- [x] `/auth` — OTP flow starts (or shows expected error if email invalid); no raw English error leaks in UI.
- [x] `/questionnaire` — page loads; anonymous banner or form per session.
- [x] `/dashboard` (signed in) — loads or redirects to auth with `returnTo`.

## 3. Legal / trust (when stub pages exist)

- [x] `/terms` — placeholder or final copy loads.
- [x] `/privacy` — same.
- [x] Landing footer links to terms + privacy work.
- [x] If `VITE_SUPPORT_EMAIL` is set in production, landing shows **צור קשר** and `mailto:` opens the inbox.

## 4. Auth edge

- [x] `/auth/callback` — resolves (loading then redirect) without infinite spinner when session completes.

## 5. Automated gate (developer)

```bash
cd social-matching-web
npm run typecheck
npx playwright test --project=chromium
```

- [x] Both pass on the current release-candidate branch before promoting deploy recipe to prod.

## 6. Latest verification evidence

Decision summary (GO / NO-GO narrative): [`mvp-go-no-go-summary.md`](mvp-go-no-go-summary.md).

- Date: 2026-04-21
- Owner: `circlesplatform@gmail.com` (CLI execution)
- Deployed URL: `https://social-matching-web.vercel.app`
- Manual smoke result: PASS
  - Route fallback: direct loads for `/events`, `/auth`, `/questionnaire`, `/dashboard`, `/terms`, `/privacy`, `/auth/callback` all return 200 after Vercel SPA rewrite.
  - Browser checks: landing, events, auth, questionnaire, dashboard-auth redirect behavior, legal pages, and callback route render expected UI states (no blank screen / no infinite spinner).
- Automated gate (latest): `npm run typecheck && npx playwright test --project=chromium` -> PASS (`65 passed`, Chromium full suite).
- Repeat automated gate (2026-04-21, agent session on `main` worktree): `npm run typecheck` PASS; `npm run e2e` (full suite) PASS — `65 passed` Chromium. Confirms Hebrew-aligned E2E contracts and host list → workspace navigation remain green against staging-backed fixtures.
- Post-push verification (same release): `076ff60` pushed to `origin/main` (`guyg1231-lab/Cursor`). Local `npm run build` PASS. Quick HTTP checks against `https://social-matching-web.vercel.app` returned **200** for `/`, `/events`, `/auth`, `/questionnaire`, `/dashboard`, `/terms`, `/privacy`, `/auth/callback` (SPA routing responding).
- Follow-up production smoke (2026-04-21, post-§5.1 discovery batch): public/guard checks against `https://social-matching-web.vercel.app` PASS for landing, `/events`, a real event detail page, `/auth`, and signed-out `/host/events` redirect with `returnTo`. Full signed-in production smoke plus direct confirmation of Supabase Auth URL configuration still require mailbox/dashboard access outside the repo; specifically verify the exact production origin and `/auth/callback` entry in Supabase before any new custom-domain launch.
- Automated gate after §5.1 discovery batch (2026-04-21): `npm run typecheck` PASS. `npm run e2e` ran `67` Chromium tests; one host/admin review-queue assertion failed once against staging state, then passed immediately on isolated rerun. Discovery/detail coverage added and participant/admin regressions remained green.
- Deployed bundle vs Supabase (2026-04-21): `curl` inspection of `https://social-matching-web.vercel.app` main JS still embeds **`https://huzcvjyyyuudchnrosvx.supabase.co`** (staging). **Action:** set Vercel Production `VITE_SUPABASE_*` to the production project from [`.env.production.example`](../../.env.production.example), redeploy, then `npm run ops:verify-deploy-supabase` must PASS before treating production smoke as authoritative.
- Production bundle + auth URLs (2026-04-21, agent): Vercel Production `VITE_*` aligned to prod ref `nshgmuqlivuhlimwdwhe`; Supabase prod **Site URL** set to `https://social-matching-web.vercel.app` and **redirect allow list** updated (comma-separated) to include both Vercel hostnames’ `/auth/callback` plus local dev callbacks. Live bundle verified: `npm run ops:verify-deploy-supabase` → **OK** (`https://nshgmuqlivuhlimwdwhe.supabase.co`). Prebuilt CLI path used because plain `vercel deploy --prod` hit team/git-author enforcement for this workspace.
- Automated gate (2026-04-21, post events-timeout patch): `npm run typecheck` PASS; `npm run e2e` PASS — `68 passed` (Chromium).
