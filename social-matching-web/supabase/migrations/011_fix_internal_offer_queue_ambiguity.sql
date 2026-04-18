create or replace function public.internal_offer_registration_with_timeout(
  p_registration_id uuid,
  p_timeout_hours integer default 24
)
returns table(
  registration_id uuid,
  status public.registration_status,
  offered_at timestamptz,
  expires_at timestamptz,
  queue_id uuid,
  queue_status public.message_status_type,
  idempotency_key text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_registration public.event_registrations%rowtype;
  v_offered_at timestamptz;
  v_expires_at timestamptz;
  v_remaining_slots integer;
  v_queue_id uuid;
  v_queue_status public.message_status_type;
  v_idempotency_key text;
begin
  if p_timeout_hours is null or p_timeout_hours <= 0 then
    raise exception 'timeout_hours_must_be_positive';
  end if;

  select *
  into v_registration
  from public.event_registrations
  where id = p_registration_id
  for update;

  if not found then
    raise exception 'registration not found';
  end if;

  if v_registration.status not in ('pending', 'waitlist') then
    raise exception 'registration is not eligible for a temporary offer';
  end if;

  perform 1
  from public.events
  where id = v_registration.event_id
  for update;

  v_remaining_slots := public.remaining_event_offer_slots(v_registration.event_id);
  if v_remaining_slots <= 0 then
    raise exception 'no_capacity_for_temporary_offer';
  end if;

  v_offered_at := now();
  v_expires_at := v_offered_at + make_interval(hours => p_timeout_hours);
  v_idempotency_key := concat(v_registration.id::text, ':temporary_offer:', extract(epoch from v_offered_at)::bigint::text);

  update public.event_registrations
  set
    status = 'awaiting_response',
    offered_at = v_offered_at,
    expires_at = v_expires_at,
    msg_temporary_offer_sent_at = null,
    msg_temporary_offer_claiming_at = null
  where id = v_registration.id;

  select q.queue_id, q.queue_status, q.idempotency_key
  into v_queue_id, v_queue_status, v_idempotency_key
  from public.enqueue_email_queue(
    v_registration.event_id,
    v_registration.id,
    v_registration.user_id,
    'temporary_offer',
    v_idempotency_key
  ) as q;

  registration_id := v_registration.id;
  status := 'awaiting_response';
  offered_at := v_offered_at;
  expires_at := v_expires_at;
  queue_id := v_queue_id;
  queue_status := v_queue_status;
  idempotency_key := v_idempotency_key;

  return next;
end;
$$;
