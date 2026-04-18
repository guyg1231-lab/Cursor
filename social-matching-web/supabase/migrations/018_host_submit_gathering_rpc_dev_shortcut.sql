-- Host-submission vertical slice — TEMPORARY DEV/STAGING SHORTCUT.
--
-- This RPC publishes a gathering in one step, bypassing the intended
-- draft → submitted_for_review → admin review → active workflow.
-- It exists ONLY to remove SQL seeding of events so the validated
-- participant + operator loop is reachable end-to-end through the UI.
--
-- Guardrails:
--   * Name carries the `_dev_shortcut` suffix so callers never mistake
--     it for a production contract.
--   * Frontend call is additionally gated by the Vite build flag
--     VITE_ENABLE_HOST_DEV_SHORTCUT; the page is unreachable in prod.
--   * Must be DROPPED (or `revoke execute ... from authenticated`) on
--     prod once the admin-review UI can take `submitted_for_review`
--     events to `active + is_published=true`.
--
-- Exit criteria: the first admin-review surface that can publish a
-- `submitted_for_review` event replaces this RPC. See
-- docs/ops/host-submission-shortcut.md.

-- Clean up the earlier unnamed variant if it was applied before the rename.
drop function if exists public.host_submit_gathering(text, text, timestamptz, timestamptz, integer);

create or replace function public.host_submit_gathering_dev_shortcut(
  p_title text,
  p_city text,
  p_starts_at timestamptz,
  p_registration_deadline timestamptz,
  p_max_capacity integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_event_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  if not public.is_questionnaire_ready(v_user_id) then
    raise exception 'questionnaire not ready';
  end if;

  if p_title is null or length(btrim(p_title)) = 0 then
    raise exception 'title_required';
  end if;

  if p_city is null or length(btrim(p_city)) = 0 then
    raise exception 'city_required';
  end if;

  if p_starts_at is null or p_starts_at <= now() then
    raise exception 'starts_at_must_be_future';
  end if;

  if p_registration_deadline is null
     or p_registration_deadline <= now()
     or p_registration_deadline >= p_starts_at then
    raise exception 'registration_deadline_invalid';
  end if;

  if p_max_capacity is null or p_max_capacity < 5 or p_max_capacity > 8 then
    raise exception 'max_capacity_out_of_range';
  end if;

  insert into public.events (
    created_by_user_id,
    host_user_id,
    title,
    city,
    starts_at,
    registration_deadline,
    max_capacity,
    status,
    is_published
  )
  values (
    v_user_id,
    v_user_id,
    btrim(p_title),
    btrim(p_city),
    p_starts_at,
    p_registration_deadline,
    p_max_capacity,
    'active',
    true
  )
  returning id into v_event_id;

  return v_event_id;
end;
$$;

comment on function public.host_submit_gathering_dev_shortcut(text, text, timestamptz, timestamptz, integer) is
  'TEMPORARY dev/staging shortcut: publishes an event directly as active + is_published=true without admin review. Must be dropped (or its execute grant revoked) on prod before exposing host submission there. See docs/ops/host-submission-shortcut.md. Replaces the intended draft -> submitted_for_review -> admin review -> active workflow for slice validation only.';

revoke all on function public.host_submit_gathering_dev_shortcut(text, text, timestamptz, timestamptz, integer) from public;
grant execute on function public.host_submit_gathering_dev_shortcut(text, text, timestamptz, timestamptz, integer) to authenticated;
