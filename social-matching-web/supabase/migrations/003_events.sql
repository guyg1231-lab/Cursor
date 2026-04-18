create table if not exists public.events (
  id uuid primary key default extensions.gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_user_id uuid null,
  host_user_id uuid null,
  title text not null,
  description text null,
  city text not null,
  venue_hint text null,
  starts_at timestamptz not null,
  registration_deadline timestamptz null,
  max_capacity integer null,
  status public.event_status not null default 'draft',
  is_published boolean not null default false,
  constraint events_created_by_user_id_fkey
    foreign key (created_by_user_id)
    references public.profiles (id)
    on delete set null,
  constraint events_host_user_id_fkey
    foreign key (host_user_id)
    references public.profiles (id)
    on delete set null
);
