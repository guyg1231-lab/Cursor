create or replace function public.release_stale_email_claims(
  p_stale_before interval default interval '15 minutes'
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_released_count integer := 0;
begin
  update public.event_registrations
  set msg_temporary_offer_claiming_at = null
  where msg_temporary_offer_claiming_at is not null
    and msg_temporary_offer_sent_at is null
    and msg_temporary_offer_claiming_at < now() - p_stale_before;

  get diagnostics v_released_count = row_count;
  return v_released_count;
end;
$$;

revoke all on function public.release_stale_email_claims(interval) from public;
revoke all on function public.release_stale_email_claims(interval) from authenticated;
grant execute on function public.release_stale_email_claims(interval) to service_role;
