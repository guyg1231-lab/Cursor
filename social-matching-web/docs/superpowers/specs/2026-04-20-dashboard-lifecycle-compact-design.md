# Dashboard Lifecycle Compact Design

**Date:** 2026-04-20  
**Owner:** Dev A  
**Status:** Proposed  
**Scope:** A-FEAT-1 from `docs/superpowers/plans/2026-04-21-dev-a-remaining-work-audit-and-plan.md` — unify `ApplicationLifecycleList` with the lifecycle presentation system while keeping the dashboard compact.

---

## 1. Context

The participant dashboard currently renders application rows in `src/features/applications/components/ApplicationLifecycleList.tsx` using a mix of:

- `formatApplicationStatusShort`
- `resolveApplicationBadgeTone`
- inline per-status explanatory prose
- inline deadline copy for temporary offers

At the same time, `/events/:eventId` and `/events/:eventId/apply` already centralize lifecycle explanation in `src/features/applications/presentation.ts` via `resolveApplicationPanelContent`.

That split is not a bug today, but it creates drift pressure:

1. Lifecycle meaning lives in more than one place.
2. Dashboard wording can slowly diverge from event/apply wording.
3. The dashboard and full-screen surfaces need different density, but not different semantics.

This spec defines a compact dashboard presentation path that stays connected to the same lifecycle source of truth without turning the dashboard into a stack of full `ApplicationStatusPanel` cards.

---

## 2. Goals

1. Keep the dashboard list fast to scan.
2. Move lifecycle meaning closer to `presentation.ts` so dashboard, event detail, and apply surfaces stop drifting.
3. Preserve the current CTA behavior and row structure unless a change is necessary for consistency.
4. Support the chosen dashboard density rule:
   - most statuses get one short explanatory line
   - `awaiting_response` rows may render a second dedicated deadline line
5. Stay entirely inside Dev A-owned files.

---

## 3. Non-goals

1. Do not replace dashboard rows with full `ApplicationStatusPanel` cards.
2. Do not change `ApplicationStatusPanel` props or implementation.
3. Do not change `src/features/applications/status.ts`.
4. Do not add new lifecycle states, new API calls, or new database behavior.
5. Do not modify foundation-owned paths:
   - `src/app/router/**`
   - `src/components/shared/**`
   - `src/components/ui/**`
   - `src/lib/design-tokens.ts`
6. Do not expand the work into a full per-state fixture matrix for `/apply`.

---

## 4. Decision Summary

The dashboard will adopt a **compact adapter** over the shared lifecycle presentation system.

- `presentation.ts` will become the semantic source for both:
  - full panel content (`resolveApplicationPanelContent`)
  - compact dashboard row content (new compact helper)
- `ApplicationLifecycleList` will stop owning raw lifecycle prose and instead render compact content from `presentation.ts`
- only `awaiting_response` rows get a second line dedicated to the response deadline
- CTA routing and button variants stay local to `ApplicationLifecycleList`

This keeps the dashboard visually light while connecting it to the same lifecycle meaning used elsewhere.

---

## 5. Architecture

### 5.1 Presentation-layer shape

`src/features/applications/presentation.ts` will own a shared lifecycle narrative model that can feed more than one surface density.

The implementation does not need to expose the internal model publicly if a private helper is enough, but conceptually the file should define one semantic source with fields like:

- lifecycle title
- lifecycle body
- optional deadline / footer line
- compact summary line
- optional compact deadline line

From that shared semantic layer:

- `resolveApplicationPanelContent(application)` continues serving full surfaces
- `resolveApplicationLifecycleRowContent(application)` serves compact dashboard rows

The important part is the dependency direction:

`ApplicationLifecycleList` -> compact helper in `presentation.ts` -> shared lifecycle semantics

not:

`ApplicationLifecycleList` -> ad hoc inline copy

### 5.2 Why not reuse panel content directly?

Panel copy and dashboard copy have different density needs.

If the dashboard simply reuses `title/body/footer` as-is, rows become too verbose. If the dashboard keeps all prose inline, meaning drifts again. The design therefore uses **shared semantics with surface-specific rendering**, not literal string reuse everywhere.

### 5.3 File ownership

Expected implementation files:

