-- STAGING ONLY
-- Validation seed: two minimal published active events

insert into public.events (
  id,
  created_by_user_id,
  host_user_id,
  title,
  description,
  city,
  venue_hint,
  starts_at,
  registration_deadline,
  max_capacity,
  status,
  is_published
)
values
  (
    '11111111-1111-4111-8111-111111111111'::uuid,
    'db4c5cd5-0d06-4606-8e77-619a9418e87e'::uuid,
    'db4c5cd5-0d06-4606-8e77-619a9418e87e'::uuid,
    'STAGING Curated Lifecycle E1 Orchestrated Test Event',
    'Validation event for the curated lifecycle happy-path, expiry, cancellation, and ranked refill scenarios.',
    'Tel Aviv',
    'STAGING validation venue A',
    now() + interval '14 days',
    now() + interval '13 days',
    5,
    'active',
    true
  ),
  (
    '22222222-2222-4222-8222-222222222222'::uuid,
    'db4c5cd5-0d06-4606-8e77-619a9418e87e'::uuid,
    'db4c5cd5-0d06-4606-8e77-619a9418e87e'::uuid,
    'STAGING Curated Lifecycle E2 Fallback Test Event',
    'Validation event for the non-orchestrated fallback refill scenario.',
    'Tel Aviv',
    'STAGING validation venue B',
    now() + interval '21 days',
    now() + interval '20 days',
    5,
    'active',
    true
  )
on conflict (id) do update
set
  created_by_user_id = excluded.created_by_user_id,
  host_user_id = excluded.host_user_id,
  title = excluded.title,
  description = excluded.description,
  city = excluded.city,
  venue_hint = excluded.venue_hint,
  starts_at = excluded.starts_at,
  registration_deadline = excluded.registration_deadline,
  max_capacity = excluded.max_capacity,
  status = excluded.status,
  is_published = excluded.is_published,
  updated_at = now();
