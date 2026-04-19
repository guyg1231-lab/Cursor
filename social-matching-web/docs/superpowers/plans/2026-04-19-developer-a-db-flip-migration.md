# Plan — D5 Continuation: migrate remaining DB-flip tests

**Branch:** `dev-a/db-flip-migration` (stacked on `dev-a/events-card-contract` → PR #9)
**Scope:** Continuation of D5 from PR #8. Migrate the 4 remaining DB-flip tests in `e2e/participant-foundation.spec.ts` to use `withFlippedRegistrationStatus` (shipped in PR #8). Pure mechanical refactor — no behavior change.

---

## Context

PR #8 introduced `e2e/fixtures/registrations.ts::withFlippedRegistrationStatus(admin, filter, patch, body)` and migrated ONE test as a proof-of-concept (`StatusBadge: apply surface shows current application short label when reapply form visible`). The helper is stable across 2 full-suite runs (18/20 participant + 25/27 full chromium).

4 tests still use the inline pattern:

1. **T-A** `cancelled participant sees open apply form with prior submission summary` (patch `{status: 'cancelled'}`)
2. **T-B** `P1 awaiting temporary offer sees Hebrew deadline footer on apply` (patch `{status, expires_at, offered_at}`)
3. **T-C** `event detail shows temporary-offer deadline as ApplicationStatusPanel footer for awaiting P1` (patch `{status, expires_at, offered_at}`)
4. **T-D** `dashboard lifecycle list shows reserved status chip for confirmed application` (patch `{status: 'confirmed'}`)

## Scope rules

- Modify ONLY `e2e/participant-foundation.spec.ts`.
- Do NOT change the behavior of any test. Assertions, navigation, authentication, and patched values stay semantically identical.
- Do NOT touch `e2e/fixtures/registrations.ts` — the helper is proven; don't extend its signature.
- Typecheck: `npx tsc -b --noEmit`.

## Behavioral preservation — `offered_at` simplification

Tests T-B and T-C currently compute `offered_at: previousOfferedAt ?? new Date().toISOString()`. The rationale is "don't touch the DB's existing `offered_at` if present; set it to now if null." After restore, `offered_at` returns to its original value either way.

In the migrated version, we simplify to `offered_at: new Date().toISOString()` **unconditionally**. Justification:
- The helper's restore phase snapshots `offered_at` BEFORE patching, so it's restored to its original value (null or timestamp).
- The test body's assertions (`/מועד אחרון לתגובה/`, `'מקום זמני ממתין לתגובה'`) depend on `expires_at`-based UI, not `offered_at`.
- Behaviorally equivalent from the test's perspective.
- 3 fewer lines per test (no pre-read of `offered_at`).

If this simplification ever becomes a concern (e.g., a future test asserts on `offered_at`-based UI), the test can pre-read `offered_at` and pass it explicitly to the helper. Until then, YAGNI.

## Execution — 4 commits, one per test

### T-A — cancelled participant (simple status flip)

Replace the test body (profile lookup stays — helper takes `userId`, not email) with:

```typescript
test('cancelled participant sees open apply form with prior submission summary', async ({ browser }) => {
  const admin = createServiceRoleClient();
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id')
    .eq('email', ENV.EMAILS.P1)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile?.id) throw new Error('E2E missing P1 profile');

  await withFlippedRegistrationStatus(
    admin,
    { userId: profile.id, eventId: ENV.EVENT_ID },
    { status: 'cancelled' },
    async () => {
      const ctx = await browser.newContext();
      try {
        await authenticateAs(ctx, ENV.EMAILS.P1);
        const page = await ctx.newPage();
        await page.goto(`/events/${ENV.EVENT_ID}/apply`);
        await expect(page.getByRole('heading', { name: 'פרטים על ההגשה' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'ההגשה הקודמת שלך' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'שליחת הגשה' })).toBeVisible();
      } finally {
        try {
          await ctx.close();
        } catch {
          // Ignore browser context close failures during teardown.
        }
      }
    },
  );
});
```

**Commit:** `test(participant): migrate cancelled-participant test to withFlippedRegistrationStatus`

### T-B — P1 awaiting on /apply (status + expires_at + offered_at)

```typescript
test('P1 awaiting temporary offer sees Hebrew deadline footer on apply', async ({ browser }) => {
  const admin = createServiceRoleClient();
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id')
    .eq('email', ENV.EMAILS.P1)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile?.id) throw new Error('E2E missing P1 profile');

  const futureExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  await withFlippedRegistrationStatus(
    admin,
    { userId: profile.id, eventId: ENV.EVENT_ID },
    {
      status: 'awaiting_response',
      expires_at: futureExpires,
      offered_at: new Date().toISOString(),
    },
    async () => {
      const ctx = await browser.newContext();
      try {
        await authenticateAs(ctx, ENV.EMAILS.P1);
        const page = await ctx.newPage();
        await page.goto(`/events/${ENV.EVENT_ID}/apply`);
        await expect(page.getByText(/מועד אחרון לתגובה/)).toBeVisible();
      } finally {
        try {
          await ctx.close();
        } catch {
          // Ignore browser context close failures during teardown.
        }
      }
    },
  );
});
```

**Commit:** `test(participant): migrate apply-awaiting test to withFlippedRegistrationStatus`

### T-C — P1 awaiting on /events/:id (same patch shape as T-B)

Same body shape as T-B, but navigate to `/events/${ENV.EVENT_ID}` and assert the detail-page-specific strings (`מקום זמני ממתין לתגובה` exact, plus the deadline regex).

**Commit:** `test(participant): migrate event-detail-awaiting test to withFlippedRegistrationStatus`

### T-D — P1 confirmed on /dashboard (simple status flip)

Analogous to T-A but with `{ status: 'confirmed' }` and dashboard assertion (`'המקום שלך שמור'` inside the applications card).

**Commit:** `test(participant): migrate dashboard-confirmed test to withFlippedRegistrationStatus`

---

## Verification (after each commit AND at HEAD)

Per-test gate (run the targeted test after each migration):

```bash
npx tsc -b --noEmit
npx playwright test e2e/participant-foundation.spec.ts --project=chromium -g "<test name pattern>"
```

Final gate (after all 4 commits):

```bash
npx tsc -b --noEmit
npm run build
npx playwright test e2e/participant-foundation.spec.ts --project=chromium
npx playwright test --project=chromium
```

**Expected:**
- Typecheck exit 0.
- Build clean.
- Participant suite: 18 passed, 2 skipped (unchanged baseline).
- Full suite: 25 passed, 2 skipped (matches PR #9 green baseline).

## What this plan explicitly excludes

- No changes to `withFlippedRegistrationStatus` signature or semantics.
- No touching of the PR #8 migrated test (`StatusBadge: apply surface...`); it stays as-is.
- No changes to production code.
- No changes to the plan docs from PR #7, #8, or #9.
- No coverage of new test scenarios; only the 4 existing tests are migrated.
- No attempt to reduce the inline profile lookup (can't be moved into the helper without the helper knowing about emails, which is a coupling Dev A is not ready to take).

## Non-blocking follow-up (for after merge)

The inline profile lookup (`admin.from('profiles').select('id').eq('email', ENV.EMAILS.P1).maybeSingle()` + error checks) is now the ONLY duplicated block across these 5 tests (the 1 from PR #8 + these 4). Extractable as `resolveUserIdByEmail(admin, email)` in `e2e/fixtures/auth.ts` or `e2e/fixtures/db.ts` if the duplication ever becomes painful. Leaving as-is for now — each inline lookup is 6 lines, total duplication is 30 lines across 5 tests; helper would save ~20 lines. Not pressing.
