# Vertical slice — Phase 1 setup (DB + seed)

Apply migration **`017_vertical_slice_registration_rpcs.sql`** to your Supabase project (`supabase db push`, Dashboard SQL, or CI) **before** frontend work that calls these RPCs.

## Regenerate TypeScript types after migrate

From repo root, with CLI logged in to the project that has the migration applied:

```bash
supabase gen types typescript --project-id huzcvjyyyuudchnrosvx --schema public > src/integrations/supabase/types.ts
```

If you use a different project ref, substitute it. Until the migration is applied remotely, keep the three RPC entries in `src/integrations/supabase/types.ts` in sync with this migration (or regenerate once after push).

## Seed: one event + four ready participants + one admin operator

Run in the **SQL editor** (service role) or a one-off script. Replace UUID placeholders with real `auth.users.id` values from your project.

### 1) Operator is admin

```sql
insert into public.user_roles (user_id, role)
values ('<OPERATOR_USER_UUID>', 'admin')
on conflict (user_id, role) do nothing;
```

### 2) Four participants: questionnaire ready

Minimal path used by the slice lock: **`matching_responses.completed_at` set**.

```sql
insert into public.matching_responses (user_id, completed_at, full_name, email, phone)
values
  ('<P1_UUID>', now(), 'Participant One', 'p1@example.com', '+972500000001'),
  ('<P2_UUID>', now(), 'Participant Two', 'p2@example.com', '+972500000002'),
  ('<P3_UUID>', now(), 'Participant Three', 'p3@example.com', '+972500000003'),
  ('<P4_UUID>', now(), 'Participant Four', 'p4@example.com', '+972500000004')
on conflict (user_id) do update
set completed_at = excluded.completed_at;
```

### 3) One active, published slice event

```sql
insert into public.events (
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
  is_published,
  payment_required,
  price_cents,
  currency
)
values (
  '<OPERATOR_USER_UUID>',
  '<OPERATOR_USER_UUID>',
  'Vertical slice test gathering',
  'End-to-end slice test. Small in-person gathering.',
  'Tel Aviv',
  'Neighborhood TBD — details after confirmation',
  now() + interval '14 days',
  now() + interval '7 days',
  4,
  'active',
  true,
  false,
  0,
  'ils'
)
returning id;
```

Save the returned `id` as **`EVENT_ID`** for URLs and tests.

### 4) Optional: reuse STAGING validation users

If you use STAGING (`huzcvjyyyuudchnrosvx`), run:

```bash
npm run staging:validation-users
```

Then map **Admin1** → operator (`user_roles`), **P1–P4** → the four participants, and insert `matching_responses` / `events` as above using the printed UUIDs.

## Verification checklist (RPCs)

Prereqs: JWT as the right user; rows exist as described.

| RPC | Caller | Required row state | Expected result |
|-----|--------|-------------------|-------------------|
| `decline_registration_response` | Participant JWT (`user_id` = row owner) | `status = awaiting_response` | `status = rejected`, `expires_at` null |
| `admin_decline_pending_registration` | Admin JWT | `status = pending` | `status = rejected` |
| `admin_mark_attended` | Admin JWT | `status = confirmed` | `status = attended` |

Negative checks (expect exceptions):

- `decline_registration_response` as wrong user → `forbidden_registration_decline`
- `decline_registration_response` when status is `pending` → `registration is not awaiting a response`
- Admin RPCs as non-admin → `unauthorized_admin_only`
- `admin_mark_attended` when status is not `confirmed` → `registration is not confirmed`
