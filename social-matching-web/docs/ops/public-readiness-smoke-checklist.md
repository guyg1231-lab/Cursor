# Public readiness — post-deploy smoke checklist

Use after **production** (or production-like) deploy of the Vite app. Adjust URLs to your host.

**Prereqs:** Env vars set (`VITE_*` / Supabase), auth redirect URLs allow this origin, DNS correct.

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
