# Events Demo 4-Across Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the approved `4 בשורה` demo into a polished, product-like shelf with tighter framing, better card feel, stronger buttons, and deliberate hover/motion behavior.

**Architecture:** Keep the work isolated to the demo route so we can over-polish the browse language without disturbing `/events` yet. Use focused Playwright assertions to guard framing, alignment, and responsive behavior while visually refining the cards, action buttons, and motion cues.

**Tech Stack:** React, TypeScript, Tailwind CSS utilities, existing design tokens, Playwright, Vite

---

### Task 1: Lock the framing

**Files:**
- Modify: `src/pages/events/EventsExperiencesDemoPage.tsx`
- Test: `e2e/events-experiences-demo.spec.ts`

- [ ] Reduce non-essential explanation chrome so the shelf appears immediately.
- [ ] Keep the title compact and product-like.
- [ ] Ensure the first `4 בשורה` shelf starts high enough in the viewport to feel like a real browse surface.
- [ ] Verify desktop shelf alignment and absence of horizontal overflow in Playwright.

### Task 2: Polish the 4-across cards

**Files:**
- Modify: `src/pages/events/EventsExperiencesDemoPage.tsx`
- Test: `e2e/events-experiences-demo.spec.ts`

- [ ] Tune card hierarchy for browse speed: title, short vibe, facts, social proof, CTA.
- [ ] Refine card surfaces, corner softness, and shadow behavior for a warmer premium shelf.
- [ ] Tighten the CTA button language and sizing so the action feels deliberate, not generic.
- [ ] Keep attendee circles visible and legible inside the card footer.

### Task 3: Add hover and motion polish

**Files:**
- Modify: `src/pages/events/EventsExperiencesDemoPage.tsx`
- Reference: `src/index.css`
- Test: `e2e/events-experiences-demo.spec.ts`

- [ ] Add subtle card hover lift and shadow deepening.
- [ ] Add a small button hover/press refinement that feels soft rather than flashy.
- [ ] Add gentle page-entry motion for the shelves/cards using existing animation primitives or minimal local classes.
- [ ] Keep motion restrained and safe for reduced-motion environments.

### Task 4: Validate responsive behavior

**Files:**
- Modify: `src/pages/events/EventsExperiencesDemoPage.tsx`
- Test: `e2e/events-experiences-demo.spec.ts`

- [ ] Preserve the desktop `4` and `3` shelf comparison.
- [ ] Keep mobile on the horizontal fallback only.
- [ ] Check RTL alignment, shelf centering, and chip/button balance on desktop and mobile.

### Task 5: Verify and commit

**Files:**
- Modify: `src/pages/events/EventsExperiencesDemoPage.tsx`
- Modify: `e2e/events-experiences-demo.spec.ts`

- [ ] Run `npx playwright test e2e/events-experiences-demo.spec.ts --project=chromium`.
- [ ] Run `npm run typecheck`.
- [ ] Capture fresh screenshots for desktop and mobile sanity review.
- [ ] Commit only the demo page, plan, and demo test changes.
