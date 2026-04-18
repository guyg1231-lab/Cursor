-- Guard: paid events cannot be confirmed via RPC (Stripe webhook only).
-- Non-orchestrated refill: payment_required events use temporary-offer path (never direct approve).

create or replace function public.confirm_registration_response(
  p_registration_id uuid
)
returns table(
  registration_id uuid,
  status public.registration_status
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_registration public.event_registrations%rowtype;
  v_payment_required boolean;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  select *
  into v_registration
  from public.event_registrations
  where id = p_registration_id
  for update;

  if not found then
    raise exception 'registration not found';
  end if;

  if v_registration.user_id <> v_user_id and not public.is_admin(v_user_id) then
    raise exception 'forbidden_registration_confirmation';
  end if;

  if v_registration.status <> 'awaiting_response' then
    raise exception 'registration is not awaiting a response';
  end if;

  if v_registration.expires_at is null or v_registration.expires_at <= now() then
    raise exception 'offer has expired';
  end if;

  select coalesce(e.payment_required, false)
  into v_payment_required
  from public.events e
  where e.id = v_registration.event_id;

  if v_payment_required then
    raise exception 'payment_required_use_checkout_webhook';
  end if;

  update public.event_registrations
  set status = 'confirmed'
  where id = v_registration.id
  returning *
  into v_registration;

  registration_id := v_registration.id;
  status := v_registration.status;
  return next;
end;
$$;

create or replace function public.prepare_next_waitlist_refill_offers(
  p_event_id uuid,
  p_slots integer default 1,
  p_timeout_hours integer default 24,
  p_excluded_registration_ids uuid[] default '{}'
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prepared_count integer := 0;
  v_slot integer := 0;
  v_target_slots integer := 0;
  v_remaining_slots integer := 0;
  v_candidate_id uuid;
  v_candidate public.event_registrations%rowtype;
  v_is_orchestrated boolean;
  v_event_payment_required boolean;
  v_queue_id uuid;
  v_queue_status public.message_status_type;
  v_idempotency_key text;
begin
  if p_slots is null or p_slots <= 0 then
    return 0;
  end if;

  perform 1
  from public.events
  where id = p_event_id
  for update;

  v_remaining_slots := public.remaining_event_offer_slots(p_event_id);
  if v_remaining_slots <= 0 then
    return 0;
  end if;

  v_target_slots := least(p_slots, v_remaining_slots);

  select exists (
    select 1
    from public.event_registrations
    where event_id = p_event_id
      and selection_batch_id is not null
  )
  into v_is_orchestrated;

  while v_slot < v_target_slots loop
    v_candidate_id := public.pick_next_refill_candidate(p_event_id, p_excluded_registration_ids);

    if v_candidate_id is null then
      exit;
    end if;

    if v_is_orchestrated then
      perform *
      from public.internal_offer_registration_with_timeout(v_candidate_id, p_timeout_hours);
      v_prepared_count := v_prepared_count + 1;
    else
      select *
      into v_candidate
      from public.event_registrations
      where id = v_candidate_id
      for update;

      select coalesce(e.payment_required, false)
      into v_event_payment_required
      from public.events e
      where e.id = v_candidate.event_id;

      if v_event_payment_required then
        perform *
        from public.internal_offer_registration_with_timeout(v_candidate_id, p_timeout_hours);
        v_prepared_count := v_prepared_count + 1;
      else
        update public.event_registrations
        set status = 'approved'
        where id = v_candidate.id;

        v_idempotency_key := concat(v_candidate.id::text, ':approved');

        select queue_id, queue_status, idempotency_key
        into v_queue_id, v_queue_status, v_idempotency_key
        from public.enqueue_email_queue(
          v_candidate.event_id,
          v_candidate.id,
          v_candidate.user_id,
          'approved',
          v_idempotency_key
        );

        v_prepared_count := v_prepared_count + 1;
      end if;
    end if;

    v_slot := v_slot + 1;
  end loop;

  return v_prepared_count;
end;
$$;
