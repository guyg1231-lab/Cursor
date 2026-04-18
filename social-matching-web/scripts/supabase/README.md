# Supabase One-off Scripts

This folder contains small, reproducible repo-local scripts for STAGING-only backend operations.

**Vertical slice (Phase 1 — DB + seed after migration `017`):** see [../../docs/ops/vertical-slice-phase1-setup.md](../../docs/ops/vertical-slice-phase1-setup.md).

## STAGING Edge functions: secrets and queue processor auth

These notes apply to the STAGING project (`huzcvjyyyuudchnrosvx`) when invoking or debugging `process-email-queue` and `send-event-email`.

**Secrets (Supabase Dashboard → Edge Functions → Secrets)**

- **`SUPABASE_URL`**, **`SUPABASE_SERVICE_ROLE_KEY`**, **`SUPABASE_ANON_KEY`** — provided by the platform for Edge runtime; the queue processor uses the service role client for DB access.
- **`PROCESS_EMAIL_QUEUE_SERVICE_KEY`** — optional shared secret. When set, `process-email-queue` accepts this value for both the `apikey` header and `Authorization: Bearer …` (in addition to the service role key). Use one dedicated value for queue invocations so operators are not blocked when a dashboard JWT does not match the Edge runtime service role.
- **`GMAIL_USER`**, **`GMAIL_APP_PASSWORD`**, **`EMAIL_FROM_ADDRESS`** — used by `send-event-email` when sending via Gmail SMTP from Edge.

**CLI limitation**

- `supabase secrets set` **cannot** define names that start with `SUPABASE_`. Configure those via the Dashboard (or rely on platform-injected values). Non-`SUPABASE_*` secrets (for example `PROCESS_EMAIL_QUEUE_SERVICE_KEY`, Gmail) can be set via CLI or Dashboard.

**Calling `process-email-queue` from scripts or curl**

- Send **`apikey`** and **`Authorization: Bearer <token>`** using the **same** token you configured as `PROCESS_EMAIL_QUEUE_SERVICE_KEY` (or the service role secret that matches the Edge runtime). Mismatch causes **403 Forbidden**.

See also **`.env.staging.example`** for local variable names that mirror this setup (`STAGING_PROCESS_EMAIL_QUEUE_SERVICE_KEY`, `STAGING_SUPABASE_ANON_KEY`).

## STAGING payment Edge functions (Stripe)

Functions: **`create-stripe-checkout`** (JWT required), **`stripe-webhook`** (no JWT; Stripe signature only).

**Secrets (Dashboard → Edge Functions → Secrets)**

- **`STRIPE_SECRET_KEY`** — Stripe secret API key (test mode for STAGING).
- **`STRIPE_WEBHOOK_SECRET`** — signing secret from the Stripe webhook endpoint (test mode).
- **`PAYMENT_CHECKOUT_SUCCESS_URL`** / **`PAYMENT_CHECKOUT_CANCEL_URL`** — redirect URLs after Checkout (may include `{CHECKOUT_SESSION_ID}` per [Stripe docs](https://docs.stripe.com/payments/checkout/custom-success-page)).
- **`SUPABASE_URL`**, **`SUPABASE_ANON_KEY`**, **`SUPABASE_SERVICE_ROLE_KEY`** — same as other Edge functions.

Register the webhook URL in Stripe: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook` with event **`checkout.session.completed`**.

**DB:** apply migrations **`015_payment_foundation_schema.sql`** and **`016_payment_foundation_rpcs.sql`**, then set `events.payment_required`, `price_cents`, and `currency` for test events (STAGING only).

## `create-staging-validation-users.ts`

Purpose:
- create the seven STAGING validation auth users programmatically
- verify each auth user has a matching `public.profiles` row
- print/write their UUIDs in structured JSON

This script is intentionally hard-guarded to the STAGING project:
- project ref must be `huzcvjyyyuudchnrosvx`
- URL must be `https://huzcvjyyyuudchnrosvx.supabase.co`

### Required local environment variables

- `STAGING_PROJECT_REF`
- `STAGING_SUPABASE_URL`
- `STAGING_SUPABASE_SERVICE_ROLE_KEY`
- `STAGING_VALIDATION_SHARED_PASSWORD`
- `STAGING_ADMIN1_EMAIL`
- `STAGING_HOST1_EMAIL`
- `STAGING_P1_EMAIL`
- `STAGING_P2_EMAIL`
- `STAGING_P3_EMAIL`
- `STAGING_P4_EMAIL`
- `STAGING_P5_EMAIL`

Optional:
- `STAGING_VALIDATION_USERS_OUTPUT`
  - default: `output/staging-validation-users.json`

### Explicit validation emails

The script reads these exact email environment variables:

- `STAGING_ADMIN1_EMAIL`
- `STAGING_HOST1_EMAIL`
- `STAGING_P1_EMAIL`
- `STAGING_P2_EMAIL`
- `STAGING_P3_EMAIL`
- `STAGING_P4_EMAIL`
- `STAGING_P5_EMAIL`

### Run

```bash
npm run staging:validation-users
```

### Behavior

- existing auth users are reused by email
- existing user ids are preserved
- existing users are not mutated unless creation is required
- the script fails if any user is missing a matching `public.profiles` row
