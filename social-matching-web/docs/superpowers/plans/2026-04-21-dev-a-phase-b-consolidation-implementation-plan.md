# Dev A Phase B Consolidation Implementation Plan

> **Implementation status (merged to `main`):** The behavior in this plan was implemented on `dev-a/circles-core-domain-v0` and later merged via PR #27. The unchecked steps below preserve the original TDD/verification sequence for replay or audit; they are not an active backlog on `main`.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stabilize and finalize the already-implemented non-admin realignment by locking route boundaries, tightening participant/proposal behavior, and closing high-value regression gaps before new feature work.

**Architecture:** This plan treats current uncommitted behavior as the baseline implementation and applies a narrow hardening pass. It prioritizes deterministic route/status contracts, then test coverage, then copy/selector cleanup. Work is sequenced so each task can be committed independently with clear rollback boundaries.

**Tech Stack:** React 18, TypeScript, React Router 6, Supabase JS, Playwright.

---

## File Structure and Responsibilities

- `src/pages/gathering/GatheringPage.tsx`
  - Participant later-stage status surface; must not act as first-time intake; should preserve deterministic auth/no-registration branches.
- `src/pages/apply/ApplyPage.tsx`
  - Canonical participant apply/status page; copy and guarded-route logic must match runtime reality.
- `src/pages/events/EventDetailPage.tsx`
  - Event-detail CTA source; should remain label-consistent with canonical `/apply` contract.
- `src/pages/dashboard/DashboardPage.tsx`
  - Participant dashboard CTAs; proposal + lifecycle navigation parity.
- `src/features/applications/components/ApplicationLifecycleList.tsx`
  - Status rows and CTA routing to canonical participant destinations.
- `src/pages/events/EventsPage.tsx`
  - Public participant list page with non-admin proposal entry CTA.
- `src/pages/host/HostEventsPage.tsx`
  - Current proposal implementation host; requires safe participant-facing behavior checks.
- `src/app/router/AppRouter.tsx`
  - Runtime route truth.
- `src/app/router/routeManifest.ts`
  - Route-contract metadata; should reflect runtime and intended workstream semantics.
- `src/lib/authReturnTo.ts`
  - Allowed internal return paths after auth.
- `e2e/participant-foundation.spec.ts`
  - Primary participant regression suite for lifecycle/route boundaries.
- `e2e/foundation-routes.spec.ts`
  - Route contract and auth redirect behavior coverage.
- `e2e/fixtures/ui.ts`
  - Shared submit helper; keep stable, non-brittle selectors.

---

## Task 1: Lock route-boundary invariants in E2E

**Files:**
- Modify: `e2e/participant-foundation.spec.ts`
- Modify: `e2e/foundation-routes.spec.ts`

- [ ] **Step 1: Add failing tests for missing boundary branches**

Add tests (new blocks in existing describes) for:

1. proposal readiness-gated branch (`/events/propose` with profile not ready)
2. gathering signed-out branch preserving `returnTo`
3. gathering signed-in + no registration + closed-registration branch
4. dashboard proposal CTA to `/events/propose`

Use explicit names:

```ts
test('proposal route shows readiness-gated state when questionnaire is incomplete', async ({ browser }) => { /* ... */ });
test('gathering signed-out flow redirects to auth and preserves returnTo', async ({ page }) => { /* ... */ });
test('gathering with no registration and closed event links back to event detail', async ({ browser }) => { /* ... */ });
test('dashboard offers a CTA to /events/propose', async ({ browser }) => { /* ... */ });
```

- [ ] **Step 2: Run tests to verify failures**

Run:

```bash
npx playwright test e2e/participant-foundation.spec.ts e2e/foundation-routes.spec.ts --project=chromium -g "proposal route shows readiness-gated state when questionnaire is incomplete|gathering signed-out flow redirects to auth and preserves returnTo|gathering with no registration and closed event links back to event detail|dashboard offers a CTA to /events/propose"
```

Expected: at least one FAIL due to missing or unstable assertions before code/fixture hardening.

- [ ] **Step 3: Minimal implementation updates for deterministic behavior**

If tests fail due to missing deterministic branch behavior, update only the smallest required areas:

- `src/pages/gathering/GatheringPage.tsx` for closed/no-registration and signed-out messaging/actions.
- `src/pages/dashboard/DashboardPage.tsx` if CTA visibility/placement needs correction.
- `src/pages/host/HostEventsPage.tsx` if `/events/propose` readiness gate is not exposed consistently.

- [ ] **Step 4: Re-run focused tests**

Run:

```bash
npx playwright test e2e/participant-foundation.spec.ts e2e/foundation-routes.spec.ts --project=chromium -g "proposal route shows readiness-gated state when questionnaire is incomplete|gathering signed-out flow redirects to auth and preserves returnTo|gathering with no registration and closed event links back to event detail|dashboard offers a CTA to /events/propose"
```

Expected: PASS.

- [ ] **Step 5: Commit task**

```bash
git add e2e/participant-foundation.spec.ts e2e/foundation-routes.spec.ts src/pages/gathering/GatheringPage.tsx src/pages/dashboard/DashboardPage.tsx src/pages/host/HostEventsPage.tsx
git commit -m "test(dev-a): lock proposal and gathering route-boundary regressions"
```

---

## Task 2: Resolve apply/gathering authority ambiguity

**Files:**
- Modify: `src/pages/gathering/GatheringPage.tsx`
- Modify: `src/pages/apply/ApplyPage.tsx`
- Modify: `src/app/router/routeManifest.ts`
- Modify: `e2e/participant-foundation.spec.ts`

