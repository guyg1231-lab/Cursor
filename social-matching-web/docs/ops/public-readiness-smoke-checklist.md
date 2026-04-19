# Public readiness — post-deploy smoke checklist

Use after **production** (or production-like) deploy of the Vite app. Adjust URLs to your host.

**Prereqs:** Env vars set (`VITE_*` / Supabase), auth redirect URLs allow this origin, DNS correct.

## 1. Cold load

- [ ] Open `/` — landing renders Hebrew, no blank screen, no console errors from boot.
- [ ] Hard refresh — same.

## 2. Participant core path

- [ ] `/events` — list or empty state (not stuck loading forever).
- [ ] Open one event `/events/:id` — detail loads or honest not-found.
- [ ] `/auth` — OTP flow starts (or shows expected error if email invalid); no raw English error leaks in UI.
- [ ] `/questionnaire` — page loads; anonymous banner or form per session.
- [ ] `/dashboard` (signed in) — loads or redirects to auth with `returnTo`.

## 3. Legal / trust (when stub pages exist)

- [ ] `/terms` — placeholder or final copy loads.
- [ ] `/privacy` — same.
- [ ] Landing footer links to terms + privacy work.
- [ ] If `VITE_SUPPORT_EMAIL` is set in production, landing shows **צור קשר** and `mailto:` opens the inbox.

## 4. Auth edge

- [ ] `/auth/callback` — resolves (loading then redirect) without infinite spinner when session completes.

## 5. Automated gate (developer)

```bash
cd social-matching-web
npm run typecheck
npx playwright test --project=chromium
```

- [ ] Both pass against **staging** before promoting deploy recipe to prod.
