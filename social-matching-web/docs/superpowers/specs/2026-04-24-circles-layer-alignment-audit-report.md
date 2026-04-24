# Circles Layer Alignment Audit Report

**Date:** 2026-04-24  
**Scope:** Compare the user-provided `Circles Layer` mandate against the current canonical MVP docs, active plans/specs, and implemented code.  
**Truth rule:** `docs/mvp-v1/` remains the canonical source of truth for the current product. The Circles Layer audit is an additional lens that can reveal gaps and future change candidates, but it does not automatically override MVP truth.

---

## 1. Executive Summary

The repo is **still mostly an Event Shell with social-matching scaffolding**, not yet a full Circles platform. The product already has real participant onboarding, event discovery, application readiness gating, admin-assisted approval, attendee social signals, and feedback intent in the docs. But the core Circles Layer elements are still missing or only partially defined: explicit group entities, group assignment UX, group insights, optional event-context prompts as a true layer, and a post-event connection graph.

The strongest current pattern is this:
- `mvp-v1` defines a community/event product with trust and matching aspirations.
- current plans mostly harden event lifecycle, browse, apply, and admin flow.
- a few newer docs move toward Circles-like behavior, mainly questionnaire intent, attendee social signals, and calmer participant visuals.
- there is no complete, first-class Circles model yet.

The biggest decision points are not “should Circles exist?” but:
- how much of the current questionnaire is profile versus event intent,
- whether the product needs a real group model now,
- how post-event learning should work,
- and how external events should fit as a secondary feature.

---

## 2. Current Product Picture

### What the product is right now

From the docs and code, the product is a **curated social matching MVP for real-life gatherings**:
- people discover published, active events,
- view event detail,
- complete profile/trust onboarding,
- apply for an event,
- get reviewed and grouped by admin support,
- attend,
- then provide feedback later.

### What users can do today

- Browse active, published events.
- Open event detail pages.
- Complete the profile questionnaire.
- Apply to a specific event.
- See registration and lifecycle states.
- See a small social signal like attendee circles/counts.

### What organizers/admins can do today

- Review participants and event requests.
- Manage event lifecycle and application states.
- Use selection metadata and approval workflows.
- Curate what is visible and active.

### Direct answer: event platform or Circles platform?

The system is **still mostly an Event Shell with social aspirations**, not yet a true Circles platform. It has Circles-adjacent pieces, but the product is still centered on events first, with matching and trust layered on top rather than fully expressed as a separate social layer.

---

## 3. Circles Layer Coverage Audit

| Circles component | Status | Where it exists | Classification | Notes |
|---|---|---|---|---|
| Pre-event onboarding | Partial | `docs/mvp-v1/08_QUESTIONNAIRE_SPEC.md`, `src/features/profile/ProfileBaseQuestionnaire.tsx` | Both | Exists as a full questionnaire/readiness flow, but not as a distinct Circles-only layer. |
| Participant intent capture | Partial | `docs/mvp-v1/09_APPLY_FLOW_SPEC.md`, `src/pages/apply/ApplyPage.tsx` | Both | Event-specific intent is present, but not framed as a dedicated intent system. |
| Interest / context capture | Strong | `docs/mvp-v1/08_QUESTIONNAIRE_SPEC.md`, questionnaire UI | Circles Layer | This is the closest current match to Circles-style pre-event context. |
| Grouping / matching logic | Partial | `docs/mvp-v1/06_FUNCTIONAL_REQUIREMENTS.md`, admin review flows, selection metadata | Both | The docs support human-assisted matching, but there is no explicit group model or matching engine. |
| Group assignment | Partial | `supabase/migrations/004_event_registrations.sql`, admin dashboard flows | Both | Assignment is implied through registration/selection state, not a first-class group object. |
| Group insights | Weak | attendee circles/counts, event capacity/context in detail pages | Circles Layer | The product shows social presence, but not a real insight layer about the group. |
| Optional event-context prompts | Weak / missing | apply page free text, host note fields | Not yet defined | There is no dedicated prompt/card system that shapes the room around the event. |
| Post-event connection and feedback | Partial | `docs/mvp-v1/02_MVP_SCOPE.md`, `docs/mvp-v1/04_WORKFLOWS.md`, `docs/mvp-v1/11_TRUST_AND_VERIFICATION.md` | Circles Layer | Feedback exists in docs, but there is no runtime connection graph or post-event loop in code. |

