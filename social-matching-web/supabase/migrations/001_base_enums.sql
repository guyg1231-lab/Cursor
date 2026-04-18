create extension if not exists pgcrypto with schema extensions;

do $$
begin
  create type public.app_role as enum ('participant', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.preferred_language_type as enum ('he', 'en');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.funnel_status_type as enum (
    'needs_questionnaire',
    'ready_for_registration',
    'registration_pending',
    'registration_waitlist',
    'registration_approved',
    'registration_rejected',
    'registration_cancelled',
    'attended',
    'no_show'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.event_status as enum (
    'draft',
    'submitted_for_review',
    'rejected',
    'active',
    'closed',
    'completed'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.registration_status as enum (
    'pending',
    'waitlist',
    'awaiting_response',
    'confirmed',
    'approved',
    'rejected',
    'cancelled',
    'attended',
    'no_show'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.selection_outcome_type as enum (
    'selected',
    'waitlist'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.message_status_type as enum (
    'queued',
    'sent',
    'failed',
    'skipped_test_mode'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.template_key_type as enum (
    'registration_received',
    'approved',
    'rejected',
    'reminder_evening_before',
    'location_morning_of',
    'temporary_offer'
  );
exception
  when duplicate_object then null;
end $$;
