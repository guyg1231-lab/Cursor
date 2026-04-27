# Landing Phase 2 Motion + Feel Audit

Date: 2026-04-27  
Scope: `LandingPage` motion rhythm and perceived reveal feel (no CTA policy changes)

## Source-of-truth references checked

- `.claude/handoffs/2026-04-26-215900-landing-skeleton-audit-handoff.md`
- `docs/superpowers/specs/2026-04-26-landing-hero-design.md` (only non-CTA visual guidance remains applicable)
- `docs/superpowers/plans/2026-04-26-landing-hero.md` (marked superseded for CTA semantics)

## Desired feel from handoff/spec context

- Keep first hero stable at first paint.
- Keep secondary hero hidden at first paint and reveal only after real scroll.
- Keep deeper sections observer-based with bidirectional behavior (show on scroll-in, hide on scroll-out).
- Preserve fixed navbar and current bottom-nav policy.
- Preserve reduced-motion behavior (immediate visibility, no animated transitions).
- Keep visual tone calm/premium with token-native surfaces and soft gradient layers.

## Phase 2 adjustments implemented

1. **Smoother reveal pacing**
   - Unified reveal transitions to explicit `opacity+transform` property animation.
   - Duration tuned to `500ms` on mobile and `700ms` on md+.
2. **Reduced vertical jump**
   - Hidden-state translate reduced from `translate-y-4` to `translate-y-3`.
3. **Slightly calmer stagger**
   - Per-section transition delay adjusted from `70ms` to `80ms`.
4. **Secondary hero hysteresis micro-tune**
   - Show threshold moved to `64px`, hide threshold to `20px`.
   - Added initial `onScroll()` call so restored scroll position reflects correct reveal state immediately.

## Alignment verdict

- **Aligned:** reveal logic and UX behavior requested in the latest handoff.
- **Aligned:** no hero CTA reintroduction and no navbar policy changes.
- **Aligned:** reduced-motion path still bypasses animation.
- **No open design-blocking gaps** for motion/feel in this pass.

## Remaining optional polish (if requested later)

- Capture visual snapshots for motion waypoints (top / mid-scroll / back-to-top) in CI.
- Add a tiny UX smoke checklist for real-device tablet thresholds.