### Notes on the table

- The current product already carries signals needed for Circles-like behavior.
- The missing part is the **first-class layer**: group entities, group context, prompt mechanics, and connection outcomes.
- The product does not yet clearly separate baseline profile intent from event-specific intent.

---

## 4. Development Plan Alignment Audit

### Plans that mostly drive Event Shell behavior

- `docs/superpowers/specs/2026-04-18-near-term-buildout-foundation-design.md`
- `docs/superpowers/plans/2026-04-18-shared-foundation-normalization.md`
- `docs/superpowers/specs/2026-04-20-dev-a-lifecycle-and-route-boundary-design.md`
- `docs/superpowers/specs/2026-04-20-dev-a-non-admin-product-boundary-design.md`
- `docs/superpowers/plans/2026-04-18-developer-a-participant-product.md`
- `docs/superpowers/plans/2026-04-18-developer-a-apply-flow-deepening.md`
- `docs/superpowers/plans/2026-04-18-developer-a-dashboard-expansion.md`
- `docs/superpowers/plans/2026-04-20-apply-deterministic-state-matrix-implementation.md`
- `docs/superpowers/plans/2026-04-21-dev-a-phase-b-consolidation-implementation-plan.md`
- `docs/superpowers/plans/2026-04-21-mvp-finish-roadmap-implementation-plan.md`
- `docs/superpowers/specs/2026-04-21-mvp-finish-roadmap-design.md`
- `docs/superpowers/plans/2026-04-18-developer-b-host-admin-product.md`
- `docs/superpowers/plans/2026-04-20-developer-b-kickoff.md`
- `docs/superpowers/specs/2026-04-23-events-dense-browse-b2-design.md`
- `docs/superpowers/plans/2026-04-24-events-4across-production-implementation.md`

These mostly improve route structure, lifecycle states, browse density, host/admin shells, and launch readiness.

### Plans/specs that genuinely move the Circles Layer forward

- `docs/superpowers/plans/2026-04-19-developer-a-questionnaire-normalization.md`
- `docs/superpowers/specs/2026-04-21-mobile-discovery-map-sheet-design.md`
- `docs/superpowers/plans/2026-04-21-mobile-discovery-map-sheet-implementation.md`
- `docs/superpowers/specs/2026-04-23-participant-visual-system-design.md`
- `docs/superpowers/plans/2026-04-23-participant-visual-system-implementation.md`
- `docs/superpowers/specs/2026-04-20-dev-a-non-admin-flows-design.md`

These move the product toward intent capture, social signals, and a more Circles-native feel. But they still stop short of a full group/connection model.

### Sequencing concerns

- The active roadmap still prioritizes browse, apply, dashboard, and launch polish before defining a full Circles model.
- That order is fine if the goal is to finish the current Event Shell.
- That order is backwards if the next milestone is supposed to be **group formation and post-event learning**.

### Stale or superseded direction

- `docs/superpowers/specs/2026-04-21-circles-mvp-progress-and-audit-spec.md` explicitly treats Circles-style direction as inspiration, not spec.
- `docs/superpowers/specs/2026-04-20-dev-a-non-admin-product-boundary-design.md` and `docs/superpowers/specs/2026-04-20-dev-a-non-admin-flows-design.md` explicitly defer separate event/experience/circle treatment and richer post-event feedback.
- `docs/superpowers/plans/2026-04-19-participant-fr-coverage-matrix.md` marks post-event feedback as deferred/partial.

