# Dev A Apply Transition Parity Design

**Date:** 2026-04-20  
**Owner:** Dev A  
**Status:** Proposed  
**Scope:** Add deterministic participant E2E coverage for `/events/:eventId/apply` transition behavior and dashboard/apply state parity, without introducing new fixture infrastructure.

---

## 1. Context

Dev A just completed the deterministic `/apply` state matrix expansion and moved the Chromium baseline to **43 tests**. That slice improved static status-surface coverage (`pending`, `waitlist`, `attended`, `approved`, expired `awaiting_response`) and preserved the broad alternation test for non-deterministic readiness reasons.

The highest remaining risk is no longer static rendering. It is **transition behavior**:

1. participant action on a temporary offer (`awaiting_response`) to reserve a place
2. behavior when that offer is already expired
3. consistency between dashboard lifecycle cues and `/apply` status panel semantics

Current coverage shows participant-facing status states, but transition correctness is still under-protected.

---

## 2. Goals

1. Add deterministic E2E coverage for the participant temporary-offer transition path on `/apply`.
2. Assert parity between dashboard lifecycle presentation and `/apply` panel state for shared statuses.
3. Keep all coverage in Dev A-owned participant test surfaces.
4. Maintain honest fixture boundaries (registration-row mutation only).

---

## 3. Non-goals

1. Do not add new helpers for event/profile/questionnaire mutation.
2. Do not split non-deterministic readiness branches (questionnaire incomplete, event closed) into deterministic per-reason tests.
3. Do not perform broad `ApplicationLifecycleList`/`presentation.ts` refactoring in this slice.
4. Do not touch host/admin or foundation-owned paths.

---

## 4. Decision Summary

The next Dev A slice is a **narrow deterministic transition spec**, not another wide status-matrix or refactor effort.

This spec focuses on participant-visible correctness where regressions are most costly:

- action-driven transition (`awaiting_response` -> reserved state)
- expired-offer guard behavior
- dashboard/apply parity contract for the same registration states

---

## 5. In Scope

### 5.1 Transition tests on `/apply`

Add deterministic E2E tests in `e2e/participant-foundation.spec.ts` for:

1. **Confirm success path**
   - force `awaiting_response` with future `expires_at`
   - click confirm CTA on `/apply`
   - assert reserved-state participant UI appears after action

2. **Expired offer guard**
   - force `awaiting_response` with past `expires_at`
   - assert expired panel semantics and absence of confirm action affordance

3. **Missing representative status coverage**
   - add one deterministic `/apply` regression for `confirmed`
   - add one deterministic `/apply` regression for `no_show`

### 5.2 Dashboard/apply parity regression

For at least one shared status branch (prefer `awaiting_response` and one non-awaiting branch), assert that:

1. dashboard lifecycle row semantics (label/summary/CTA intent) align with
2. `/apply` panel semantics for the same registration state

The goal is parity of participant-visible meaning, not exact copy duplication.

---

## 6. Out of Scope

Explicitly deferred to future fixture/product work:

1. deterministic questionnaire-incomplete forcing
2. deterministic event-closed forcing
3. broad per-reason readiness decomposition beyond existing honest alternation
4. large lifecycle presentation refactors

---

## 7. Test Design Rules

### 7.1 Deterministic setup only

Use `withFlippedRegistrationStatus` with clear temporal buffers:

- future window: at least `+24h`
- expired window: at least `-24h`

Avoid boundary values around current time.

### 7.2 Participant-visible assertions

Each new test should assert:

1. route loads
2. expected Hebrew status surface is visible
3. expected action affordance (or explicit lack of it) is visible
4. post-action state reflects canonical participant outcome

### 7.3 Narrow ownership

Primary target file: `e2e/participant-foundation.spec.ts`

No required production code changes are planned. If a RED test reveals a real product bug, apply the minimum fix in Dev A-owned participant files only.

---

## 8. Risks and Mitigations

### Risk 1: Time-dependent flakiness in offer tests

**Mitigation:** use generous future/past offsets and avoid near-now timestamps.

### Risk 2: False confidence from static-only checks

**Mitigation:** include explicit CTA interaction and post-action assertion in confirm-success test.

### Risk 3: Scope creep into fixture infrastructure

**Mitigation:** reject any implementation step requiring new event/profile/questionnaire mutation helpers.

### Risk 4: Parity assertions become brittle text snapshots

**Mitigation:** assert semantics (state/CTA intent) using stable visible anchors rather than overfitting long full-paragraph strings.

---

## 9. Acceptance Criteria

This spec is satisfied when:

1. a deterministic `/apply` confirm-success transition test exists for `awaiting_response` future-window state
2. a deterministic expired-offer guard test exists for `awaiting_response` past-window state
3. deterministic `/apply` regressions exist for `confirmed` and `no_show`
4. at least one dashboard/apply parity regression is added for shared lifecycle semantics
5. `npm run typecheck` passes
6. `npx playwright test --project=chromium` passes

---

## 10. Verification Gate

Required verification for the implementation plan based on this spec:

```bash
npm run typecheck
npx playwright test --project=chromium
```

If test inventory changes, sync active Dev A audit guidance to the new total.

---

## 11. Recommended Next Step

Write an implementation plan that sequences this work as:

1. failing transition tests first (`awaiting_response` future/past)
2. representative status additions (`confirmed`, `no_show`)
3. dashboard/apply parity regression
4. full verification gate and doc baseline sync if needed

This keeps Dev A in maintenance-mode discipline while still improving high-impact participant confidence.
