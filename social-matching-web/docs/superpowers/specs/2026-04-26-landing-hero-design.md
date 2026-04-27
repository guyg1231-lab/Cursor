# Landing Hero Design Spec (Reference-Light)

Date: 2026-04-26  
Scope: `LandingPage` hero section only  
Out of scope: `Navbar` / `AppHeader` changes

> **Status (2026-04-26): PARTIALLY SUPERSEDED.**  
> The “dual hero CTAs” portion of this spec is **not** the current shipped product direction on `main` (hero CTAs were removed; tests enforce absence).  
> The visual language pieces (badge/headline/body, token-native blobs, single `h1` in the primary hero) remain useful as design guidance, but CTA semantics must be reconciled with product before implementation.

## 1. Goal

Create a new landing hero that is clearly inspired by the provided reference while remaining native to the existing Circles design system.  
The result should feel more premium and expressive than the current hero, without introducing a disconnected visual language.

## 2. Guardrails

- Do not change `Navbar` behavior or visuals.
- Keep implementation anchored in existing design tokens (`index.css` CSS variables + Tailwind theme).
- Keep existing shared primitives where practical (`Button`, layout containers, RTL behavior).
- Preserve accessibility fundamentals (single `h1`, readable contrast, keyboard focus visibility).
- Ship the hero as a contained change, without refactoring unrelated page sections.

## 3. Chosen Design Direction

The selected direction is **Approach A: "Reference-Light"**:

- Keep the reference structure (badge -> large headline -> supporting copy -> dual CTA).
- Use soft abstract blurred background shapes for depth.
- Translate colors and typography into current tokenized system rather than copying external raw palette values.
- Keep the overall visual tone calm and clean to match existing pages.

## 4. Information Architecture (Hero Only)

Hero content stack (top to bottom):

1. Eyebrow badge with short text and optional icon.
2. Two-line primary headline with highlighted keyword.
3. Supporting paragraph (single block, readable line length).
4. Primary + secondary CTA row.

Layout behavior:

- RTL aligned.
- Mobile: stacked vertical flow, CTA in one column.
- Desktop: same hierarchy with larger typography and horizontal CTA row.

## 5. Visual System Mapping

### 5.1 Background and layers

- Hero section uses a clean neutral base that sits naturally on current `PageShell`.
- Two absolute-positioned blurred circular layers:
  - Layer A: `primary`/lavender family token.
  - Layer B: sage/periwinkle family token.
- Blur and alpha stay soft so text remains dominant.
- Foreground content always rendered on a higher z-index layer.

### 5.2 Typography hierarchy

- Badge text: small-medium size, medium weight.
- Headline:
  - Significantly larger than current landing title.
  - `semibold` weight.
  - Tight line-height for hero density.
  - Highlighted keyword in `primary` tone.
- Supporting text:
  - Large body style.
  - Muted foreground color.
  - Constrained width for readability.

### 5.3 CTA styling

- Primary CTA: existing primary action language (token-aligned, stronger visual weight).
- Secondary CTA: border/surface treatment aligned to existing button variants.
- Hero may apply local size/radius adjustments to CTA without redefining global button system.

## 6. Interaction and Navigation

- Primary CTA links to `/events`.
- Secondary CTA target:
  - Preferred: in-page anchor to "How it works" section.
  - Fallback: existing stable route if in-page target is unavailable.
- Hover/press/focus states should reuse current interaction system and motion timing.

## 7. Accessibility and Semantics

- Ensure only one `h1` on the landing page.
  - If `PageShell` hero title is currently producing `h1`, disable that output for this page and render hero `h1` directly in the new hero block.
- Maintain contrast against decorative blurred background.
- Preserve visible `focus-visible` states on both CTAs.
- Decorative background layers should be non-semantic (no screen reader noise).

## 8. Localization Requirements

Add/adjust localized strings in both locales:

- `he.ts`
- `en.ts`

Likely string groups:

- Hero badge label
- Hero title line(s) and highlighted keyword handling strategy
- Hero supporting paragraph
- Hero primary and secondary CTA labels

Implementation should avoid Hebrew hardcoded strings in component markup.

## 9. Responsive Behavior

- Mobile first:
  - Comfortable top spacing below header.
  - Balanced hero height (impressive but not forced full viewport).
  - Vertical CTA stack.
- Tablet/desktop:
  - Enlarged headline scale.
  - CTA row in a single horizontal line where space permits.
  - Decorative background positions tuned to avoid clipping key content.

## 10. Technical Change Plan (Implementation Phase Preview)

Primary files expected:

- `src/pages/landing/LandingPage.tsx` (hero structure + layout)
- `src/locales/he.ts` and `src/locales/en.ts` (copy additions/adjustments)
- Optional: `src/components/shared/PageShell.tsx` only if a minimal API tweak is required to suppress built-in hero heading output on this page.

Non-goals for this phase:

- No changes to `AppHeader` visual behavior.
- No redesign of "Upcoming events" or "How it works" sections yet.

## 11. Risks and Mitigations

- **Risk: duplicate page heading semantics (`h1`)**
  - Mitigation: move heading ownership to hero block and prevent duplicate shell heading.
- **Risk: decorative background reduces readability**
  - Mitigation: keep alpha low, verify contrast on both themes.
- **Risk: style drift from existing system**
  - Mitigation: restrict colors/spacing/typography to existing tokens and established classes.

## 12. Acceptance Criteria

- Hero visually follows the agreed "reference-light" direction.
- Navbar is unchanged.
- Hero is RTL-correct and responsive on mobile + desktop.
- Page has a single logical `h1`.
- CTA primary goes to `/events`; secondary behavior is defined and works.
- Localization strings exist for Hebrew and English.
- No obvious visual conflict with current design tokens/light-dark theming.

