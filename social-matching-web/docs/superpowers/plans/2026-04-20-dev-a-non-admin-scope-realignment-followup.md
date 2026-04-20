# Dev A Non-Admin Scope Realignment — Code Follow-Up Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute the next Dev A-owned code pass so the non-admin product matches the clarified scope: apply to an existing event, propose a new event / experience / circle, keep `/events/:eventId/apply` canonical, narrow `/gathering/:eventId`, and remove active payment assumptions from participant flows.

**Architecture:** Use the already-shipped participant surface as the base. First clean route meaning and lifecycle copy in existing participant files. Then remove payment-dependent participant prompts while preserving current data contracts. After that, add a narrow creator-side proposal flow and status surface without touching Dev B-owned admin implementation. Finish with focused E2E coverage and doc updates.

**Tech Stack:** React, TypeScript, existing participant routes/components under `src/pages/**` and `src/features/**`, Playwright

---

## File Map

- Modify: `src/pages/events/EventDetailPage.tsx`
- Modify: `src/pages/apply/ApplyPage.tsx`
- Modify: `src/pages/gathering/GatheringPage.tsx`
- Modify: `src/pages/dashboard/DashboardPage.tsx`
- Modify: `src/features/applications/status.ts`
- Modify: `src/features/applications/presentation.ts`
- Modify: `src/features/applications/api.ts`
- Modify: `src/features/applications/types.ts`
- Modify: `e2e/participant-foundation.spec.ts`
- Create: one new Dev A-owned participant proposal slice (page/components/api/tests)
- Coordinate if needed: `src/app/router/AppRouter.tsx`, `src/app/router/routeManifest.ts` (Foundation-owned if a new route is introduced)

## Task 1: Freeze Canonical Apply Semantics In Existing Participant Routes

**Files:**
- Modify: `src/pages/events/EventDetailPage.tsx`
- Modify: `src/pages/apply/ApplyPage.tsx`
- Modify: `src/pages/dashboard/DashboardPage.tsx`

- [ ] **Step 1: Keep `/events/:eventId/apply` as the one participant application entrypoint**

Check:

```bash
rg -n "/events/.*/apply|לסטטוס ההרשמה|להגיש מועמדות|להגיש שוב" \
  src/pages/events/EventDetailPage.tsx \
  src/pages/apply/ApplyPage.tsx \
  src/pages/dashboard/DashboardPage.tsx \
  src/features/applications/components
```

Expected:

- event detail links into `/events/:eventId/apply`
- dashboard lifecycle rows link into `/events/:eventId/apply`
- apply page handles both creation and revisit/status

- [ ] **Step 2: Tighten copy so the participant understands this page owns the application**

Implementation notes:

- keep one route for create + revisit
- prefer “application/status/next step” language over mixed intake language
- keep questionnaire gating wording flexible; do not re-freeze the long-term policy here

## Task 2: Narrow `/gathering/:eventId` To A Later-Stage Participant Surface

**Files:**
- Modify: `src/pages/gathering/GatheringPage.tsx`
- Modify: `e2e/participant-foundation.spec.ts`

- [ ] **Step 1: Remove first-time intake responsibility from `GatheringPage`**

Current repo evidence:

- `src/pages/gathering/GatheringPage.tsx` still creates applications directly
- `e2e/fixtures/ui.ts` still describes `/gathering/:eventId` as participant intake

Recommended change:

- keep `GatheringPage` for later-stage response / info / status behavior
- stop treating it as the main first-time application form
- if no application exists yet, send the user to `/events/:eventId/apply` or show a clear link there

- [ ] **Step 2: Update tests to prove the boundary**

Add or update coverage so that:

- first-time participant journeys land on `/events/:eventId/apply`
- `/gathering/:eventId` no longer behaves like a competing application funnel
- awaiting-response and accepted-place behavior still works if that route remains the response surface

## Task 3: Remove Active Payment Assumptions From Participant Flows

