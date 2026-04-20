# Dev A Apply Transition Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add deterministic participant E2E coverage for `/apply` transition behavior and dashboard/apply lifecycle parity without expanding fixture infrastructure.

**Architecture:** Extend `e2e/participant-foundation.spec.ts` with narrowly-scoped transition and parity tests that reuse `withFlippedRegistrationStatus` and existing participant auth fixtures. Keep implementation test-first: add each failing test, run targeted RED/GREEN, then run full suite and sync active audit baseline if inventory changes.

**Tech Stack:** Playwright, Supabase staging fixture helpers, React Router participant flows

---

## File map

- Modify: `e2e/participant-foundation.spec.ts`
- Modify: `docs/superpowers/plans/2026-04-21-dev-a-remaining-work-audit-and-plan.md` (only if suite count changes)
- Do not touch: fixture plumbing (`e2e/fixtures/**`), foundation-owned trees, host/admin surfaces

---

### Task 1: Add missing deterministic `/apply` status tests (`confirmed`, `no_show`)

**Files:**
- Modify: `e2e/participant-foundation.spec.ts`

- [ ] **Step 1: Write failing tests**

Add two tests:

```ts
test('apply: confirmed status shows reserved-place panel', async ({ browser }) => { /* ... */ });
test('apply: no_show status shows completed-event panel', async ({ browser }) => { /* ... */ });
```

Both tests must:
- force status via `withFlippedRegistrationStatus`
- authenticate as `ENV.EMAILS.P1`
- open `/events/${ENV.EVENT_ID}/apply`
- assert participant-visible Hebrew panel semantics

- [ ] **Step 2: Run RED for each test**

Run:

```bash
npx playwright test e2e/participant-foundation.spec.ts --project=chromium -g "apply: confirmed status shows reserved-place panel"
npx playwright test e2e/participant-foundation.spec.ts --project=chromium -g "apply: no_show status shows completed-event panel"
```

Expected: at least one assertion mismatch before refinement.

- [ ] **Step 3: Minimal assertion/code fix**

Align assertions with real participant copy. Only touch production code if a genuine behavior bug appears.

- [ ] **Step 4: Run GREEN for each test**

Re-run the same two targeted commands and expect PASS.

---

### Task 2: Add `/apply` confirm-action transition regression

**Files:**
- Modify: `e2e/participant-foundation.spec.ts`

- [ ] **Step 1: Write failing transition test**

Add:

```ts
test('apply: awaiting_response confirm CTA transitions to reserved-place state', async ({ browser }) => { /* ... */ });
```

Setup:
- force `awaiting_response` with future `expires_at` (`+24h` buffer minimum)

Flow/assertions:
- open `/apply`
- click `אישור המקום הזמני`
- assert success toast/message
- assert reserved-state panel semantics now visible
- assert confirm CTA no longer rendered

- [ ] **Step 2: Run RED**

Run:

```bash
npx playwright test e2e/participant-foundation.spec.ts --project=chromium -g "apply: awaiting_response confirm CTA transitions to reserved-place state"
```

Expected: fail before final assertion tuning.

- [ ] **Step 3: Minimal fix**

Tune deterministic waits/assertions only; avoid over-broad sleep/timeouts.

- [ ] **Step 4: Run GREEN**

Re-run the same targeted command and expect PASS.

---

### Task 3: Add dashboard/apply parity regression

**Files:**
- Modify: `e2e/participant-foundation.spec.ts`

- [ ] **Step 1: Write failing parity test**

Add:

```ts
test('dashboard and apply remain consistent for awaiting_response lifecycle semantics', async ({ browser }) => { /* ... */ });
```

Flow:
- force `awaiting_response` future window
- load `/dashboard`, assert CTA `לתגובה על המקום הזמני`
- navigate from row CTA into `/apply`
- assert matching temporary-offer panel semantics (`נשמר עבורך מקום זמני` and deadline affordance)

- [ ] **Step 2: Run RED**

Run:

```bash
npx playwright test e2e/participant-foundation.spec.ts --project=chromium -g "dashboard and apply remain consistent for awaiting_response lifecycle semantics"
```

- [ ] **Step 3: Minimal fix**

Use stable user-visible assertions and route checks; no production changes unless a real mismatch exists.

- [ ] **Step 4: Run GREEN**

Re-run targeted command and expect PASS.

---

### Task 4: Full verification + baseline sync

**Files:**
- Verify only
- Modify docs only if inventory changed

- [ ] **Step 1: Run typecheck**

```bash
npm run typecheck
```

Expected: exit `0`.

- [ ] **Step 2: Run focused participant regression sweep**

```bash
npx playwright test e2e/participant-foundation.spec.ts --project=chromium -g "apply:|dashboard and apply remain consistent"
```

Expected: all targeted tests pass.

- [ ] **Step 3: Run full Chromium suite**

```bash
npx playwright test --project=chromium
```

Expected: all tests pass.

- [ ] **Step 4: Sync active audit docs if count changed**

Update only active baseline guidance in:

```md
docs/superpowers/plans/2026-04-21-dev-a-remaining-work-audit-and-plan.md
```

---

### Task 5: Ship in small reviewable commits

**Files:**
- Stage per task

- [ ] **Step 1: Commit Task 1**

```bash
git add e2e/participant-foundation.spec.ts
git commit -m "test(dev-a): cover confirmed and no_show apply states"
```

- [ ] **Step 2: Commit Task 2 + Task 3**

```bash
git add e2e/participant-foundation.spec.ts
git commit -m "test(dev-a): add apply confirm transition and dashboard parity regressions"
```

- [ ] **Step 3: Commit doc sync (if needed)**

```bash
git add docs/superpowers/plans/2026-04-21-dev-a-remaining-work-audit-and-plan.md
git commit -m "docs(dev-a): sync audit baseline to latest participant suite count"
```

---

## Self-review

- **Spec coverage:** Covers all approved narrow-scope requirements: transition behavior, missing representative states, parity check, and verification gates.
- **Placeholder scan:** No TODO/TBD placeholders remain.
- **Type consistency:** Uses existing fixture/auth helpers and established test naming conventions in `participant-foundation.spec.ts`.
