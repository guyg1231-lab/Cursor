# Landing Sections Option Breakdown (What / How / Why)

Date: 2026-04-27  
Scope: full landing section breakdown with two options per section, final choice, and implementation rationale.

## Guardrails kept

- No hero CTA reintroduction.
- Fixed navbar policy unchanged.
- Reduced-motion path remains immediate and non-animated.
- i18n-only user-facing copy (no new hardcoded content).

## 1) Hero + transition between hero layers

### UX goal
Keep first impression stable, then introduce depth only after intentional scroll.

### Option A (minimal)
- Keep current two-layer hero behavior and only tweak timing constants.

### Option B (deeper)
- Merge both hero layers into one block and move emphasis to visual gradients only.

### Trade-off and decision
- **Chosen: Option A**
- Why: it preserves already-validated behavior and avoids semantic churn while still improving rhythm safely.

### Applied (what/how/why)
- **What:** smoother reveal pace and gentler vertical movement.
- **How:** shared transition class, lower translate offset, slightly calmer stagger.
- **Why:** maintain calm premium feel without changing product semantics.

## 2) Events shelf

### UX goal
Clarify section hierarchy and keep action focused without overloading hero.

### Option A (minimal)
- Keep existing shelf layout and improve only heading hierarchy.

### Option B (deeper)
- Add more actions (e.g., extra CTA row, filters) directly on landing.

### Trade-off and decision
- **Chosen: Option A**
- Why: keeps landing focused and avoids duplicating `/events` complexity on home.

### Applied (what/how/why)
- **What:** subtitle moved to eyebrow role, title remains primary anchor.
- **How:** section header restructured with existing translation keys.
- **Why:** improves scanability while keeping test and behavior stability.

## 3) How it works

### UX goal
Make the 3-step process feel actionable and easier to parse quickly.

### Option A (minimal)
- Preserve current text but add stronger visual grouping for each step.

### Option B (deeper)
- Replace card with timeline/progress component and additional microcopy.

### Trade-off and decision
- **Chosen: Option A**
- Why: better legibility with low implementation risk and no copy expansion.

### Applied (what/how/why)
- **What:** each step now has a subtle boxed sub-surface.
- **How:** rounded bordered containers inside existing card content.
- **Why:** clearer cognitive chunking of steps with minimal surface change.

## 4) Info cards (three cards)

### UX goal
Keep three messages balanced and avoid uneven card heights that hurt rhythm.

### Option A (minimal)
- Normalize card title line-height and body minimum height.

### Option B (deeper)
- Convert to icon-led feature tiles with new copy lengths.

### Trade-off and decision
- **Chosen: Option A**
- Why: maintains current content strategy and avoids extra localization overhead now.

### Applied (what/how/why)
- **What:** aligned visual balance across all three cards.
- **How:** consistent border/radius, title leading, body min-height.
- **Why:** cleaner row rhythm across desktop/tablet without semantic change.

## 5) Footer legal strip

### UX goal
Keep legal links discoverable but visually integrated with the landing tone.

### Option A (minimal)
- Wrap legal nav in a soft surface and tighten typography.

### Option B (deeper)
- Expand into multi-column legal/support footer.

### Trade-off and decision
- **Chosen: Option A**
- Why: enough visual closure for landing, no navigation complexity increase.

### Applied (what/how/why)
- **What:** footer rendered as subtle card-like strip.
- **How:** rounded container, soft border/background, small typography polish.
- **Why:** better visual closure at page end while preserving existing links.

## 6) Cross-section rhythm (system-wide)

### UX goal
The page should feel like one paced narrative, not separate disconnected blocks.

### Option A (minimal)
- Standardize section shell and spacing rhythm only.

### Option B (deeper)
- Introduce section-specific animation curves and per-breakpoint choreography.

### Trade-off and decision
- **Chosen: Option A**
- Why: avoids fragile motion complexity while giving immediate coherence gains.

### Applied (what/how/why)
- **What:** shared section shell for events block and consistent spacing cadence.
- **How:** reusable `sectionShellClassName` and harmonized paddings.
- **Why:** unified visual tempo with low regression risk.

## Implementation map

- Landing section updates: `src/pages/landing/LandingPage.tsx`
- Validation references:
  - `e2e/participant-foundation.spec.ts` (landing reveal/skeleton suite)
  - `e2e/landing-regression.spec.ts` (hash, error, propose, fallback)