**Files:**
- Modify: `src/pages/apply/ApplyPage.tsx`
- Modify: `src/pages/gathering/GatheringPage.tsx`
- Modify: `src/features/applications/types.ts`
- Modify: `src/features/applications/api.ts`

- [ ] **Step 1: Remove payment prompts from participant-facing forms**

Current repo evidence:

- `ApplyPage` asks for `understandPayment` and `commitOnTime`
- `GatheringPage` hardcodes `understand_payment: true` and `commit_on_time: true`

Recommended change:

- remove payment questions from participant UI now
- if persistence still requires those fields in the short term, populate safe defaults in the API layer rather than the visible form
- do not redesign the schema in the same slice unless the type contract forces it

- [ ] **Step 2: Keep the data contract stable while product scope is deferred**

Verification:

```bash
rg -n "understand_payment|commit_on_time|payment" \
  src/pages/apply/ApplyPage.tsx \
  src/pages/gathering/GatheringPage.tsx \
  src/features/applications/api.ts \
  src/features/applications/types.ts
```

Expected:

- visible payment questions are gone from participant surfaces
- any remaining references are implementation detail only, with a comment or helper explaining the temporary default

## Task 4: Reconcile Participant Lifecycle Vocabulary

**Files:**
- Modify: `src/features/applications/status.ts`
- Modify: `src/features/applications/presentation.ts`
- Modify: `src/pages/apply/ApplyPage.tsx`
- Modify: `src/pages/dashboard/DashboardPage.tsx`
- Modify: `e2e/participant-foundation.spec.ts`

- [ ] **Step 1: Treat `approved` and `confirmed` consistently on participant surfaces**

Recommended rule for this slice:

- participant-facing copy should present one reserved-place meaning
- internal DB values may still be `approved` or `confirmed`
- test both states until the backend contract is formally collapsed

- [ ] **Step 2: Keep `awaiting_response` distinct and obvious**

Check:

```bash
rg -n "awaiting_response|confirmed|approved" \
  src/features/applications/status.ts \
  src/features/applications/presentation.ts \
  src/pages/apply/ApplyPage.tsx \
  e2e/participant-foundation.spec.ts
```

Expected:

- `awaiting_response` keeps deadline/response behavior
- `approved` and `confirmed` render one reserved-place meaning to participants

## Task 5: Add The Creator-Side Proposal Flow In Dev A Scope

**Files:**
- Create: participant proposal page/components/api/tests
- Coordinate if needed: `src/app/router/AppRouter.tsx`, `src/app/router/routeManifest.ts`

- [ ] **Step 1: Add a narrow proposal entrypoint for users who want to start something new**

Recommended route:

- `/events/propose`

Recommended MVP behavior:

- lightweight creator form
- explicit copy that this creates a request for admin review
- creator can later see status from a non-admin surface

- [ ] **Step 2: Keep the first slice narrow**

Include:

- core proposal fields only
- persisted request state
- creator-facing status

Do not include:

- admin review UI
- admin dashboards
- admin diagnostics or audit panels
- payment

- [ ] **Step 3: Coordinate the route boundary if a new route is required**

Because router files are Foundation-owned:

- add the route only with explicit coordination, or
- file a foundation ticket and sequence the participant implementation behind it

## Task 6: Verification

**Files:**
- Modify: none

- [ ] **Step 1: Run targeted verification during the slice**

```bash
npm run typecheck
npx playwright test e2e/participant-foundation.spec.ts
```

- [ ] **Step 2: Run full regression before closing**

```bash
npm run typecheck
npx playwright test --project=chromium
```

- [ ] **Step 3: Sanity-check Dev B separation**

```bash
rg -n "src/pages/admin|src/pages/host|src/features/admin|src/features/host-events" \
  docs/superpowers/plans/2026-04-20-dev-a-non-admin-scope-realignment-followup.md
```

Expected:

- no Dev B implementation work is pulled into this plan
- any mentions of admin are dependency notes only
