alter table public.matching_responses
  add constraint matching_responses_user_id_key unique (user_id);

alter table public.user_roles
  add constraint user_roles_user_id_role_key unique (user_id, role);

alter table public.events
  add constraint events_max_capacity_check
  check (max_capacity is null or max_capacity between 5 and 8);

alter table public.event_registrations
  add constraint event_registrations_event_id_user_id_key unique (event_id, user_id);

alter table public.event_registrations
  add constraint event_registrations_offer_window_check
  check (
    (offered_at is null and expires_at is null)
    or
    (offered_at is not null and expires_at is not null and expires_at > offered_at)
  );

alter table public.event_registrations
  add constraint event_registrations_selection_fields_check
  check (
    (
      selection_batch_id is null
      and selection_outcome is null
      and selection_rank is null
    )
    or
    (
      selection_batch_id is not null
      and selection_outcome is not null
      and selection_rank is not null
    )
  );

alter table public.event_registrations
  add constraint event_registrations_selection_rank_positive_check
  check (selection_rank is null or selection_rank > 0);

create unique index email_queue_idempotency_key_unique
  on public.email_queue (idempotency_key);

create unique index event_registrations_selection_rank_unique
  on public.event_registrations (event_id, selection_batch_id, selection_outcome, selection_rank)
  where selection_batch_id is not null
    and selection_outcome is not null
    and selection_rank is not null;

create index events_public_visibility_idx
  on public.events (is_published, status, starts_at);

create index events_created_by_idx
  on public.events (created_by_user_id, created_at desc);

create index events_host_user_idx
  on public.events (host_user_id, starts_at);

create index matching_responses_user_idx
  on public.matching_responses (user_id);

create index user_roles_lookup_idx
  on public.user_roles (user_id, role);

create index event_registrations_user_idx
  on public.event_registrations (user_id, created_at desc);

create index event_registrations_event_status_idx
  on public.event_registrations (event_id, status, created_at);

create index event_registrations_offer_expiry_idx
  on public.event_registrations (expires_at)
  where status = 'awaiting_response';

create index event_registrations_selection_lookup_idx
  on public.event_registrations (event_id, selection_outcome, selection_rank)
  where selection_batch_id is not null
    and selection_outcome is not null
    and selection_rank is not null;

create index email_queue_status_next_attempt_idx
  on public.email_queue (status, next_attempt_at, created_at);

create index email_queue_registration_template_idx
  on public.email_queue (registration_id, template_key);

create index message_logs_registration_created_idx
  on public.message_logs (registration_id, created_at desc);
