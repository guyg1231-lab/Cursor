-- Hardening pass after production restore:
-- 1) lock function search_path for mutable-path advisor warnings.
-- 2) add covering indexes for high-signal FK advisor warnings.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.normalize_event_registration_transition()
returns trigger
language plpgsql
set search_path = public
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

do $$
begin
  if to_regclass('public.email_queue') is not null then
    execute 'create index if not exists email_queue_event_id_idx on public.email_queue (event_id)';
    execute 'create index if not exists email_queue_user_id_idx on public.email_queue (user_id)';
  end if;

  if to_regclass('public.email_templates') is not null then
    execute 'create index if not exists email_templates_updated_by_idx on public.email_templates (updated_by)';
  end if;

  if to_regclass('public.message_logs') is not null then
    execute 'create index if not exists message_logs_event_id_idx on public.message_logs (event_id)';
    execute 'create index if not exists message_logs_user_id_idx on public.message_logs (user_id)';
  end if;

  if to_regclass('public.registration_payments') is not null then
    execute 'create index if not exists registration_payments_event_id_idx on public.registration_payments (event_id)';
    execute 'create index if not exists registration_payments_user_id_idx on public.registration_payments (user_id)';
  end if;
end $$;
