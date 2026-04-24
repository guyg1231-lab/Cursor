# Promote staging → production (code + DB)

**Goal:** Ship the **same application commit** you validated on **staging Vercel** to **production Vercel**, with **production Supabase** updated only through **git migrations** (never by copying staging DB wholesale).

**Related:** [Environment parity spec](../specs/2026-04-24-dev-staging-vs-prod-environment-parity-spec.md), [`participant-spa-deploy.md`](participant-spa-deploy.md), [`public-readiness-smoke-checklist.md`](public-readiness-smoke-checklist.md).

---

## 0) Reality check (read first)

- **Staging URL:** `https://social-matching-web-staging.vercel.app` (project `social-matching-web-staging`).
- **Production URL:** `https://social-matching-web.vercel.app` (project `social-matching-web`).
- **Staging DB ref:** `huzcvjyyyuudchnrosvx` — today it can **lag** prod on schema (see parity spec §12). “Promote staging” means **promote the tested app build + git schema**, not dump staging Postgres into prod.

---

## 1) Automated gate (before you click Deploy)

From `social-matching-web/`:

```bash
npm run ops:pre-promote-prod
```

This runs: staging bundle verify, prod bundle verify, SPA bundle compare, `typecheck`, local `build`. Fix failures before promoting.

---

## 2) Git / Vercel (application)

1. Ensure **`main`** (or whichever branch prod tracks) contains the **exact commit** already deployed and smoke-tested on staging.
2. **Production Vercel project** must have correct **Production** env vars (`VITE_SUPABASE_*` → prod ref `nshgmuqlivuhlimwdwhe`). Sync if needed:

   ```bash
   # Link .vercel to PROD project, then:
   npm run ops:sync-vercel-vite-env
   ```

   (Use `VERCEL_PROJECT_ID` / `.vercel/project.json` for the **prod** project when syncing prod.)

3. **Deploy Production:** push to the tracked branch, or Redeploy from Vercel with **Production** target. Env-only changes require a **new** production build.

4. Re-verify after deploy:

   ```bash
   npm run ops:verify-deploy-supabase
   npm run ops:compare-staging-prod-spa-bundles
   ```

---

## 3) Supabase (database)

1. On **prod** project (`nshgmuqlivuhlimwdwhe`), apply any **new migrations from `supabase/migrations/`** that are not yet applied (CLI, CI, or SQL editor — follow your org policy). Order matters.
2. Re-run the **acceptance SQL** from parity spec §8 on **prod** after DDL.
3. **Do not** “restore staging backup onto prod” unless this is an explicit disaster-recovery decision with its own runbook.

---

## 4) Post-release

- [ ] `public-readiness-smoke-checklist.md` on the production URL.
- [ ] Optional: `npm run ops:production-browser-smoke` (see script header for env).

---

## 5) Monorepo note

Production deploys from the **repo root** `vercel.json` (`npm --prefix social-matching-web …`). Staging project is configured the same way. If you deploy only from `social-matching-web/`, ensure the linked Vercel project **Root Directory** matches how that project is wired (see parity spec §12 / Git table).
