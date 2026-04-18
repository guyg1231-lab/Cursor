-- STAGING-oriented payment foundation: event pricing + registration payment attempts.
-- No new registration_status values; capacity rules unchanged.

do $$
begin
  create type public.registration_payment_status as enum (
    'open',
    'processing',
    'succeeded',
    'failed',
    'canceled',
    'expired'
  );
exception
  when duplicate_object then null;
end $$;

alter table public.events
  add column if not exists payment_required boolean not null default false,
  add column if not exists price_cents integer not null default 0,
  add column if not exists currency text not null default 'ils';

alter table public.events
  drop constraint if exists events_payment_required_price_ok;

alter table public.events
  add constraint events_payment_required_price_ok
  check (not payment_required or price_cents > 0);

create table if not exists public.registration_payments (
  id uuid primary key default extensions.gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  registration_id uuid not null
    references public.event_registrations (id)
    on delete cascade,
  event_id uuid not null
    references public.events (id)
    on delete cascade,
  user_id uuid not null
    references public.profiles (id)
    on delete cascade,
  provider text not null default 'stripe',
  provider_checkout_session_id text null,
  provider_payment_intent_id text null,
  status public.registration_payment_status not null default 'open',
  amount_cents integer not null,
  currency text not null,
  metadata jsonb null,
  constraint registration_payments_amount_positive check (amount_cents > 0)
);

create unique index if not exists registration_payments_one_open_per_registration
  on public.registration_payments (registration_id)
  where status = 'open';

create unique index if not exists registration_payments_stripe_session_uidx
  on public.registration_payments (provider_checkout_session_id)
  where provider_checkout_session_id is not null;

create index if not exists registration_payments_registration_id_idx
  on public.registration_payments (registration_id);

drop trigger if exists set_registration_payments_updated_at on public.registration_payments;

create trigger set_registration_payments_updated_at
  before update on public.registration_payments
  for each row
  execute function public.set_updated_at();

alter table public.registration_payments enable row level security;

create policy registration_payments_select_own_or_admin
  on public.registration_payments
  for select
  using (
    user_id = auth.uid()
    or public.is_admin()
  );