---

## 5. Contradictions and Risks

### Concrete contradictions

1. **Group size mismatch**
   - Audit spec says `4-6`.
   - `docs/mvp-v1/02_MVP_SCOPE.md` says `6-8`, minimum `5 + host`.
   - This is a direct product decision conflict.

2. **Pre-event onboarding mismatch**
   - Audit spec suggests a light onboarding signal layer.
   - `docs/mvp-v1/08_QUESTIONNAIRE_SPEC.md` defines a much broader profile/trust/readiness questionnaire.
   - This is a real mismatch, not just wording.

3. **Apply gating mismatch**
   - One boundary doc says whether a full questionnaire is required is not decided.
   - `docs/mvp-v1/09_APPLY_FLOW_SPEC.md` and runtime code enforce readiness gating.
   - That should be treated as a live contradiction to resolve, not a loose detail.

### Risks of drifting into a generic event board

- The browse surface is still a flat list of active/published events.
- The social signal is still mostly a count and a label.
- The gathering surface is a bridge, not a real in-event room or prompt layer.
- There is no runtime post-event connection loop.

If those gaps stay open, the product can easily feel like “a better event board” instead of Circles.

### Missing concepts/entities

- No first-class `group` / `circle` entity.
- No explicit group assignment object.
- No explicit group-insight surface.
- No dedicated event-context prompt system.
- No runtime post-event connection graph.
- No external-event provenance / intake model in code.

### Source-model ambiguity that must be owned

The product now needs a clear answer to:
- what is profile vs event intent,
- what is event source vs Circles layer,
- and which parts of the current MVP are being extended versus redefined.

---

## 6. Immediate Focus Recommendations

### A. Must be defined immediately

- Separate baseline profile from event-specific intent.
- Define the group model and assignment model.
- Decide the canonical group size.
- Resolve the apply readiness gate contradiction.

### B. Can be left open for now

- Deeper optional prompts/cards.
- Self-serve external event manager tooling.
- Advanced automation for matching.

### C. Missing specs / concepts / entities

- `Circles pre-event onboarding & intent capture`
- `Circles grouping / matching / assignment`
- `Circles group insights & event-context prompts`
- `Circles post-event connection & feedback`
- `External event provenance / intake` for admin-managed external events

### D. Recommended execution priority

1. Lock profile vs event intent.
2. Define groups and assignment.
3. Add simple group context.
4. Define post-event learning and connection.
5. Add external-event admin intake as a secondary lane.

---

## 7. Required New Specs

If the goal is to turn Circles into a true product layer, these are the next specs I would write:

1. `Circles pre-event onboarding & intent capture`
2. `Circles grouping / matching / assignment`
3. `Circles post-event connection & feedback`
4. `External events admin intake & provenance`

If you want optional event-context prompts to ship separately, add:

5. `Circles group insights & prompts`

---

## 8. Suggested Sequencing

### Phase 1: Clarify the human layer
- Keep `mvp-v1` as source of truth.
- Define what belongs to profile versus what belongs to the event moment.
- Keep the copy and UX welcoming, not bureaucratic.

### Phase 2: Make groups real
- Add a first-class group concept.
- Make group assignment visible and understandable.
- Keep matching partly human-assisted if needed.

### Phase 3: Close the loop
- Add simple post-event feedback.
- Add who-connected-with-who learning.
- Feed that into the next round of matching.

### Phase 4: Expand the source lanes
- Keep community-created events as the primary lane.
- Add admin-managed external events as a secondary, clearly labeled lane.
- Only then consider self-serve external event managers.

---

## 9. Bottom Line

The product already has a solid event shell, trust layer, and some Circles-adjacent signals. What it does **not** yet have is a complete Circles Layer with first-class groups, prompts, and learning. The fastest way to make Circles real is not to add more shell polish; it is to define the missing social layer and decide where the current MVP should be extended versus rewritten.

