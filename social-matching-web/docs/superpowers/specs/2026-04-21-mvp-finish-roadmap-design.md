# MVP Finish Roadmap Design

**Date:** 2026-04-21  
**Status:** Active (execution in progress)  
**Goal:** Define, in simple language, what “MVP done” means and the shortest safe path to finish.

---

## 1. Why this document exists

We already completed most of the risky setup work.  
Now the important question is no longer “what are we building?”  
The question is: **what still must be finished before we can confidently call this MVP done?**

This document gives one shared answer for Dev A, Dev B, and shared launch work.

---

## 2. Current location (plain language)

We are in the **final stretch**.

- Dev A is mostly complete and stable.
- Dev B still has key operating-flow work to close.
- Shared launch readiness (docs + smoke + go/no-go evidence) still needs a final pass.

Think of it as:

1. map created,
2. roads mostly built,
3. car tested,
4. now finish the remaining roads and do the launch check before driving users on it.

---

## 3. MVP done definition (small and strict)

MVP is done only when all five are true:

1. **Main user journey works end-to-end** (discover -> apply/propose -> status -> response -> attend).
2. **Admin/operator journey works end-to-end** for core review and lifecycle actions.
3. **Core quality gates are green** (typecheck + full Chromium E2E).
4. **No critical dead ends** in top user and operator journeys.
5. **Launch readiness evidence exists** (deploy/smoke/runbook/legal/known-limits all explicit).

If one of these five is missing, MVP is not done yet.

---

## 3.1 Frozen MVP done checklist (single shared truth)

### Dev A must-haves

- [x] Canonical participant action authority remains `/events/:eventId/apply`.
- [x] Participant route boundaries and auth return semantics stay stable.
- [x] Participant/foundation regression gates stay green.

### Dev B must-haves

- [x] Host/admin core workflow routes are navigable for MVP operations.
- [x] Admin lifecycle action visibility and review queue contract are stable.
- [x] Host/admin MVP-critical regressions are locked in dedicated E2E coverage.

### Shared launch must-haves

- [x] Automated hard gate is green (`npm run typecheck` + full Chromium Playwright).
- [x] Known post-MVP deferrals are explicitly documented with owners/timeframes.
- [ ] Manual staging smoke checklist execution is recorded inline.
- [ ] Remaining real-event packet placeholders are replaced with concrete event/operator values.
- [x] Go/no-go summary document exists with explicit decision rule and open blockers.

---

## 4. Work split for MVP finish

### 4.1 Dev A (your lane)

Dev A must finish:

1. Keep participant flow stable and clear (one canonical apply/status authority).
2. Keep proposal entry reliable and understandable for non-admin users.
3. Close remaining participant copy/consistency drift.
4. Maintain green regression safety on participant/foundation flows.

Dev A can defer (post-MVP):

- deeper UX polish,
- deeper component refactors,
- non-critical edge-case coverage expansion.

### 4.2 Dev B lane

Dev B must finish:

1. Core admin/operator operating flow for request/event lifecycle.
2. Host/admin workspace path usable enough for MVP operations (not only placeholders where critical actions are needed).
3. Dedicated host/admin regression coverage for launch confidence.
4. Route/permission behavior aligned with current intended guard semantics.

Dev B can defer (post-MVP):

- advanced reporting/analytics tooling,
- deeper productivity enhancements,
- non-critical UI polish.

### 4.3 Shared lane (joint finish work)

Shared must finish:

1. Final launch-readiness pass with evidence.
2. Staging deploy + smoke checklist completion.
3. Known deferred items explicitly accepted and documented.
4. Go/no-go checklist completion and signoff.

---

## 5. Final sequence to finish MVP safely

### Phase A — Close Dev A remaining must-haves

- freeze current stable behavior,
- resolve only launch-relevant participant gaps,
- keep gates green continuously.

### Phase B — Close Dev B must-haves

- complete operator-critical flow,
- ensure host/admin routes are usable for real operations,
- lock with targeted host/admin test coverage.

### Phase C — Launch-readiness closure

- run final verification on release-candidate commit,
- deploy to staging with production-like config,
- execute and record full smoke checklist,
- complete go/no-go review.

This is the recommended order: **A -> B -> C**.

---

## 6. Exit criteria for this roadmap

This roadmap is successful when:

1. A single checklist can be used to answer “Are we done?” without debate.
2. Dev A and Dev B both know their exact MVP must-haves.
3. Shared launch work has explicit owners and evidence, not assumptions.
4. Team can make a go/no-go decision with confidence.

---

## 7. After MVP (explicitly out of scope)

After launch, we continue improving.  
But these are not MVP blockers:

- deeper UX refactors,
- advanced analytics/observability improvements,
- expanded feature depth beyond core user/operator loops.

