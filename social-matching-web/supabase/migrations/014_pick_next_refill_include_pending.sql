-- Non-orchestrated refill: FIFO (created_at ASC) over pending + waitlist in one pool.
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