- [ ] **Step 1: Add failing test for explicit authority contract**

Add one test that enforces the chosen contract:

- if `/apply` is sole action authority, gathering must only deep-link to apply for actions;
- if gathering retains response action, assert exactly which actions are allowed and which are not.

Example name:

```ts
test('gathering exposes only contract-approved participant actions after realignment', async ({ browser }) => { /* ... */ });
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx playwright test e2e/participant-foundation.spec.ts --project=chromium -g "gathering exposes only contract-approved participant actions after realignment"
```

Expected: FAIL until implementation/contract is fully explicit.

- [ ] **Step 3: Implement minimal contract alignment**

Implement the chosen authority policy in:

- `src/pages/gathering/GatheringPage.tsx` (allowed actions/copy only)
- `src/pages/apply/ApplyPage.tsx` (canonical action language)
- `src/app/router/routeManifest.ts` (route classification/supportedStates/nextSteps reflecting actual role)

Also remove stale guarded-route contradiction in `ApplyPage` copy branch if still present.

- [ ] **Step 4: Re-run focused authority test**

Run:

```bash
npx playwright test e2e/participant-foundation.spec.ts --project=chromium -g "gathering exposes only contract-approved participant actions after realignment"
```

Expected: PASS.

- [ ] **Step 5: Commit task**

```bash
git add src/pages/gathering/GatheringPage.tsx src/pages/apply/ApplyPage.tsx src/app/router/routeManifest.ts e2e/participant-foundation.spec.ts
git commit -m "feat(dev-a): codify apply-gathering action authority contract"
```

---

## Task 3: Harden auth return and proposal access semantics

**Files:**
- Modify: `src/lib/authReturnTo.ts`
- Modify: `e2e/foundation-routes.spec.ts`
- Modify: `e2e/participant-foundation.spec.ts`

- [ ] **Step 1: Add failing tests for return-path and identity semantics**

Add tests for:

1. allowed participant return paths include intended canonical participant pages
2. proposal access is validated with a clearly non-admin/non-host-biased participant account

Example names:

```ts
test('auth return allows canonical participant routes and blocks unknown paths', async ({ page }) => { /* ... */ });
test('authenticated participant can open /events/propose without admin role', async ({ browser }) => { /* ... */ });
```

- [ ] **Step 2: Run focused tests to verify failures**

Run:

```bash
npx playwright test e2e/foundation-routes.spec.ts e2e/participant-foundation.spec.ts --project=chromium -g "auth return allows canonical participant routes and blocks unknown paths|authenticated participant can open /events/propose without admin role"
```

Expected: FAIL for at least one assertion before allowlist/test-identity hardening.

- [ ] **Step 3: Minimal implementation and test identity correction**

- Update `src/lib/authReturnTo.ts` allowlist only as required by tested participant contract.
- Ensure proposal-access test uses a participant account that does not rely on host-specific assumptions.

- [ ] **Step 4: Re-run focused tests**

Run:

```bash
npx playwright test e2e/foundation-routes.spec.ts e2e/participant-foundation.spec.ts --project=chromium -g "auth return allows canonical participant routes and blocks unknown paths|authenticated participant can open /events/propose without admin role"
```

Expected: PASS.

- [ ] **Step 5: Commit task**

```bash
git add src/lib/authReturnTo.ts e2e/foundation-routes.spec.ts e2e/participant-foundation.spec.ts
git commit -m "test(dev-a): harden auth return and proposal access semantics"
```

---

## Task 4: Remove brittle fixture selectors and finish verification

**Files:**
- Modify: `e2e/fixtures/ui.ts`
- Modify: `e2e/participant-foundation.spec.ts` (if helper contracts require assertion updates)

- [ ] **Step 1: Add a failing helper-contract test**

Add a test that uses `submitApplicationViaUi` and asserts it works for canonical apply flow with stable element targeting.

Example:

```ts
test('submitApplicationViaUi uses canonical apply controls without positional selectors', async ({ browser }) => { /* ... */ });
```

- [ ] **Step 2: Run focused test to verify failure**

Run:

```bash
npx playwright test e2e/participant-foundation.spec.ts --project=chromium -g "submitApplicationViaUi uses canonical apply controls without positional selectors"
```

Expected: FAIL while helper depends on fragile positional locators.

- [ ] **Step 3: Minimal fixture hardening**

Update `e2e/fixtures/ui.ts` to use resilient selectors (labels/roles or explicit stable test hooks already available in UI). Avoid `nth()`/positional assumptions.

- [ ] **Step 4: Re-run helper test**

Run:

```bash
npx playwright test e2e/participant-foundation.spec.ts --project=chromium -g "submitApplicationViaUi uses canonical apply controls without positional selectors"
```

Expected: PASS.

- [ ] **Step 5: Full verification and commit**

Run:

```bash
npm run typecheck
npx playwright test e2e/foundation-routes.spec.ts e2e/participant-foundation.spec.ts --project=chromium
npx playwright test --project=chromium
```

Expected: PASS across all commands.

Commit:

```bash
git add e2e/fixtures/ui.ts e2e/participant-foundation.spec.ts
git commit -m "test(dev-a): stabilize canonical apply fixture selectors"
```

---

## Final Integration Checkpoint

- [ ] Verify `git status --short` is clean except for intentionally deferred unrelated work.
- [ ] Summarize behavior deltas against `docs/superpowers/specs/2026-04-21-dev-a-phase-b-consolidation-design.md`.
- [ ] Prepare PR or merge strategy only after all verification commands pass.
