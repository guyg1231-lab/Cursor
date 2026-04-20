# Apply Deterministic State Matrix Design

**Date:** 2026-04-20  
**Owner:** Dev A  
**Status:** Proposed  
**Scope:** Replace the broad A-TEST-1 idea with a narrower, honest Playwright expansion for `/events/:eventId/apply` states that can be forced deterministically with existing registration fixtures.

---

## 1. Context

Dev A’s participant Playwright suite currently includes one broad `/apply` readiness assertion:

- authenticated participant sees at least one blocking readiness message on `/apply`

That test is intentionally honest. It asserts that the page surfaces one of several legitimate blocking/readiness outcomes without pretending staging can deterministically force each branch.

The follow-up item in the audit (`A-TEST-1`) originally described splitting `/apply` into per-reason tests. A fresh audit after PR #24 shows that this is still too broad for current fixtures:

1. **Registration-row-driven states** can be forced deterministically with `withFlippedRegistrationStatus`.
2. **Questionnaire-incomplete** cannot be forced with current helpers because there is no fixture layer for `matching_responses` / `profiles`.
3. **Registration closed** cannot be forced with current helpers because there is no event mutation helper for the relevant event openness inputs.

So the right next step is not “test every `/apply` branch.” It is “split only the branches the current fixture system can force honestly.”

---

## 2. Goals

1. Increase participant `/apply` regression coverage with deterministic tests only.
2. Keep the existing broad alternation test for non-deterministic readiness branches.
3. Reuse the existing `withFlippedRegistrationStatus` helper rather than inventing new staging assumptions.
4. Stay in Dev A-owned files only.

---

## 3. Non-goals

1. Do not add new helpers for mutating `matching_responses`, `profiles`, or event openness in this slice.
2. Do not fake non-deterministic branches with route stubs or mocked UI state.
3. Do not rewrite `ApplyPage` behavior.
4. Do not touch foundation-owned paths or host/admin surfaces.

---

## 4. Audit Result

### 4.1 Where Dev A stands after PR #24

After the dashboard lifecycle compact branch:

- A-FEAT-1 is effectively done for the compact dashboard path.
- Full branch verification is green at **38** Chromium tests.
- Dev A is back in maintenance mode.

The only still-meaningful engineering follow-up is `/apply` test coverage, but only in a narrowed form.

### 4.2 What is honestly testable now

With `withFlippedRegistrationStatus`, the suite can deterministically force:

- `awaiting_response` (live and expired)
- `pending`
- `waitlist`
- `confirmed` / `approved`
- `attended` / `no_show`
- `cancelled` / `rejected` (reapply-eligible control cases, not blocked states)

It cannot yet deterministically force:

- questionnaire incomplete
- event closed

Those remain outside this spec.

---

## 5. Decision Summary

The next Dev A test spec will cover a **deterministic `/apply` state matrix**, not a full readiness matrix.

That means:

- keep the existing alternation test for the “honest unknown” readiness branches
- add targeted per-state tests only for registration states that the current fixture layer can force
- prioritize visible participant outcomes, not exhaustive DB taxonomy

---

## 6. Scope

### 6.1 In scope

Add or tighten `/apply` Playwright tests for:

1. `pending`
   - status surface rendered
   - correct Hebrew panel/title/body visible
2. `waitlist`
   - waitlist copy visible
3. `confirmed` / `approved`
   - reserved-place status surface visible
4. `awaiting_response` live
   - already covered today; preserve it
5. `awaiting_response` expired
   - add explicit expired-window assertion if missing
6. `attended` / `no_show`
   - completed/past-event surface visible

### 6.2 Out of scope

Keep as broad alternation or future fixture work:

1. questionnaire incomplete
2. event closed
3. any helper that mutates event rows, profile rows, or questionnaire completion rows

---

## 7. Test Design Rules

### 7.1 Use real staging truth

Every new `/apply` test must drive the page through a real state that the fixture layer can force with registration-row updates.

If a branch cannot be reached honestly with the current helpers, it does not belong in this spec.

### 7.2 Use visible participant assertions

Each test should assert:

1. the route loads
2. the participant sees the expected Hebrew status surface
3. the key CTA or status badge for that branch is visible where relevant

Assertions should prefer user-visible headings, panel copy, and buttons over internal implementation details.

### 7.3 Keep fixture ownership narrow

Continue using:

- `createServiceRoleClient()`
- profile lookup by email
- `withFlippedRegistrationStatus(...)`
- authenticated browser context

Do not extend `withFlippedRegistrationStatus` unless the existing patch shape is genuinely insufficient.

---

## 8. File Ownership

Expected files:

- modify `e2e/participant-foundation.spec.ts`
- possibly modify `docs/superpowers/plans/2026-04-21-dev-a-remaining-work-audit-and-plan.md` after the work lands

Files explicitly not touched in implementation:

- `src/pages/apply/ApplyPage.tsx` unless a real bug is discovered
- `e2e/fixtures/env.ts`
- foundation-owned trees

---

## 9. Risks and Mitigations

### Risk 1: Test-count growth without meaningful coverage

If the new tests merely restate the same branch with different labels, the suite gets slower without buying much.

**Mitigation:** choose state cases with distinct participant outcomes and copy.

### Risk 2: Accidental fixture dishonesty

If a test starts relying on seeded assumptions outside `event_registrations`, it becomes fragile.

**Mitigation:** constrain the spec to states forceable by `withFlippedRegistrationStatus`.

### Risk 3: Scope creep into new fixture infrastructure

The temptation will be to “just add” profile/event mutation helpers so the matrix looks complete.

**Mitigation:** explicitly leave questionnaire-incomplete and event-closed out of this spec.

---

## 10. Acceptance Criteria

This spec is satisfied when:

1. `/apply` coverage is expanded only for deterministic registration states.
2. The existing broad readiness alternation test remains in place for non-deterministic branches.
3. New tests use `withFlippedRegistrationStatus` rather than ad hoc mutation patterns.
4. `npm run typecheck` passes.
5. `npx playwright test --project=chromium` passes.

---

## 11. Recommended Next Step

The implementation plan for this spec should decompose into:

1. pick the highest-value deterministic `/apply` states to split first
2. add failing Playwright tests one by one
3. confirm current behavior already supports them or fix only genuine UX/test gaps
4. run the full verification gate

This keeps the work honest, incremental, and still worth doing under Dev A maintenance mode.
