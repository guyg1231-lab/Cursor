# Platform Design System Spec (Hebrew-first RTL)

**Date:** 2026-04-21  
**Status:** Governance and rollout companion to the canonical root `DESIGN.md`  
**Scope:** Participant, host, and admin surfaces in `social-matching-web`

---

## 1. Purpose

**Canonical source of truth:** [DESIGN.md](../../../DESIGN.md)

This spec defines the fixed design language that teams implement across all pages, with clear separation between:

- **Participant mode** (warm, editorial, trust-building)
- **Host mode** (clear and semi-operational)
- **Admin mode** (precise, dense, operational)

This file is the practical governance and rollout layer beneath:

- `DESIGN.md`
- `docs/mvp-v1/12_DESIGN_AND_UX_PRINCIPLES.md`
- `docs/superpowers/specs/2026-04-21-circles-mvp-progress-and-audit-spec.md`
- `docs/superpowers/specs/2026-04-21-design-vision-visual-companion.md`

---

## 2. Platform definitions (what must be consistent)

### 2.1 Typography platform definition

- **Primary UI font:** `Heebo`
- **Fallback order:** `Assistant` → `Noto Sans Hebrew` → `Rubik` → system sans
- **Rule:** Hebrew-first product surfaces use sans-only hierarchy; no serif dependency.

Fixed semantic scale:

- `xs`: 12/16
- `sm`: 14/20
- `md`: 16/24
- `lg`: 18/28
- `xl`: 20/30
- `2xl`: 24/34
- `3xl`: 30/40
- `4xl`: 36/46

### 2.2 Color platform definition

- **Canvas:** warm neutral (off-white family)
- **Primary brand/action:** soft indigo (`hsl(239 84% 67%)` light, `hsl(239 84% 72%)` in dark)
- **Supporting sage tone:** approved / organic accents (`--sage` tokens), not the global primary CTA
- **Supporting cool tone:** muted periwinkle only for secondary/supporting UI
- **Error:** dedicated red family (not brand primary)
- **Rule:** participant surfaces stay warm/calm; admin surfaces reduce decorative gradients.

### 2.3 Spacing and shape platform definition

- 4px base spacing scale (`4,8,12,16,20,24,32,40,48,64`)
- Global corner radius = 12px base, 20px for large cards/shells
- Pills remain full rounded
- Use shadows sparingly; no heavy layered shadows in admin tables

### 2.4 Motion platform definition

- Fast: 120ms
- Base: 200ms
- Slow: 320ms
- Reduced motion is mandatory via media query (already present)
- Motion intent: orientation + feedback, never decoration-only

### 2.5 Accessibility platform definition

- Target WCAG AA for interactive and body text
- Focus ring always visible (`:focus-visible`), keyboard-first behavior preserved
- Status color never carries meaning without text label
- Minimum state coverage per route: loading, empty, error, unavailable/gated

---

## 3. UX language system (copy and tone)

### 3.1 Participant voice

- warm, specific, low-pressure
- explain “what happens next” clearly
- trust language present but not suspicious/legal-heavy
- avoid platform jargon and algorithm-first framing

### 3.2 Host voice

- same brand family, less emotional language
- practical and directional
- clear task context and status

### 3.3 Admin voice

- operational precision first
- concise labels and table clarity
- no participant-facing emotional framing

### 3.4 Forbidden patterns

- payment-first copy in current MVP phase
- mixed participant/admin voice on same screen
- English leakage into Hebrew-first primary flows unless explicitly intentional

---

## 4. Mandatory design artifacts for governance

1. **Route state matrix:** each route defines loading/empty/error/gated/success states
2. **Copy catalog:** approved Hebrew-first strings for shared state components
3. **Role separation matrix:** participant vs host vs admin component usage boundaries
4. **Accessibility checklist:** keyboard, focus, contrast, and RTL checks per wave
5. **Responsive behavior table:** per core route at mobile/tablet/desktop breakpoints

---

## 5. Rollout plan across all pages

### Wave 1 — Foundation (global impact, low risk)

Apply in shared primitives and global theme:

- `src/index.css`
- `src/lib/design-tokens.ts`
- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/shared/PageShell.tsx`
- `src/components/shared/AppHeader.tsx`
- `src/components/shared/RouteState.tsx`

Outcome: consistent typography, action color, heading hierarchy, and baseline state cards across most routes.

### Wave 2 — Participant journeys (moderate risk)

- `src/pages/events/EventsPage.tsx`
- `src/pages/events/EventDetailPage.tsx`
- `src/pages/apply/ApplyPage.tsx`
- `src/pages/dashboard/DashboardPage.tsx`
- `src/pages/questionnaire/QuestionnairePage.tsx`
- related feature cards/panels under `src/features/*`

Outcome: end-to-end participant consistency.

### Wave 3 — Host/Admin dense flows (higher risk)

- `src/pages/admin/*`
- `src/pages/host/*` (if present/active)

Outcome: operational density tuned without leaking participant style.

---

## 6. “Definition of done” for any UI change

A UI PR is complete only if all apply:

- uses semantic tokens (no arbitrary one-off colors in core flows)
- preserves Heebo-first typography hierarchy
- includes route state coverage
- passes basic RTL + mobile + dark checks
- does not violate payment/copy policy for MVP

---

## 7. Decisions locked now

1. **Font lock:** Heebo-first across UI and headings
2. **Primary action lock:** soft indigo (`--primary`); sage reserved for approved / nature cues
3. **Error lock:** dedicated red destructive token
4. **Role lock:** participant warm vs admin operational split is mandatory

---

## 8. Open decisions (next short workshop)

1. Should participant hero sections keep ambient gradients on all pages or only discovery surfaces?
2. Exact density standard for admin tables (comfortable vs compact mode)
3. Dark mode rollout policy (full parity now vs phase after wave 2)

---

## 9. Sources and references

- `DESIGN.md`
- [Circles live reference](https://circles-connect-human.vercel.app/)
- `docs/mvp-v1/12_DESIGN_AND_UX_PRINCIPLES.md`
- `docs/superpowers/specs/2026-04-21-circles-mvp-progress-and-audit-spec.md`
- `docs/superpowers/specs/2026-04-21-design-vision-visual-companion.md`
