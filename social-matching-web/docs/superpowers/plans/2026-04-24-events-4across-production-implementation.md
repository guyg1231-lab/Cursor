# Events 4-Across Production Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved `4 בשורה` dense-but-calm shelf direction to the real `/events` page while preserving Circles warmth, visible social proof, and continuity into detail/apply.

**Architecture:** Reuse the production `EventSummaryCard` and `EventAttendeeCircles` rather than copying demo markup into the app. Tighten the `/events` hero and action framing, reshape the browse grid around a four-across desktop shelf, and refine card/button/hover behavior inside existing participant primitives so the page still belongs to the same family as `/events/:eventId` and `/events/:eventId/apply`.

**Tech Stack:** React, TypeScript, Tailwind CSS utilities, existing design tokens, Playwright

---

### Task 1: Lock the product contract

**Files:**
- Reference: `docs/superpowers/specs/2026-04-23-events-dense-browse-b2-design.md`
- Reference: `docs/superpowers/specs/2026-04-23-participant-visual-system-design.md`
- Reference: `docs/mvp-v1/02_MVP_SCOPE.md`
- Reference: `docs/mvp-v1/04_WORKFLOWS.md`
- Reference: `docs/mvp-v1/06_FUNCTIONAL_REQUIREMENTS.md`
- Reference: `docs/mvp-v1/12_DESIGN_AND_UX_PRINCIPLES.md`

- [x] Restate the production browse contract before touching code: `/events` is the shelf, detail is for understanding, apply is for committing.
- [x] Keep the MVP loop intact: browse → open detail → apply.
- [x] Preserve visible attendee circles on-card.
- [x] Avoid marketplace-like filters, search complexity, or direct-apply card behavior.

### Task 2: Add failing tests for the real `/events`

**Files:**
- Modify: `e2e/participant-foundation.spec.ts`
- Test target: `/events`

- [x] Add a failing desktop assertion that the live discovery grid uses four columns on wide screens.
- [x] Add a failing assertion that the top of `/events` is compact enough for the shelf to appear high in the viewport.
- [x] Add a failing hover-affordance assertion for the production card and primary CTA.
- [x] Keep existing attendee-circle and continuity coverage intact.

### Task 3: Tighten the `/events` page shell

**Files:**
- Modify: `src/pages/events/EventsPage.tsx`

- [x] Reduce hero copy and vertical space so the shelf appears quickly.
- [x] Keep the non-admin proposal CTA, but integrate it into a calmer product framing.
- [x] Increase desktop shelf width to support four-across cards without awkward cropping.
- [x] Preserve loading/error/empty states.

### Task 4: Upgrade the production browse card

**Files:**
- Modify: `src/features/events/components/EventSummaryCard.tsx`
- Modify: `src/features/events/components/EventAttendeeCircles.tsx`
- Reference: `src/lib/design-tokens.ts`
- Reference: `src/components/ui/button.tsx`

- [x] Bring the production card closer to the approved shelf direction: compact hierarchy, soft depth, and rounded interaction feel.
- [x] Tighten status chip placement, title/vibe rhythm, fact blocks, and footer structure.
- [x] Keep attendee circles visible and calm.
- [x] Refine the primary CTA so it feels warm and deliberate, not generic.

### Task 5: Add restrained motion and hover behavior

**Files:**
- Modify: `src/features/events/components/EventSummaryCard.tsx`
- Reference: `src/index.css`

- [x] Add a subtle hover lift / shadow change to the production cards.
- [x] Add button hover/press refinement that feels gentle.
- [x] Keep motion low-intensity and compatible with reduced-motion support.
- [x] Avoid delayed page-entry effects that make the shelf appear blank.

### Task 6: Verify, review with experts, and commit

**Files:**
- Modify: `src/pages/events/EventsPage.tsx`
- Modify: `src/features/events/components/EventSummaryCard.tsx`
- Modify: `src/features/events/components/EventAttendeeCircles.tsx`
- Modify: `e2e/participant-foundation.spec.ts`
- Create/Modify: any expert-review summary note if needed

- [x] Synthesize UX/UI expert recommendations against the final implementation.
- [x] Run `npx playwright test e2e/participant-foundation.spec.ts --project=chromium`.
- [x] Run focused screenshots / sanity checks for desktop and mobile `/events`.
- [x] Run `npm run typecheck`.
- [ ] Commit only the production `/events` browse changes plus the plan doc.

## Expert Synthesis

Two parallel UX/UI reviews converged on the same production guidance:

1. `/events` should feel like a shelf immediately, not a centered hero gallery.
2. The browse card should read as one composed object, not multiple nested utility boxes.
3. Social proof must remain first-class, even when public counts are missing.
4. `4 בשורה` is the wide-desktop north star, but the shelf should adapt when inventory is smaller.
5. Hover and CTA behavior should feel warm and tactile, not shiny or marketplace-like.

The production implementation follows that guidance by widening the shelf, simplifying `EventSummaryCard`, keeping attendee circles visible in all states, and making the wide-desktop grid adaptive rather than rigid.
