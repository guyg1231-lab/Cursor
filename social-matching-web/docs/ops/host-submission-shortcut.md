# Host submission dev shortcut — REMOVED on 2026-04-17

**Status:** removed. The temporary dev/staging shortcut that published host
events in one step (`host_submit_gathering_dev_shortcut`) has been deleted from
code, DB, and configuration.

**Replacement:** use the admin-review slice.

- Host submits a draft via `/host/events` → row lands in
  `status = submitted_for_review`, `is_published = false`.
- Admin reviews at `/admin/event-requests` and clicks **Approve & publish** →
  row becomes `status = active`, `is_published = true`,
  `host_user_id = created_by_user_id`.
- Participants and operators then see the event on the unchanged
  `/gathering/:eventId` and `/team/gathering/:eventId` surfaces.

For details of the replacement flow, data contract, exit criteria, and E2E
coverage, see [`docs/ops/admin-review-slice.md`](./admin-review-slice.md).

## What was removed

- DB function `public.host_submit_gathering_dev_shortcut(text, text, timestamptz, timestamptz, integer)` — dropped by
  [`supabase/migrations/019_drop_host_submit_gathering_dev_shortcut.sql`](../../supabase/migrations/019_drop_host_submit_gathering_dev_shortcut.sql).
- Frontend feature directory `src/features/host-submission/` (`api.ts`, `flags.ts`).
- Page `src/pages/host/NewGatheringPage.tsx`.
- Route `/host/new-gathering` in `src/app/router/AppRouter.tsx`.
- Returnto allowlist entry for `/host/new-gathering` in `src/lib/authReturnTo.ts`.
- Env flag `VITE_ENABLE_HOST_DEV_SHORTCUT` from `.env.example`,
  `.env.staging.example`, and `.env.production.example`.
- Generated types entry for `host_submit_gathering_dev_shortcut` in
  `src/integrations/supabase/types.ts`.

The earlier migration `018_host_submit_gathering_rpc_dev_shortcut.sql` is kept
in history for auditability; migration 019 is its explicit inverse.

## Verification

Run against any environment to confirm the function is gone:

```sql
select has_function_privilege(
  'authenticated',
  'public.host_submit_gathering_dev_shortcut(text, text, timestamptz, timestamptz, integer)',
  'execute'
);
-- Expect: the function does not exist (error 42883).
```

## Historical context

The shortcut existed to unblock end-to-end UI validation of the participant +
operator vertical slice before an admin-review surface was available. Once the
admin-review slice (`/admin/event-requests`, documented in
[`admin-review-slice.md`](./admin-review-slice.md)) landed and was covered by
an E2E test, the shortcut became redundant and was removed in full.
