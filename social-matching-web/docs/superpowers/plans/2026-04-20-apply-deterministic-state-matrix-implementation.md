# Apply Deterministic State Matrix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand `/apply` Playwright coverage only for participant states that the current registration fixture layer can force deterministically.

**Architecture:** Keep the existing broad readiness alternation test for non-deterministic branches, and add targeted per-state tests around `withFlippedRegistrationStatus` in `e2e/participant-foundation.spec.ts`. Do not add new fixture plumbing for event/profile/questionnaire mutation in this plan.

**Tech Stack:** Playwright, Supabase staging fixtures, React/Vite participant app

---

## File map

- Modify: `e2e/participant-foundation.spec.ts`
- Verify: `e2e/fixtures/registrations.ts` is sufficient as-is
- Do not touch: `src/pages/apply/ApplyPage.tsx` unless a real behavior bug is exposed by RED tests

---

### Task 1: Add the `pending` `/apply` regression

**Files:**
- Modify: `e2e/participant-foundation.spec.ts`

- [ ] **Step 1: Write the failing test**

Add:

```ts
test('apply: pending registration shows the submitted-state panel', async ({ browser }) => {
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
    { status: 'pending', expires_at: null, offered_at: null },
    async () => {
      const ctx = await browser.newContext();
      try {
        await authenticateAs(ctx, ENV.EMAILS.P1);
        const page = await ctx.newPage();
        await page.goto(`/events/${ENV.EVENT_ID}/apply`);
        await expect(page.getByRole('heading', { name: 'סטטוס ההרשמה' })).toBeVisible();
        await expect(page.getByText('ההגשה שלך נשלחה', { exact: true })).toBeVisible();
      } finally {
        await ctx.close();
      }
    },
  );
});
```

- [ ] **Step 2: Run RED**

Run:

```bash
npx playwright test e2e/participant-foundation.spec.ts --project=chromium -g "apply: pending registration shows the submitted-state panel"
```

Expected: FAIL if the visible assertion is too specific or current UI differs.

- [ ] **Step 3: Make the minimal test/code fix**

If the UI already supports the behavior, tighten only the assertion to match the real participant-visible copy. If the UI is wrong, fix only the minimal `/apply` behavior.

- [ ] **Step 4: Run GREEN**

Run the same targeted command and expect PASS.

---

### Task 2: Add the `waitlist` `/apply` regression

**Files:**
- Modify: `e2e/participant-foundation.spec.ts`

- [ ] **Step 1: Write the failing test**

Add a `waitlist` state test that forces:

```ts
{ status: 'waitlist', expires_at: null, offered_at: null }
```

and asserts the participant sees the `/apply` status surface with the waitlist copy.

- [ ] **Step 2: Run RED**

Run:

```bash
npx playwright test e2e/participant-foundation.spec.ts --project=chromium -g "apply: waitlist"
```

Expected: FAIL before adjustment.

- [ ] **Step 3: Minimal implementation/assertion fix**

Match the real waitlist branch and keep assertions user-visible.

- [ ] **Step 4: Run GREEN**

Re-run the targeted command and expect PASS.

---

### Task 3: Add the completed-state `/apply` regression

**Files:**
- Modify: `e2e/participant-foundation.spec.ts`

- [ ] **Step 1: Write one failing test for a completed state**

Prefer one representative completed branch first:

```ts
{ status: 'attended', expires_at: null, offered_at: null }
```

Assert the participant sees the “event already ended” style panel rather than a live apply form.

- [ ] **Step 2: Run RED**

Run:

```bash
npx playwright test e2e/participant-foundation.spec.ts --project=chromium -g "apply: attended"
```

Expected: FAIL before refinement.

- [ ] **Step 3: Minimal implementation/assertion fix**

If `attended` and `no_show` share the same participant-visible panel, one representative test is enough for this task.

- [ ] **Step 4: Run GREEN**

Re-run targeted command and expect PASS.

---

### Task 4: Decide whether to split `confirmed` / `approved`

**Files:**
- Modify: `e2e/participant-foundation.spec.ts` only if useful

- [ ] **Step 1: Inspect whether `confirmed` and `approved` are visually identical**

Check `src/features/applications/presentation.ts` and `/apply` rendering. If both map to the same visible participant copy, keep one representative test only.

- [ ] **Step 2: If needed, add a single representative reserved-place test**

Use either `confirmed` or `approved`, not both, unless the UI diverges in a visible way.

- [ ] **Step 3: Run the targeted test**

Run the appropriate `-g` command and expect PASS.

---

### Task 5: Preserve the honest alternation test

**Files:**
- Modify: `e2e/participant-foundation.spec.ts` only if comments need tightening

- [ ] **Step 1: Keep the existing broad blocked/readiness alternation test**

Do not delete the current test that covers the non-deterministic readiness reasons.

- [ ] **Step 2: If necessary, update its comment**

Clarify that:

- deterministic registration-state branches now have dedicated tests
- questionnaire-incomplete and event-closed remain broad coverage until real fixture helpers exist

---

### Task 6: Full verification

**Files:**
- Verify only

- [ ] **Step 1: Run typecheck**

```bash
npm run typecheck
```

Expected: exit `0`

- [ ] **Step 2: Run the full Chromium suite**

```bash
npx playwright test --project=chromium
```

Expected: all tests pass on the updated baseline.

- [ ] **Step 3: If the test count changed, sync active audit docs**

Update only active guidance docs that mention the live suite count.

---

## Self-review

- **Spec coverage:** Tasks cover deterministic `/apply` state additions, preserve the broad alternation test, and avoid new fixture plumbing.
- **Placeholder scan:** No `TBD` / “write tests later” placeholders remain.
- **Type consistency:** All tasks rely on the existing `withFlippedRegistrationStatus` helper and `e2e/participant-foundation.spec.ts`.
