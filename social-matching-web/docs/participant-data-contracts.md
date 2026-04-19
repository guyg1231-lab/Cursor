# Participant-facing data contracts (stability notes for Dev B)

**Purpose:** Public-readiness plan **F.1** — document what participant flows rely on so host/admin work does not break them unintentionally.

## Auth

- Supabase Auth session drives `ProtectedRoute` and `useAuth()`.
- Email magic link / OTP flows expect **`/auth/callback`** as OAuth/magic redirect target (see Supabase Auth URL allow-list).

## Events

- Public discovery reads **published, active** events appropriate to the product query (see `src/features/events` / listing API).
- Event detail and apply URLs are **`/events/:eventId`** and **`/events/:eventId/apply`**.

## Applications (`event_registrations`)

- Participant UI depends on **`registration_status`** values and timestamps (`expires_at`, etc.) as modeled in [`src/integrations/supabase/types.ts`](../src/integrations/supabase/types.ts) and interpreted in [`src/features/applications/status.ts`](../src/features/applications/status.ts).
- **Breaking change policy:** renaming statuses or removing columns used by apply/dashboard/gathering requires a coordinated migration + participant UI pass + E2E updates.

## Profile / readiness

- Questionnaire persistence and readiness checks use **`profiles`** and related matching response tables (see `ProfileBaseQuestionnaire` and readiness helpers).
- Readiness gates **apply** via shared rules consumed on `ApplyPage`.

## Gathering

- Participant gathering at **`/gathering/:eventId`** consumes the same registration row shape as apply/dashboard for status display.

When in doubt, run **`e2e/participant-foundation.spec.ts`** after schema or RPC changes that touch these paths.