- modify `src/features/applications/presentation.ts`
- modify `src/features/applications/components/ApplicationLifecycleList.tsx`
- modify `e2e/participant-foundation.spec.ts`

Files explicitly not touched:

- `src/features/applications/components/ApplicationStatusPanel.tsx`
- `src/features/applications/status.ts`
- `src/pages/apply/ApplyPage.tsx`
- `src/pages/events/EventDetailPage.tsx`
- any foundation-owned tree

---

## 6. Rendering Rules

### 6.1 Shared row contract

Each dashboard row continues to render:

1. event title
2. status badge
3. compact explanatory copy
4. CTA area when an event link is available

### 6.2 Compact copy rules by status

#### `awaiting_response`

Render:

1. one short summary line explaining that a temporary place is waiting for a response
2. one separate deadline line

The separate deadline line is the chosen option from brainstorming because it preserves scanability while making the time-sensitive requirement harder to miss.

Both live and expired temporary-offer states may use the second line, with wording adapted to whether the window is still open.

#### `confirmed` / `approved`

Render one short summary line confirming the place is reserved.

#### `pending`

Render one short summary line explaining the application was received and is under review.

#### `waitlist`

Render one short summary line explaining the user is on the waitlist.

#### `rejected` / `cancelled`

Render one short summary line acknowledging the prior application outcome while keeping the row scannable.

#### `attended` / `no_show`

Render one short summary line marking the event as completed/past.

### 6.3 CTA rules

CTA behavior remains local to `ApplicationLifecycleList`:

- `awaiting_response` -> link to `/events/:eventId/apply`
- other states with event data -> link to `/events/:eventId`

This logic stays local because it is route/surface behavior, not lifecycle meaning.

---

## 7. Testing Strategy

This slice uses focused regression coverage, not a new test framework.

### 7.1 Playwright updates

Update `e2e/participant-foundation.spec.ts` to cover the user-visible dashboard changes:

1. keep the existing confirmed/reserved dashboard regression green
2. add or update a targeted dashboard test for `awaiting_response` so it asserts:
   - the dashboard row still shows the correct badge
   - the row shows the compact summary line
   - the row shows a separate deadline line
   - the CTA still points into the application flow

Use existing fixture style:

- `withFlippedRegistrationStatus`
- authenticated participant browser context

### 7.2 Verification commands

Required verification after implementation:

```bash
cd social-matching-web
npm run typecheck
npx playwright test --project=chromium
```

No Vitest or component-test expansion is required for this slice.

---

## 8. Risks and Mitigations

### Risk 1: Over-abstraction in `presentation.ts`

If the internal lifecycle model becomes too generic, the code gets harder to read than the problem justifies.

**Mitigation:** keep the shared model small and only support the two real consumers that exist today:

- panel surfaces
- compact dashboard rows

### Risk 2: Dashboard rows become too verbose

If more statuses gain extra lines, the dashboard starts to feel like stacked detail cards.

**Mitigation:** enforce the chosen rule that only `awaiting_response` gets a second line.

### Risk 3: Hidden drift continues

If the dashboard helper is nominally in `presentation.ts` but still builds its own unrelated wording, the refactor does not buy much.

**Mitigation:** derive both panel and compact outputs from the same lifecycle meaning layer in the same module.

---

## 9. Acceptance Criteria

This spec is satisfied when all of the following are true:

1. `ApplicationLifecycleList` no longer owns raw lifecycle prose inline.
2. `presentation.ts` provides compact dashboard lifecycle content in addition to full panel content.
3. Dashboard rows remain visually compact.
4. Only `awaiting_response` rows render a second dedicated deadline line.
5. Existing CTA behavior still works.
6. `npm run typecheck` passes.
7. `npx playwright test --project=chromium` passes.
8. No foundation-owned files were modified.

---

## 10. Implementation Notes for the Next Step

When this spec is approved, the implementation plan should decompose into small steps:

1. add/shape compact lifecycle helper in `presentation.ts`
2. migrate `ApplicationLifecycleList` to consume it
3. update Playwright coverage for the dashboard `awaiting_response` row
4. run typecheck + full Chromium suite

That keeps the refactor reviewable and preserves a clear red/green path.
