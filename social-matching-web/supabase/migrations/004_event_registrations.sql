create table if not exists public.event_registrations (
  id uuid primary key default extensions.gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_id uuid not null,
  user_id uuid not null,
  status public.registration_status not null default 'pending',
  questionnaire_completed boolean not null default false,
  application_answers jsonb null,
  offered_at timestamptz null,
  expires_at timestamptz null,
  selection_batch_id uuid null,
  selection_outcome public.selection_outcome_type null,
  selection_rank integer null,
  msg_registration_received_sent_at timestamptz null,
  msg_approved_sent_at timestamptz null,
  msg_rejected_sent_at timestamptz null,
  msg_reminder_sent_at timestamptz null,
  msg_location_sent_at timestamptz null,
  msg_temporary_offer_sent_at timestamptz null,
  msg_temporary_offer_claiming_at timestamptz null,
  constraint event_registrations_event_id_fkey
    foreign key (event_id)
    references public.events (id)
    on delete cascade,
  constraint event_registrations_user_id_fkey
    foreign key (user_id)
    references public.profiles (id)
    on delete cascade
);
