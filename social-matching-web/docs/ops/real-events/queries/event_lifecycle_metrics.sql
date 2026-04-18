-- =============================================================================
-- Real-world lifecycle metrics — query pack (one event)
-- Usage: Find-replace ALL occurrences of the placeholder UUID below with your
--        event id, then run each section separately in the SQL editor.
-- Tables: event_registrations, email_queue, message_logs, events
-- =============================================================================

with p as (
  select '00000000-0000-0000-0000-000000000000'::uuid as event_id
)
-- -----------------------------------------------------------------------------
-- 1) Event basics
-- -----------------------------------------------------------------------------
select e.id, e.title, e.starts_at, e.max_capacity, e.status, e.is_published
from public.events e
cross join p
where e.id = p.event_id;

-- -----------------------------------------------------------------------------
-- 2) Current registrations by status (counts + optional detail)
-- -----------------------------------------------------------------------------
with p as (
  select '00000000-0000-0000-0000-000000000000'::uuid as event_id
)
select er.status, count(*)::integer as cnt
from public.event_registrations er
cross join p
where er.event_id = p.event_id
group by er.status
order by er.status;

-- Detail rows (trim columns in UI if noisy)
with p as (
  select '00000000-0000-0000-0000-000000000000'::uuid as event_id
)
select er.id as registration_id,
       er.user_id,
       er.status,
       er.selection_outcome,
       er.selection_rank,
       er.offered_at,
       er.expires_at,
       er.created_at,
       er.updated_at
from public.event_registrations er
cross join p
where er.event_id = p.event_id
order by er.created_at asc;

-- -----------------------------------------------------------------------------
-- 3) Offer cohort — temporary_offer from email_queue (preferred if populated)
-- -----------------------------------------------------------------------------
with p as (
  select '00000000-0000-0000-0000-000000000000'::uuid as event_id
)
select distinct on (eq.registration_id)
       eq.registration_id,
       eq.status as queue_status,
       eq.sent_at,
       eq.created_at as queued_at,
       eq.idempotency_key
from public.email_queue eq
cross join p
where eq.event_id = p.event_id
  and eq.template_key = 'temporary_offer'
order by eq.registration_id, eq.sent_at nulls last, eq.created_at desc;

-- Count distinct offers issued (M1)
with p as (
  select '00000000-0000-0000-0000-000000000000'::uuid as event_id
)
select count(distinct eq.registration_id)::integer as offers_issued
from public.email_queue eq
cross join p
where eq.event_id = p.event_id
  and eq.template_key = 'temporary_offer'
  and eq.status = 'sent';

-- -----------------------------------------------------------------------------
-- 4) Offer cohort — message_logs fallback (if queue rows pruned but logs kept)
-- -----------------------------------------------------------------------------
with p as (
  select '00000000-0000-0000-0000-000000000000'::uuid as event_id
)
select distinct on (ml.registration_id)
       ml.registration_id,
       ml.status,
       ml.created_at as logged_at
from public.message_logs ml
cross join p
where ml.event_id = p.event_id
  and ml.template_key = 'temporary_offer'
  and ml.registration_id is not null
order by ml.registration_id, ml.created_at desc;

-- -----------------------------------------------------------------------------
-- 5) Approved emails (non-orchestrated direct approve path + post-refill)
-- -----------------------------------------------------------------------------
with p as (
  select '00000000-0000-0000-0000-000000000000'::uuid as event_id
)
select eq.registration_id,
       eq.status as queue_status,
       eq.sent_at,
       eq.created_at as queued_at
from public.email_queue eq
cross join p
where eq.event_id = p.event_id
  and eq.template_key = 'approved'
order by eq.sent_at nulls last, eq.created_at desc;

-- -----------------------------------------------------------------------------
-- 6) Offer cohort → current outcome (join email sent to registration status)
-- -----------------------------------------------------------------------------
with p as (
  select '00000000-0000-0000-0000-000000000000'::uuid as event_id
),
offered as (
  select distinct eq.registration_id,
         min(eq.sent_at) filter (where eq.sent_at is not null) as first_offer_sent_at,
         min(eq.created_at) as first_queued_at
  from public.email_queue eq
  cross join p
  where eq.event_id = p.event_id
    and eq.template_key = 'temporary_offer'
    and eq.status = 'sent'
  group by eq.registration_id
)
select o.registration_id,
       o.first_offer_sent_at,
       er.status as registration_status,
       er.updated_at as registration_updated_at,
       case
         when er.status in ('confirmed', 'approved') then 'committed'
         when er.status = 'cancelled' then 'cancelled'
         when er.status = 'waitlist' then 'likely_expired_or_requeued'
         when er.status = 'awaiting_response' then 'still_pending_offer'
         else 'other'
       end as coarse_outcome
from offered o
join public.event_registrations er on er.id = o.registration_id
cross join p
where er.event_id = p.event_id
order by o.first_offer_sent_at nulls last;

-- -----------------------------------------------------------------------------
-- 7) Final committed seats (capacity-relevant statuses)
-- -----------------------------------------------------------------------------
with p as (
  select '00000000-0000-0000-0000-000000000000'::uuid as event_id
)
select count(*)::integer as committed_seats
from public.event_registrations er
cross join p
where er.event_id = p.event_id
  and er.status in ('confirmed', 'approved');

-- -----------------------------------------------------------------------------
-- 8) Attendance / no-show (only if you record these statuses)
-- -----------------------------------------------------------------------------
with p as (
  select '00000000-0000-0000-0000-000000000000'::uuid as event_id
)
select er.status, count(*)::integer as cnt
from public.event_registrations er
cross join p
where er.event_id = p.event_id
  and er.status in ('attended', 'no_show')
group by er.status;

-- -----------------------------------------------------------------------------
-- 9) Stuck awaiting_response past expires_at (sanity check)
-- -----------------------------------------------------------------------------
with p as (
  select '00000000-0000-0000-0000-000000000000'::uuid as event_id
)
select er.id as registration_id,
       er.user_id,
       er.expires_at,
       now() as checked_at
from public.event_registrations er
cross join p
where er.event_id = p.event_id
  and er.status = 'awaiting_response'
  and er.expires_at is not null
  and er.expires_at <= now()
order by er.expires_at asc;
