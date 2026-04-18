create or replace function public.can_create_event_request(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.is_questionnaire_ready(p_user_id);
$$;

create or replace function public.list_host_event_registration_summaries()
returns table(
  event_id uuid,
  total_applied_like integer,
  awaiting_response integer,
  confirmed_like integer,
  waitlisted integer
)
language sql
security definer
set search_path = public
as $$
  select
    er.event_id,
    count(*) filter (
      where er.status in ('pending', 'awaiting_response', 'confirmed', 'approved', 'waitlist')
    )::integer as total_applied_like,
    count(*) filter (
      where er.status = 'awaiting_response'
    )::integer as awaiting_response,
    count(*) filter (
      where er.status in ('confirmed', 'approved')
    )::integer as confirmed_like,
    count(*) filter (
      where er.status = 'waitlist'
    )::integer as waitlisted
  from public.event_registrations er
  join public.events e
    on e.id = er.event_id
  where e.host_user_id = auth.uid()
  group by er.event_id;
$$;

create or replace function public.register_or_reregister_with_email(
  p_event_id uuid,
  p_birth_date date default null,
  p_social_link text default null,
  p_application_answers jsonb default null
)
returns table(
  registration_id uuid,
  status public.registration_status,
  is_new boolean,
  queue_id uuid,
  queue_status public.message_status_type,
  idempotency_key text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_event public.events%rowtype;
  v_registration public.event_registrations%rowtype;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  if not public.is_questionnaire_ready(v_user_id) then
    raise exception 'questionnaire not ready';
  end if;

  select *
  into v_event
  from public.events
  where id = p_event_id;

  if not found or v_event.is_published is distinct from true then
    raise exception 'event not found';
  end if;

  if v_event.status <> 'active' then
    raise exception 'event is not accepting registrations';
  end if;

  if v_event.registration_deadline is not null and v_event.registration_deadline <= now() then
    raise exception 'registration deadline has passed';
  end if;

  select *
  into v_registration
  from public.event_registrations
  where event_id = p_event_id
    and user_id = v_user_id
  for update;

  if not found then
    insert into public.event_registrations (
      event_id,
      user_id,
      status,
      questionnaire_completed,
      application_answers
    )
    values (
      p_event_id,
      v_user_id,
      'pending',
      true,
      p_application_answers
    )
    returning *
    into v_registration;

    registration_id := v_registration.id;
    status := v_registration.status;
    is_new := true;
    queue_id := null;
    queue_status := null;
    idempotency_key := null;
    return next;
    return;
  end if;

  if v_registration.status in ('cancelled', 'rejected') then
    update public.event_registrations
    set
      status = 'pending',
      questionnaire_completed = true,
      application_answers = p_application_answers,
      selection_batch_id = null,
      selection_outcome = null,
      selection_rank = null
    where id = v_registration.id
    returning *
    into v_registration;

    registration_id := v_registration.id;
    status := v_registration.status;
    is_new := false;
    queue_id := null;
    queue_status := null;
    idempotency_key := null;
    return next;
    return;
  end if;

  raise exception 'only admins can change registration status';
end;
$$;

create or replace function public.record_event_selection_output(
  p_event_id uuid,
  p_selected_registration_ids uuid[] default '{}',
  p_waitlist_registration_ids uuid[] default '{}'
)
returns table(
  selection_batch_id uuid,
  selected_count integer,
  waitlist_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_combined_ids uuid[];
  v_batch_id uuid := extensions.gen_random_uuid();
  v_expected_total integer := 0;
  v_existing_total integer := 0;
  v_selected_updated integer := 0;
  v_waitlist_updated integer := 0;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'unauthorized_admin_only';
  end if;

  v_combined_ids := coalesce(p_selected_registration_ids, '{}') || coalesce(p_waitlist_registration_ids, '{}');

  if exists (
    select 1
    from unnest(v_combined_ids) as value
    group by value
    having count(*) > 1
  ) then
    raise exception 'duplicate registration ids in selection output';
  end if;

  if exists (
    select 1
    from public.event_registrations
    where id = any (v_combined_ids)
      and event_id <> p_event_id
  ) then
    raise exception 'all registrations must belong to the same event';
  end if;

  if exists (
    select 1
    from public.event_registrations
    where id = any (v_combined_ids)
      and status in ('cancelled', 'rejected', 'attended', 'no_show')
  ) then
    raise exception 'selection output cannot include terminal registrations';
  end if;

  v_expected_total := coalesce(cardinality(v_combined_ids), 0);

  select count(*)
  into v_existing_total
  from public.event_registrations
  where id = any (v_combined_ids);

  if v_existing_total <> v_expected_total then
    raise exception 'all selection registration ids must exist';
  end if;

  update public.event_registrations
  set
    selection_batch_id = null,
    selection_outcome = null,
    selection_rank = null
  where event_id = p_event_id;

  with ranked_selected as (
    select value as registration_id, row_number() over () as rank
    from unnest(coalesce(p_selected_registration_ids, '{}')) as value
  )
  update public.event_registrations er
  set
    selection_batch_id = v_batch_id,
    selection_outcome = 'selected',
    selection_rank = ranked_selected.rank
  from ranked_selected
  where er.id = ranked_selected.registration_id;

  get diagnostics v_selected_updated = row_count;

  with ranked_waitlist as (
    select value as registration_id, row_number() over () as rank
    from unnest(coalesce(p_waitlist_registration_ids, '{}')) as value
  )
  update public.event_registrations er
  set
    selection_batch_id = v_batch_id,
    selection_outcome = 'waitlist',
    selection_rank = ranked_waitlist.rank
  from ranked_waitlist
  where er.id = ranked_waitlist.registration_id;

  get diagnostics v_waitlist_updated = row_count;

  if v_selected_updated <> coalesce(cardinality(p_selected_registration_ids), 0) then
    raise exception 'selected registration update count mismatch';
  end if;

  if v_waitlist_updated <> coalesce(cardinality(p_waitlist_registration_ids), 0) then
    raise exception 'waitlist registration update count mismatch';
  end if;

  selection_batch_id := v_batch_id;
  selected_count := v_selected_updated;
  waitlist_count := v_waitlist_updated;
  return next;
end;
$$;

create or replace function public.offer_registration_with_timeout(
  p_registration_id uuid,
  p_timeout_hours integer default 24
)
returns table(
  registration_id uuid,
  status public.registration_status,
  offered_at timestamptz,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result record;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'unauthorized_admin_only';
  end if;

  select *
  into v_result
  from public.internal_offer_registration_with_timeout(p_registration_id, p_timeout_hours);

  registration_id := v_result.registration_id;
  status := v_result.status;
  offered_at := v_result.offered_at;
  expires_at := v_result.expires_at;
  return next;
end;
$$;

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

create or replace function public.expire_offers_and_prepare_refill(
  p_event_id uuid default null,
  p_timeout_hours integer default 24
)
returns table(
  expired_count integer,
  prepared_offer_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
  v_event_expired_ids uuid[];
  v_expired_total integer := 0;
  v_prepared_total integer := 0;
  v_expired_for_event integer;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'unauthorized_admin_only';
  end if;

  for v_event_id in
    select distinct event_id
    from public.event_registrations
    where status = 'awaiting_response'
      and expires_at is not null
      and expires_at <= now()
      and (p_event_id is null or event_id = p_event_id)
  loop
    select coalesce(array_agg(id), '{}')
    into v_event_expired_ids
    from public.event_registrations
    where event_id = v_event_id
      and status = 'awaiting_response'
      and expires_at is not null
      and expires_at <= now();

    v_expired_for_event := coalesce(array_length(v_event_expired_ids, 1), 0);

    if v_expired_for_event = 0 then
      continue;
    end if;

    update public.event_registrations
    set status = 'waitlist'
    where id = any (v_event_expired_ids);

    v_expired_total := v_expired_total + v_expired_for_event;
    v_prepared_total := v_prepared_total + public.prepare_next_waitlist_refill_offers(
      v_event_id,
      v_expired_for_event,
      p_timeout_hours,
      v_event_expired_ids
    );
  end loop;

  expired_count := v_expired_total;
  prepared_offer_count := v_prepared_total;
  return next;
end;
$$;

create or replace function public.cancel_registration_with_email(
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
    raise exception 'forbidden_registration_cancellation';
  end if;

  if v_registration.status in ('cancelled', 'rejected', 'attended', 'no_show') then
    registration_id := v_registration.id;
    status := v_registration.status;
    return next;
    return;
  end if;

  update public.event_registrations
  set status = 'cancelled'
  where id = v_registration.id
  returning *
  into v_registration;

  registration_id := v_registration.id;
  status := v_registration.status;
  return next;
end;
$$;

revoke all on function public.can_create_event_request(uuid) from public;
grant execute on function public.can_create_event_request(uuid) to authenticated;

revoke all on function public.list_host_event_registration_summaries() from public;
grant execute on function public.list_host_event_registration_summaries() to authenticated;

revoke all on function public.register_or_reregister_with_email(uuid, date, text, jsonb) from public;
grant execute on function public.register_or_reregister_with_email(uuid, date, text, jsonb) to authenticated;

revoke all on function public.record_event_selection_output(uuid, uuid[], uuid[]) from public;
grant execute on function public.record_event_selection_output(uuid, uuid[], uuid[]) to authenticated;

revoke all on function public.offer_registration_with_timeout(uuid, integer) from public;
grant execute on function public.offer_registration_with_timeout(uuid, integer) to authenticated;

revoke all on function public.confirm_registration_response(uuid) from public;
grant execute on function public.confirm_registration_response(uuid) to authenticated;

revoke all on function public.expire_offers_and_prepare_refill(uuid, integer) from public;
grant execute on function public.expire_offers_and_prepare_refill(uuid, integer) to authenticated;

revoke all on function public.cancel_registration_with_email(uuid) from public;
grant execute on function public.cancel_registration_with_email(uuid) to authenticated;
