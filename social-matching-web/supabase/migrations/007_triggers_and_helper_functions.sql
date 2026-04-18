create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = coalesce(p_user_id, auth.uid())
      and role = 'admin'
  );
$$;

create or replace function public.is_questionnaire_ready(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.matching_responses mr
    where mr.user_id = p_user_id
      and mr.completed_at is not null
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = p_user_id
      and p.funnel_status in (
        'ready_for_registration',
        'registration_pending',
        'registration_waitlist',
        'registration_approved',
        'registration_rejected',
        'registration_cancelled',
        'attended',
        'no_show'
      )
  );
$$;

create or replace function public.is_event_host(p_event_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.events
    where id = p_event_id
      and host_user_id = coalesce(p_user_id, auth.uid())
  );
$$;

create or replace function public.user_has_registration_for_event(p_event_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.event_registrations
    where event_id = p_event_id
      and user_id = coalesce(p_user_id, auth.uid())
  );
$$;

create or replace function public.remaining_event_offer_slots(p_event_id uuid)
returns integer
language sql
security definer
set search_path = public
as $$
  with event_capacity as (
    select max_capacity
    from public.events
    where id = p_event_id
  ),
  held_slots as (
    select count(*)::integer as held_count
    from public.event_registrations
    where event_id = p_event_id
      and status in ('awaiting_response', 'confirmed', 'approved')
  )
  select greatest(
    0,
    coalesce((select max_capacity from event_capacity), 2147483647)
      - coalesce((select held_count from held_slots), 0)
  );
$$;

create or replace function public.enqueue_email_queue(
  p_event_id uuid,
  p_registration_id uuid,
  p_user_id uuid,
  p_template_key public.template_key_type,
  p_idempotency_key text default null
)
returns table(queue_id uuid, queue_status public.message_status_type, idempotency_key text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_idempotency_key is null then
    insert into public.email_queue (
      event_id,
      registration_id,
      user_id,
      template_key
    )
    values (
      p_event_id,
      p_registration_id,
      p_user_id,
      p_template_key
    )
    returning id, status, email_queue.idempotency_key
    into queue_id, queue_status, idempotency_key;
  else
    -- Dynamic SQL so ON CONFLICT (idempotency_key) resolves to the table column, not RETURNS TABLE output vars.
    execute $sql$
      insert into public.email_queue (
        event_id,
        registration_id,
        user_id,
        template_key,
        idempotency_key
      )
      values ($1, $2, $3, $4::public.template_key_type, $5)
      on conflict (idempotency_key)
      do update
        set updated_at = now()
      returning id, status, email_queue.idempotency_key
    $sql$
    into strict queue_id, queue_status, idempotency_key
    using p_event_id, p_registration_id, p_user_id, p_template_key, p_idempotency_key;
  end if;

  return next;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')
  )
  on conflict (id) do update
    set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_auth_user();

create or replace function public.normalize_event_registration_transition()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status then
    if new.status <> 'awaiting_response' then
      new.offered_at = null;
      new.expires_at = null;
    end if;

    if new.status in ('cancelled', 'rejected', 'attended', 'no_show') then
      new.selection_batch_id = null;
      new.selection_outcome = null;
      new.selection_rank = null;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists normalize_event_registration_transition on public.event_registrations;

create trigger normalize_event_registration_transition
  before update on public.event_registrations
  for each row
  execute function public.normalize_event_registration_transition();

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

  select
    q.enqueued_queue_id,
    q.enqueued_queue_status,
    q.enqueued_idempotency_key
  into v_queue_id, v_queue_status, v_idempotency_key
  from public.enqueue_email_queue(
    v_registration.event_id,
    v_registration.id,
    v_registration.user_id,
    'temporary_offer',
    v_idempotency_key
  ) as q(enqueued_queue_id, enqueued_queue_status, enqueued_idempotency_key);

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

create or replace function public.pick_next_refill_candidate(
  p_event_id uuid,
  p_excluded_registration_ids uuid[] default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_candidate_id uuid;
  v_is_orchestrated boolean;
begin
  select exists (
    select 1
    from public.event_registrations
    where event_id = p_event_id
      and selection_batch_id is not null
  )
  into v_is_orchestrated;

  if v_is_orchestrated then
    select id
    into v_candidate_id
    from public.event_registrations
    where event_id = p_event_id
      and selection_outcome = 'waitlist'
      and status in ('pending', 'waitlist')
      and not (id = any (coalesce(p_excluded_registration_ids, '{}')))
    order by selection_rank asc, created_at asc
    for update skip locked
    limit 1;

    return v_candidate_id;
  end if;

  -- Non-orchestrated: single FIFO pool (created_at ASC) across pending + waitlist.
  select id
  into v_candidate_id
  from public.event_registrations
  where event_id = p_event_id
    and status in ('pending', 'waitlist')
    and not (id = any (coalesce(p_excluded_registration_ids, '{}')))
  order by created_at asc
  for update skip locked
  limit 1;

  return v_candidate_id;
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

    v_slot := v_slot + 1;
  end loop;

  return v_prepared_count;
end;
$$;

create or replace function public.promote_waitlist_on_cancellation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'cancelled'
     and old.status in ('approved', 'confirmed', 'awaiting_response') then
    perform public.prepare_next_waitlist_refill_offers(
      new.event_id,
      1,
      24,
      array[new.id]
    );
  end if;

  return new;
end;
$$;

drop trigger if exists promote_waitlist_on_cancellation on public.event_registrations;

create trigger promote_waitlist_on_cancellation
  after update on public.event_registrations
  for each row
  execute function public.promote_waitlist_on_cancellation();

drop trigger if exists set_matching_responses_updated_at on public.matching_responses;
create trigger set_matching_responses_updated_at
  before update on public.matching_responses
  for each row
  execute function public.set_updated_at();

drop trigger if exists set_events_updated_at on public.events;
create trigger set_events_updated_at
  before update on public.events
  for each row
  execute function public.set_updated_at();

drop trigger if exists set_email_templates_updated_at on public.email_templates;
create trigger set_email_templates_updated_at
  before update on public.email_templates
  for each row
  execute function public.set_updated_at();

drop trigger if exists set_email_queue_updated_at on public.email_queue;
create trigger set_email_queue_updated_at
  before update on public.email_queue
  for each row
  execute function public.set_updated_at();
