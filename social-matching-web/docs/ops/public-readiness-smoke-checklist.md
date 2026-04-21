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

- [x] Both pass against **staging** before promoting deploy recipe to prod.

## 6. Latest verification evidence

- Date: 2026-04-21
- Branch context: `dev-a/circles-core-domain-v0`
- Command: `npm run typecheck && npx playwright test --project=chromium`
- Result: PASS (`65 passed`, Chromium full suite)
- Note: This confirms code-level gate health; staging URL/manual browser smoke items above remain required before go-live.
