create table if not exists public.email_templates (
  key public.template_key_type primary key,
  subject text not null,
  html_body text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid null,
  constraint email_templates_updated_by_fkey
    foreign key (updated_by)
    references public.profiles (id)
    on delete set null
);

create table if not exists public.email_queue (
  id uuid primary key default extensions.gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  event_id uuid not null,
  registration_id uuid not null,
  user_id uuid not null,
  template_key public.template_key_type not null,
  status public.message_status_type not null default 'queued',
  idempotency_key text null,
  retry_count integer not null default 0,
  next_attempt_at timestamptz null,
  sent_at timestamptz null,
  provider_message_id text null,
  last_error text null,
  error_code text null,
  error_reason text null,
  error_message text null,
  constraint email_queue_event_id_fkey
    foreign key (event_id)
    references public.events (id)
    on delete cascade,
  constraint email_queue_registration_id_fkey
    foreign key (registration_id)
    references public.event_registrations (id)
    on delete cascade,
  constraint email_queue_user_id_fkey
    foreign key (user_id)
    references public.profiles (id)
    on delete cascade
);

create table if not exists public.message_logs (
  id uuid primary key default extensions.gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_id uuid null,
  registration_id uuid null,
  user_id uuid null,
  template_key public.template_key_type not null,
  status public.message_status_type not null,
  provider_message_id text null,
  error_code text null,
  error text null,
  constraint message_logs_event_id_fkey
    foreign key (event_id)
    references public.events (id)
    on delete set null,
  constraint message_logs_registration_id_fkey
    foreign key (registration_id)
    references public.event_registrations (id)
    on delete set null,
  constraint message_logs_user_id_fkey
    foreign key (user_id)
    references public.profiles (id)
    on delete set null
);
