create or replace function public.get_public_event_social_signals(event_ids uuid[])
returns table (
  event_id uuid,
  attendee_count integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.id as event_id,
    coalesce(
      count(er.*) filter (
        where er.status in ('approved', 'confirmed', 'attended')
      ),
      0
    )::integer as attendee_count
  from public.events e
  left join public.event_registrations er
    on er.event_id = e.id
  where e.is_published = true
    and e.id = any(event_ids)
  group by e.id;
$$;

revoke all on function public.get_public_event_social_signals(uuid[]) from public;
grant execute on function public.get_public_event_social_signals(uuid[]) to anon, authenticated;
