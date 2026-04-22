# Production Content Ops — 10 Minute Checklist

Use this checklist every time you publish/refresh the Tel Aviv MVP activity set.

## 0-2 minutes — preflight

- [ ] You are on the correct branch/worktree for ops changes only.
- [ ] No unexpected local edits (`git status -sb` clean or known).
- [ ] Required env vars exist for target environment:
  - staging: `STAGING_SUPABASE_URL`, `STAGING_SUPABASE_SERVICE_ROLE_KEY`
  - production: `PRODUCTION_SUPABASE_URL`, `PRODUCTION_SUPABASE_SERVICE_ROLE_KEY`

## 2-4 minutes — generate fresh bundle

- [ ] Generate dynamic Tel Aviv bundle:

```bash
node scripts/ops/generate-tel-aviv-content-bundle.mjs
```

- [ ] Confirm generated file exists:
  - `scripts/ops/content/tel-aviv-production-bundle.generated.json`
- [ ] Quick sanity check:
  - 5 events
  - 4 categories represented
  - `city = "Tel Aviv"` for all events

## 4-6 minutes — apply on staging

- [ ] Apply content bundle to staging:

```bash
npm run ops:upsert-content-bundle -- staging scripts/ops/content/tel-aviv-production-bundle.generated.json
```

- [ ] Validate in UI:
  - `/events` shows 5 realistic Tel Aviv activities
  - event details show clean copy
  - legal footer links: `/terms`, `/privacy`, `/guidelines` all render

## 6-8 minutes — apply on production

- [ ] Apply same generated bundle to production:

```bash
npm run ops:upsert-content-bundle -- production scripts/ops/content/tel-aviv-production-bundle.generated.json
```

- [ ] Confirm no errors in CLI output.

## 8-10 minutes — final verification

- [ ] Run production smoke:

```bash
npm run ops:production-browser-smoke
```

- [ ] Manual spot-check:
  - Home
  - Events list
  - One event detail
  - Terms / Privacy / Guidelines

- [ ] Record run timestamp + operator name in ops notes.
