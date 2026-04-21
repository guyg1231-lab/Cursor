# Dev A Phase B Consolidation Design

**Date:** 2026-04-21  
**Owner:** Dev A  
**Status:** Merged to `main` (historical design checkpoint)  
**Scope:** Consolidation pass after non-admin scope realignment implementation on `dev-a/circles-core-domain-v0`

---

## 1. Context

Dev A implementation already moved participant intake toward a canonical application spine:

- `/events/:eventId/apply` is now the main participant apply/status surface.
- `/gathering/:eventId` no longer serves as a first-time intake form.
- Participant-facing payment prompts were removed while API-level defaults remain as a temporary compatibility bridge.
- A non-admin proposal entry route now exists at `/events/propose`.

This design described the final hardening pass that was later implemented on `dev-a/circles-core-domain-v0` and merged to `main`. It remains useful as the rationale for the current `/apply`, `/gathering`, proposal, and auth-return behavior, not as an active backlog item.

---

## 2. Goals

1. Freeze the current realignment as a stable baseline.
2. Resolve remaining boundary ambiguity between `/apply` and `/gathering`.
3. Close highest-value regression gaps with targeted tests.
4. Remove stale or contradictory copy that no longer matches the protected-route/runtime reality.
5. Exit with a clean, confidence-building checkpoint for next-stage feature work.

---

## 3. Non-Goals

1. No new broad participant feature set.
2. No redesign of admin-owned workflows.
3. No schema-level payment redesign (temporary compatibility bridge remains).
4. No wide router architecture refactor beyond scope-needed clarifications.
5. No rewrite of lifecycle domain helpers unless required by boundary clarity.

---

## 4. Design Decisions

### 4.1 Canonical participant intake remains `/events/:eventId/apply`

This is considered implemented and should be preserved as the contract baseline.

### 4.2 `/gathering/:eventId` is a later-stage contextual surface, not an intake route

The page should not reintroduce first-time submit behavior. Its purpose is contextual status/response framing and navigation to canonical surfaces.

### 4.3 Response authority must be explicit

Current behavior still allows response semantics to appear across more than one surface. Phase B must codify one explicit product rule:

- either `/apply` is the only action authority, with `/gathering` informational,
- or `/gathering` remains a limited response entry by explicit design contract.

The implementation and test matrix must reflect the chosen rule directly.

### 4.4 Proposal entry is part of Dev A non-admin scope baseline

`/events/propose` stays protected and discoverable from non-admin participant surfaces, while host/admin ownership boundaries remain unchanged.

---

## 5. Component and Route Impact

Expected touchpoints for this consolidation slice:

- `src/pages/gathering/GatheringPage.tsx` (final boundary/copy behavior)
- `src/pages/apply/ApplyPage.tsx` (copy and lifecycle consistency)
- `src/pages/events/EventDetailPage.tsx` (CTA wording parity)
- `src/pages/dashboard/DashboardPage.tsx` and `src/features/applications/components/ApplicationLifecycleList.tsx` (CTA and lifecycle route consistency)
- `src/app/router/routeManifest.ts` (route contract semantics alignment)
- `src/lib/authReturnTo.ts` (return-path policy hardening where needed)
- `e2e/participant-foundation.spec.ts`
- `e2e/foundation-routes.spec.ts`

---

## 6. Data Flow and Error Handling

### 6.1 Persistence compatibility

Temporary payment defaults in `src/features/applications/api.ts` remain implementation-only and hidden from participant UI. Phase B validates this behavior but does not redesign storage contracts.

### 6.2 Auth return behavior

Paths expected to be valid return targets for participant actions should be explicitly allowed and covered by tests. This avoids auth-loop regressions as more participant entry points are added.

### 6.3 Boundary failures

When users hit `/gathering/:eventId` without a valid registration context, behavior should be deterministic:

- clear explanation,
- direct link to canonical apply/status path when relevant,
- no implied hidden second intake route.

---

## 7. Testing Strategy

This is a targeted hardening pass, not suite expansion for its own sake.

### 7.1 Required E2E additions/updates

1. `/events/propose` readiness-gated branch coverage (`isReady=false` path).
2. Dashboard proposal CTA assertion (`/events/propose` link from participant dashboard card).
3. Gathering edge branches:
   - signed-out behavior and return-to flow,
   - signed-in with no registration + closed registrations.
4. Lifecycle CTA matrix spot checks after copy/path updates.

### 7.2 Verification commands

```bash
npm run typecheck
npx playwright test e2e/foundation-routes.spec.ts e2e/participant-foundation.spec.ts --project=chromium
npx playwright test --project=chromium
```

---

## 8. Risks and Mitigations

### Risk 1: Hidden dual-surface drift between `/apply` and `/gathering`

**Mitigation:** write explicit contract language in code comments/tests and enforce with deterministic E2E coverage.

### Risk 2: Over-fixing beyond consolidation scope

**Mitigation:** keep this phase scoped to boundaries, copy consistency, and regression safety; defer new capability work.

### Risk 3: Breaking existing green paths while cleaning copy/contracts

**Mitigation:** preserve existing passing behavior first, then tighten with small, isolated edits and rerun focused tests before full suite.

---

## 9. Exit Criteria

Phase B is complete when all of the following are true:

1. Current realignment is committed as a stable baseline checkpoint.
2. `/apply` vs `/gathering` authority is explicit in behavior and tests.
3. Proposal-route and gathering-edge regressions are covered in E2E.
4. Typecheck and full Chromium E2E pass.
5. Branch is ready for next-stage Dev A feature planning without reopening foundational boundary questions.

---

## 10. Historical Next Step

The implementation plan created from this design was executed and merged. Any future Dev A participant work should start from the merged behavior on `main`, not by reopening this Phase B design as if it were still pending.
