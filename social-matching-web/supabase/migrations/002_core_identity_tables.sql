create table if not exists public.profiles (
  id uuid primary key,
  created_at timestamptz not null default now(),
  full_name text not null default '',
  email text not null default '',
  phone text not null default '',
  preferred_language public.preferred_language_type not null default 'he',
  funnel_status public.funnel_status_type not null default 'needs_questionnaire',
  questionnaire_draft jsonb null,
  constraint profiles_id_fkey
    foreign key (id)
    references auth.users (id)
    on delete cascade
);

create table if not exists public.matching_responses (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz null,
  full_name text null,
  email text null,
  phone text null,
  social_link text null,
  social_link_platform text null,
  birth_date date null,
  current_place text null,
  origin_place text null,
  language_pref text null,
  q22_interests text[] null,
  q13_social_style text null,
  q17_recharge text null,
  q20_meeting_priority text[] null,
  q_match_preference text null,
  q25_motivation text null,
  q26_about_you text null,
  q27_comfort_needs text null,
  constraint matching_responses_user_id_fkey
    foreign key (user_id)
    references public.profiles (id)
    on delete cascade
);

create table if not exists public.user_roles (
  id uuid primary key default extensions.gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null,
  role public.app_role not null default 'participant',
  constraint user_roles_user_id_fkey
    foreign key (user_id)
    references public.profiles (id)
    on delete cascade
);
