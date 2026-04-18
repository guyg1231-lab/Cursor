# Circles vertical slice — E2E guide

This doc describes the **locked vertical slice** currently covered by automated
tests, how to run those tests, and what is intentionally out of scope.

## What the validated slice includes

End-to-end, the slice exercises one event with exactly 4 participants and one
operator, across three UI surfaces:

| Surface | Route | Who | What it does |
|---|---|---|---|
| Participant gathering page | `/gathering/:eventId` | Signed-in participant | Submit intake form (`full_name`, `phone`, `why_join`) → accept or decline an invitation |
| Auth entry | `/sign-in` | Anyone | (Production path only — E2E tests bypass OTP, see below) |
| Operator admin page | `/team/gathering/:eventId` | Signed-in admin | Send invitations to the 4 pending applicants, mark attended once all 4 confirmed |

Backend RPCs exercised (migration [`017_vertical_slice_registration_rpcs.sql`](../../supabase/migrations/017_vertical_slice_registration_rpcs.sql) + earlier):

- `register_or_reregister_with_email` — participant submit
- `offer_registration_with_timeout` — operator "send invitations"
- `confirm_registration_response` / `decline_registration_response` — participant accept / decline
- `admin_decline_pending_registration` — operator decline (not exercised in happy/decline specs but present)
- `admin_mark_attended` — operator "mark attended"

Registration state transitions proven by the tests:

```
pending → awaiting_response → confirmed → attended       (happy path)
pending → awaiting_response → rejected (expires_at=null)  (decline path)
```

## How to run the E2E tests

Prerequisites (one-time):

1. `.env.staging.local` at repo root, containing the standard STAGING vars plus:
   - `STAGING_VALIDATION_SHARED_PASSWORD` (used by `authenticateAs`)
   - `STAGING_ADMIN1_EMAIL`, `STAGING_P1_EMAIL` … `STAGING_P4_EMAIL`
2. `e2e/.env.e2e` with `E2E_EVENT_ID` pointing at a seeded slice event.
   - See `e2e/.env.e2e.example` for the shape.
   - See [`vertical-slice-phase1-setup.md`](./vertical-slice-phase1-setup.md) for the SQL seed (operator admin role, 4 matching-ready participants, one active+published event with `max_capacity >= 4`).
3. Staging users created. From repo root:
   ```bash
   npm run staging:validation-users
   ```
4. Install browsers once:
   ```bash
   npm run e2e:install
   ```

Run:

```bash
npm run e2e         # headless
npm run e2e:ui      # Playwright UI mode
```

The harness starts Vite on port 5173 automatically (see `playwright.config.ts`,
`webServer` block). Each test's `beforeAll` wipes `event_registrations` for the
configured event id before running, so tests are safe to re-run.

## Auth strategy (why no OTP)

Production participants and operators sign in with email OTP via `/sign-in`.
That flow is **not automatable from tests without a mail inbox**, so the harness
does not drive it. Instead:

1. `e2e/fixtures/auth.ts#authenticateAs` calls `supabase.auth.signInWithPassword`
   on the Node side using `STAGING_VALIDATION_SHARED_PASSWORD`.
2. The resulting session is injected into the browser context via
   `page.addInitScript` under the key `sb-<projectRef>-auth-token` (the same
   slot `@supabase/supabase-js` reads from `localStorage`).
3. When the page loads, the app boots already authenticated and the OTP screen
   is skipped entirely.

This is a **test-only** shortcut; it requires the shared-password seeding script
and the service role key in the test environment.

## Current limitations (what the E2E does NOT prove)

- **Real OTP / email delivery.** `/sign-in` itself is never rendered in tests.
- **Auth redirect flows** beyond the post-auth `returnTo` allowlist.
- **Payments.** Slice intentionally has `payment_required = false`; price/checkout are untested.
- **Waitlist, refill, multi-event scheduling, nearby / live layers.** All out of scope.
- **Concurrency.** Tests run serially with a single worker (`workers: 1`).
- **Operator cohort size other than 4.** Buttons are gated on exactly 4 rows in the right status — this is by design for the slice, not a general feature.
- **Host submission flow.** Not part of this slice.

## Intentionally out of scope

- New event creation UI, host dashboards, host moderation.
- Any participant-facing screens other than `/gathering/:eventId`.
- Any operator screens other than `/team/gathering/:eventId`.
- Payment, pricing, invoicing.
- Email templating and delivery.
- Mobile / responsive polish beyond what ships today.

## Files that make up the harness

- `playwright.config.ts`
- `e2e/.env.e2e` / `e2e/.env.e2e.example`
- `e2e/fixtures/env.ts` — env loader + `STORAGE_KEY` derivation
- `e2e/fixtures/supabase.ts` — anon + service-role clients
- `e2e/fixtures/auth.ts` — `authenticateAs(context, email)` via session injection
- `e2e/fixtures/db.ts` — `resetEventRegistrations`, `fetchRegistrationsByEmail`, `fetchStatusForEmail`
- `e2e/fixtures/ui.ts` — shared participants list + `submitApplicationViaUi`
- `e2e/slice-happy-path.spec.ts`
- `e2e/slice-decline-path.spec.ts`
