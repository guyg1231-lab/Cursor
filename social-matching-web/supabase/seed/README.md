# STAGING Validation Seed

This seed set is for the STAGING project only:
- project ref: `huzcvjyyyuudchnrosvx`

It prepares the minimum data needed for curated lifecycle validation:
- one admin role assignment
- one host user plus five participant users marked questionnaire-ready
- two active published validation events

It does **not** create:
- registrations
- selection output
- temporary offers
- confirmations

## Validation Users

- `Admin1` = `a89b55e6-0fbc-4f64-90c6-56c043af38b6`
- `Host1` = `db4c5cd5-0d06-4606-8e77-619a9418e87e`
- `P1` = `7b9d96ac-c8ee-44fd-8d3d-67541a3b6e8d`
- `P2` = `ae6f4555-4b56-4bcb-8721-0f70458aa8b9`
- `P3` = `d3168d08-2d14-481f-bd6f-078987d554d1`
- `P4` = `86e57b38-9631-48f9-85af-434625409715`
- `P5` = `d9ca233f-0b2e-49ad-b5ad-4e6326108872`

## Validation Events

These event ids are deterministic so repeated seed runs stay easy to reference:

- `E1` orchestrated test event
  - `11111111-1111-4111-8111-111111111111`
- `E2` non-orchestrated fallback test event
  - `22222222-2222-4222-8222-222222222222`

`E1` only becomes orchestrated after you later call `record_event_selection_output(...)`.
`E2` remains non-orchestrated as long as you never record selection metadata for it.

## Run Order

Run the seed files in this order:

1. `supabase/seed/001_validation_roles_and_readiness.sql`
2. `supabase/seed/002_validation_events.sql`

Apply them in the STAGING SQL editor or through your normal STAGING SQL execution path.

Do not run these files against PROD.

## Scenario-scoped queue checks

When validating a lifecycle run, `email_queue` (and related logs) may still contain rows from earlier experiments on the same STAGING project. For clearer forensics:

- Filter by **`registration_id`** (or known validation user/event scope) and, when comparing to a single run, restrict by **`created_at >=`** the start time of that scenario.
- Correlate HTTP responses from **`process-email-queue`** with rows: each `processed[]` entry includes **`registration_id`**, **`template_key`**, and **`event_id`** alongside **`id`** and status.

This reduces confusion between stale queue noise and the current validation pass.
