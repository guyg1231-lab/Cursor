-- Remove the temporary host-submission dev/staging shortcut RPC.
--
-- Context: migration 018 introduced `public.host_submit_gathering_dev_shortcut`
-- as a SECURITY DEFINER one-step publish path so the validated participant +
-- operator loop could be reached without SQL seeding while the admin-review
-- surface was being built. That surface now exists (`/admin/event-requests`,
-- see docs/ops/admin-review-slice.md) and host submissions flow through
-- `/host/events` -> `submitted_for_review` -> admin approve -> `active +
-- is_published=true`, which reuses the `events_update_admin` RLS policy with
-- no SECURITY DEFINER.
--
-- This migration drops the shortcut function so the only supported host-to-
-- live-event path is the admin-review slice.
--
-- Exit criteria (from docs/ops/host-submission-shortcut.md) are now met:
--   * /admin/event-requests exists and is green in E2E
--   * /host/events is the canonical host submission surface
--   * No active code path or test references the shortcut RPC
--
-- Rollback: re-apply migration 018 if the admin-review surface is somehow
-- pulled. There is no data stored by the function itself; it only issues
-- inserts that are indistinguishable from admin-approved events.

drop function if exists public.host_submit_gathering_dev_shortcut(
  text,
  text,
  timestamptz,
  timestamptz,
  integer
);
