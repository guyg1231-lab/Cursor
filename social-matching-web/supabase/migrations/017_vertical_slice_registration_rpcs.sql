-- Vertical slice: participant decline + operator decline pending + operator mark attended.
-- Locked transitions only; no new statuses; no workflow engine.

create or replace function public.decline_registration_response(
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

  if v_registration.user_id <> v_user_id then
    raise exception 'forbidden_registration_decline';
  end if;

  if v_registration.status <> 'awaiting_response' then
    raise exception 'registration is not awaiting a response';
  end if;

  update public.event_registrations
  set
    status = 'rejected',
    expires_at = null
  where id = v_registration.id
  returning *
  into v_registration;

  registration_id := v_registration.id;
  status := v_registration.status;
  return next;
end;
$$;

create or replace function public.admin_decline_pending_registration(
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
  v_registration public.event_registrations%rowtype;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'unauthorized_admin_only';
  end if;

  select *
  into v_registration
  from public.event_registrations
  where id = p_registration_id
  for update;

  if not found then
    raise exception 'registration not found';
  end if;

  if v_registration.status <> 'pending' then
    raise exception 'registration is not pending';
  end if;

  update public.event_registrations
  set status = 'rejected'
  where id = v_registration.id
  returning *
  into v_registration;

  registration_id := v_registration.id;
  status := v_registration.status;
  return next;
end;
$$;

create or replace function public.admin_mark_attended(
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
  v_registration public.event_registrations%rowtype;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'unauthorized_admin_only';
  end if;

  select *
  into v_registration
  from public.event_registrations
  where id = p_registration_id
  for update;

  if not found then
    raise exception 'registration not found';
  end if;

  if v_registration.status <> 'confirmed' then
    raise exception 'registration is not confirmed';
  end if;

  update public.event_registrations
  set status = 'attended'
  where id = v_registration.id
  returning *
  into v_registration;

  registration_id := v_registration.id;
  status := v_registration.status;
  return next;
end;
$$;

revoke all on function public.decline_registration_response(uuid) from public;
grant execute on function public.decline_registration_response(uuid) to authenticated;

revoke all on function public.admin_decline_pending_registration(uuid) from public;
grant execute on function public.admin_decline_pending_registration(uuid) to authenticated;

revoke all on function public.admin_mark_attended(uuid) from public;
grant execute on function public.admin_mark_attended(uuid) to authenticated;
