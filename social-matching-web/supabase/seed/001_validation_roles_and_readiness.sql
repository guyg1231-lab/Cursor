-- STAGING ONLY
-- Validation seed: admin role + questionnaire/readiness baseline

insert into public.user_roles (user_id, role)
values ('a89b55e6-0fbc-4f64-90c6-56c043af38b6'::uuid, 'admin')
on conflict (user_id, role) do nothing;

update public.profiles
set funnel_status = 'ready_for_registration'
where id in (
  'db4c5cd5-0d06-4606-8e77-619a9418e87e'::uuid,
  '7b9d96ac-c8ee-44fd-8d3d-67541a3b6e8d'::uuid,
  'ae6f4555-4b56-4bcb-8721-0f70458aa8b9'::uuid,
  'd3168d08-2d14-481f-bd6f-078987d554d1'::uuid,
  '86e57b38-9631-48f9-85af-434625409715'::uuid,
  'd9ca233f-0b2e-49ad-b5ad-4e6326108872'::uuid
);

insert into public.matching_responses (
  user_id,
  completed_at,
  updated_at
)
values
  ('db4c5cd5-0d06-4606-8e77-619a9418e87e'::uuid, now(), now()),
  ('7b9d96ac-c8ee-44fd-8d3d-67541a3b6e8d'::uuid, now(), now()),
  ('ae6f4555-4b56-4bcb-8721-0f70458aa8b9'::uuid, now(), now()),
  ('d3168d08-2d14-481f-bd6f-078987d554d1'::uuid, now(), now()),
  ('86e57b38-9631-48f9-85af-434625409715'::uuid, now(), now()),
  ('d9ca233f-0b2e-49ad-b5ad-4e6326108872'::uuid, now(), now())
on conflict (user_id) do update
set
  completed_at = excluded.completed_at,
  updated_at = now();
