# Participant functional requirements — coverage matrix (Dev A scope)

**Created:** 2026-04-19  
**Source:** [`docs/mvp-v1/06_FUNCTIONAL_REQUIREMENTS.md`](../../mvp-v1/06_FUNCTIONAL_REQUIREMENTS.md)  
**Purpose:** Satisfy public-readiness plan **A.1** — a short gap list with no silent misrepresentation of what the shipped web app does today.

Legend: **Met** = participant UI + data path exists for the core intent. **Partial** = present but incomplete vs FR wording or MVP scope. **N/A (p)** = not participant-only. **N/A (B)** = Dev B / host-admin. **Deferred** = explicitly later.

| FR | Summary | Status | Notes |
|----|---------|--------|-------|
| FR-1 | Public event list | **Met** | `EventsPage` |
| FR-2 | Card fields for decision | **Met** | Title, area, timing, copy, open/closed |
| FR-3 | Event detail | **Met** | `EventDetailPage` |
| FR-4 | Applications open/closed | **Met** | Shown on detail + apply gating |
| FR-5 | Questionnaire before apply | **Met** | `/questionnaire` |
| FR-6 | Trust / matching baseline | **Met** | `ProfileBaseQuestionnaire` |
| FR-7 | Draft save | **Met** | Local + signed-in cloud |
| FR-8 | Readiness to apply | **Met** | Gating on `/apply` |
| FR-9 | Apply to event | **Met** | `ApplyPage` |
| FR-10 | No duplicate apply (same user+event) | **Met** | Enforced via flows + status |
| FR-11 | Persist application state | **Met** | `event_registrations` |
| FR-12 | Show state to user | **Met** | Apply + dashboard lifecycle |
| FR-13 | Block when registration closed | **Met** | |
| FR-14 | Block when not ready | **Met** | Questionnaire readiness |
| FR-15 | Status enum coverage | **Met** | Model in DB + participant labels |
| FR-16 | Clear participant display | **Met** | Chips / panels Hebrew |
| FR-17 | Payment only after approval | **Partial** | UX messaging + payment stage; full ops product-dependent |
| FR-18 | Post-approval payment stage | **Partial** | Infrastructure exists; not fully validated in one doc |
| FR-19 | Replacement after non-payment | **Deferred** | As in MVP scope |
| FR-20–22 | Host/co-host | **N/A (B)** | Host surfaces |
| FR-23–26 | Admin operations | **N/A (B)** | Admin/operator |
| FR-27 | Trust fields collected | **Met** | Questionnaire + profile |
| FR-28 | Internal trust review | **N/A (B)** | Admin |
| FR-29 | No public exposure of internal verification | **Met** | Participant views do not leak internal-only data |
| FR-30 | Attendance lifecycle | **Partial** | Gathering + statuses; edge cases as needed |
| FR-31 | Post-event feedback | **Deferred** / **Partial** | Not a blocker for “discovery → apply” public path |
| FR-32 | Internal reputation updates | **N/A (B)** | |
| FR-33 | Clear discovery → apply flow | **Met** | Routed shell + CTAs |
| FR-34 | No payment before approval | **Met** | Product rule reflected in copy + flow stages |
| FR-35 | No marketplace noise in participant UI | **Met** | Ongoing; grep / E2E guardrails |

**Review:** Revisit when payment UX or feedback ships materially.
