# Circles / Social Matching MVP — Progress & Audit Spec

**Date:** 2026-04-21  
**Status:** Living reference for product progress, sequencing debates, and later audits  
**Audience:** Product, ops, design, and engineering — written so non-technical readers can follow decisions and trace them back to canonical docs.

---

## 1. What this document is for

This file is **not** a replacement for the canonical MVP definition in `docs/mvp-v1/`. It is a **single place** to:

- describe the product in **everyday language**;
- name the **lenses** people use when they disagree (trust vs speed, warmth vs control, and so on);
- lay out **real choices** (Option A / B / C) for major directions;
- state a **recommended path** with plain reasons;
- list **audit questions** so a future review can check “did we drift from intent?”

**Canonical truth for what the system is:** `docs/mvp-v1/README.md` and the numbered files in reading order there.

**Companion “how close are we to done?” roadmap (plain language):** `docs/superpowers/specs/2026-04-21-mvp-finish-roadmap-design.md`.

**Design track (wireframes, flows, visual tokens + browser mood board):** `docs/superpowers/specs/2026-04-21-design-vision-visual-companion.md` — open `docs/design/visual-language-board.html` in a browser for a quick visual read.

**Platform design-system definition (tokens, typography, governance, rollout waves):** `docs/superpowers/specs/2026-04-21-platform-design-system-spec.md`.

---

## 2. The product in one paragraph (non-technical)

People discover **small, curated real-life gatherings** in their city. If something fits, they **apply** with a light, event-specific explanation — or they **propose** a new gathering for staff review. A human-assisted process builds an **approved group**; the product keeps everyone oriented with **clear status** and **trust-building** language (not marketplace noise). **Payment is not part of the current phase**; flows must work without checkout. After the meet, the product collects **feedback** and light **trust signals** so the next experience feels safer and clearer.

**Core loop (scope litmus test):** discover → apply *or* propose → review → confirm group → attend → feedback — see `docs/mvp-v1/02_MVP_SCOPE.md` (boundary rule and §1).

---

## 3. Source map — where to look when auditing

| Topic | Primary canonical doc |
|--------|------------------------|
| Positioning and principles | `docs/mvp-v1/01_PRODUCT_OVERVIEW.md` |
| In/out of scope, loop, metrics | `docs/mvp-v1/02_MVP_SCOPE.md` |
| Roles and permissions | `docs/mvp-v1/03_USER_ROLES_AND_PERMISSIONS.md` |
| End-to-end journeys | `docs/mvp-v1/04_WORKFLOWS.md` |
| Acceptance-style stories | `docs/mvp-v1/05_USER_STORIES.md` |
| FRs (including FR-23–25 payment deferral, FR-42 tone) | `docs/mvp-v1/06_FUNCTIONAL_REQUIREMENTS.md` |
| Technical baseline | `docs/mvp-v1/07_TECHNICAL_SPEC.md` |
| Questionnaire feel and rules | `docs/mvp-v1/08_QUESTIONNAIRE_SPEC.md` |
| Apply flow and guards | `docs/mvp-v1/09_APPLY_FLOW_SPEC.md` |
| Discovery and event detail | `docs/mvp-v1/10_EVENT_DISCOVERY_AND_DETAIL_SPEC.md` |
| Trust and verification | `docs/mvp-v1/11_TRUST_AND_VERIFICATION.md` |
| Visual and UX north star | `docs/mvp-v1/12_DESIGN_AND_UX_PRINCIPLES.md` |

**Superpowers design docs** (implementation-facing but useful for audits of *behavior* and *boundaries*): see `docs/superpowers/specs/` — especially lifecycle, apply parity, non-admin boundary, and dashboard compact designs dated 2026-04-18 through 2026-04-21.

---

## 4. Decision lenses (how to argue without talking about “stacks”)

These are **ways of looking** at the same feature. Healthy teams pick a lens explicitly before picking a solution.

### Lens A — Trust and belonging vs acquisition and velocity

- **Trust side:** fewer steps that feel screening-first; copy that explains *why* data is collected; curated, calm discovery; human-in-the-loop matching — aligned with `01`, `11`, `12`, and FR-42 (no generic marketplace / admin voice on participant surfaces) in `06`.
- **Velocity side:** more events visible, faster apply, higher top-of-funnel completion — can conflict with “quality > quantity” in `01` and small concurrency limits in `02`.

**When this matters:** any change to forms, filters, how many events show, or how fast admin must respond.

### Lens B — Editorial warmth vs operational clarity

- **Warmth:** the product sounds like a thoughtful host — `09`, `10`, `12`.
- **Clarity:** statuses, deadlines, and “what happens next” are unambiguous — `04`, `06` registration states in `02` §3.

**When this matters:** dashboards, emails, empty states, and admin tools that might leak into participant language.

### Lens C — Selective scarcity vs fairness and access

- Small groups, few parallel events, one city, categories capped — `02` §5–7.
- **Tension:** exclusivity signals quality but raises expectations about *who gets in* and how transparent that is — ties to `04` workflows and admin decisions.

### Lens D — Same “thing,” different words (event / experience / circle)

- **Rule:** `event`, `experience`, and `circle` are the **same MVP object**; difference is **language and branding**, not separate domain models — `02` §2.

**When this matters:** navigation labels, marketing, host vs participant vocabulary — avoid building three parallel product concepts in the UI.

### Lens E — On-product shell vs off-product group home

- WhatsApp (or similar) as the initial group layer is in scope for communication — `02` §Communication.
- **Tension:** brand and *felt safety* live in your UI; the “living room” of the group may live elsewhere — `01` / `12` “trustworthy shell” vs daily chat in another app.

---

## 5. Major areas — features in plain language, options, and recommendation

Each subsection: **what users experience** → **Option A / B / C** (implementation *style*, not code) → **recommended** → **why** (tied to docs).

### 5.1 Discovery — “what can I join near me?”

**Plain language:** A small, browsable set of real gatherings — not an endless directory. Cards answer: *what, when, roughly where, is it still open, what kind of evening/day is this?* Detail is where someone *decides with confidence*. Published events may still show **detail** when apply is **closed**, so people get clarity instead of a dead end — `10`, aligned with apply guards in `06` / `09`.

| Option | What it feels like | Upside | Downside |
|--------|--------------------|--------|----------|
| **A — Feed-first (curated list)** | Vertical list of calm cards | Matches “not a noisy marketplace,” low cognitive load — `10` | Geography is weaker unless layered in |
| **B — Editorial hero + short list** | One strong story, then few events | Premium, intentional — `12` | Fewer comparisons without extra navigation |
| **C — Map-first or map + list** | Place is the organizing idea | Reinforces city/area — cards already imply location — `10` | Easy to feel “directory-like” unless map stays sparse and quiet — `12` |

**Recommended:** **A as default**, with **B** on landing or campaign moments; add **C** only if map stays visually minimal and Hebrew/RTL feels native — rationale: strongest fit to “curated, calm, socially legible” in `10` and “quietly premium” in `12`.

---

### 5.2 Activation — “from browsing to raising my hand”

**Plain language:** Make the path from interest to **submitted apply** (or **submitted proposal**) obvious, resumable, and measurable. Questionnaire answers *who I am*; apply answers *why this gathering* — `09`.

| Option | Plain description | Fits |
|--------|-------------------|------|
| **A — Funnel-first** | Ship discovery → readiness (questionnaire / trust) → apply/propose early; measure browse→apply and completion — metrics in `02` §10 | Maximizes learning on demand before deep lifecycle |
| **B — Thin vertical slice** | One narrow path end-to-end through review, group confirm, attend, feedback — `02` §1, §11 | Proves full story with small catalog |
| **C — Ops backbone first** | Solid statuses and admin review before widening discovery — `02` §3 curation; FRs in `06` | Reduces rework; risk of “back office ready, front door quiet” |

**Recommended:** **Blend A then B** — open the front door enough to learn (`02` §10), then harden one slice to “real meet + feedback” proof in §1. Use **C** in parallel only where status semantics would otherwise block honest participant UI.

---

### 5.3 Apply and propose — “raising my hand the right way”

**Plain language:** Apply is **per event**, light, not a repeat of the whole profile, with clear guards (signed in, ready profile, no duplicate, event still open) — `09`, `06` FR-9–15, proposal FR-16–19 in spirit of `02` §3.

| Option | Tone |
|--------|------|
| **A — Minimal fields** | Fastest completion; needs excellent helper copy for anything sensitive — `11` |
| **B — Structured prompts** | Slightly more typing; easier for admin to compare applicants fairly — `04` |
| **C — Hybrid** | One free-text plus one “pick what matters most” line — balances `09` “not bureaucratic” with review needs |

**Recommended:** **C** for MVP learning: keeps apply **event-specific** (`09`) while giving admins comparable signals (`04`).

---

### 5.4 Trust and verification — “why should I trust this room?”

**Plain language:** Verification exists so people feel **safer, calmer, and less random** — not only to stop abuse — `11`. Participant-facing trust is **present but not paranoid** — `12`.

**Tension (audit this explicitly):** depth of verification vs **light, non-bureaucratic** apply — `09`, `12` vs fields listed in `11` / `06`.

| Option | Tradeoff |
|--------|----------|
| **A — Progressive disclosure** | Ask sensitive pieces only when needed; more design work |
| **B — Front-load essentials** | Fewer mid-flow surprises; higher drop-off risk |
| **C — Explain-in-place** | Keep fields but always pair with short “why we ask” — `08`, `11` |

**Recommended:** **C** short-term (fastest trust-per-friction), move toward **A** as patterns stabilize.

---

### 5.5 Admin and host — “running the room without sounding like a bank”

**Plain language:** Admins need precision; participants need warmth. Participant surfaces must not feel like a generic marketplace or internal ops tool — FR-42 in `06`, tone split in `12`.

| Option | Risk |
|--------|------|
| **A — Shared components everywhere** | Faster build; language can drift cold or jargon-heavy |
| **B — Strict participant vs admin voice** | Slightly more duplication; clearer trust |
| **C — Participant preview from admin** | Best QA of leaks; more workflow |

**Recommended:** **B** as default; add **C** for high-risk screens before launch.

---

### 5.6 Payment — explicit “not now” contract

**Plain language:** The long-term product story may include pay-after-commitment (see guiding list in `docs/mvp-v1/README.md`), but **this phase** explicitly **defers payment**: no checkout, no provider — `02` §3 Payment, §4; **FR-23–25** in `06` (flows completable without payment; pay only after approval/confirmation if it returns; replacement-after-non-payment is later).

**Risks if payment language leaks (audit):**

- Creates **pressure** inconsistent with participant stories — `05`.
- Implies **features that do not exist** — support and trust cost — `02` §4.
- Sounds **marketplace-like** — conflicts FR-42 — `06`.

**Recommendation:** Treat “payment” as a **locked drawer** in copy and UI: no buttons, no “next you’ll pay” unless the build truly includes that phase. Admin stories in `05` that mention replacement after missed payment should **not** surface to participants while FR-25 defers replacement logic.

---

### 5.7 Circles-style product direction (inspiration, not spec)

**Plain language:** Some teams describe the next evolution as closer to **“energy near me”** (map and locality), **browseable curated activities** (like familiar event communities), and **honest discussion of blockers** (forum-style pain points). Those are **product discovery references**, not commitments.

| Reference angle | What to borrow (conceptually) | What to avoid |
|-----------------|--------------------------------|---------------|
| Map / locality emphasis | Reinforces city-first pilot — `02` §5 | Dense “pins everywhere” feeling — fights `10`, `12` |
| Curated listings | Small catalog, editorial trust — `10` | Open marketplace scale — out of scope — `02` §4 |
| Community forums (patterns) | Language for objections and FAQs | Building a full social feed — out of scope — `02` §4 |

**Recommended:** Use these references in **workshops and copy tests**, not as scope expansion until the core loop in §2 of this doc is proven.

---

## 6. Language and voice cheat sheet (non-technical)

| Prefer | Avoid (participant-facing) |
|--------|-----------------------------|
| Warm, specific, low-pressure — `12` | Corporate cold, growth hacks — `12` |
| Hebrew-first character; RTL feels native — `12` | “Translated bolt-on” feel — `12` |
| “Why we ask” for sensitive questions — `08`, `11` | Interrogation / psych-test tone — `08` |
| Clear next step after apply — `09`, `04` | Opaque “pending” with no human context — `04` |
| Curated, calm discovery — `10` | “Grab a ticket” marketplace energy — `10`, FR-42 — `06` |

**Admin-facing:** cleaner, more factual; still on-brand — `12`.

---

## 7. Metrics that match the story (for audits of “what we optimized”)

From `02` §10 (representative set): funnel (browse→apply, browse→proposal, profile completion, apply completion), decision quality (approval rate, turnaround), outcomes (attendance, feedback, repeat intent).

**Audit question:** Did we ship a feature that **improves a metric** but **breaks a principle** (e.g. FR-42 or “not bureaucratic” apply)? If yes, document the override or revert.

---

## 8. Known cross-doc tensions (checklist for readers)

Synthesized from parallel review of `01`–`12` (see internal research pass, 2026-04-21):

1. **Payment in narrative vs payment in build** — align README / product language with `02` + FR-23–25 — `06`.
2. **Closed event still visible** — ensure CTAs and copy match emotional reality — `10` + apply guards — `09` / `06`.
3. **Trust depth vs lightweight apply** — sequencing and helper copy are part of the feature — `11` vs `09` / `12`.
4. **Human curation vs throughput** — SLA and expectations for applicants — `04`, `02` §10.
5. **Algorithm assists admin** but is not public “source of truth” — `01`, `02` §4, FR-32 — `06` — governance of explanations.
6. **WhatsApp vs branded shell** — continuity of trust — `02`, `12`.

---

## 9. Later audit — questions to answer with evidence

Use this section in a formal audit (quarterly or pre-launch).

### Product and scope

- [ ] Does every major feature trace to the loop in `02` (discover → … → feedback)?
- [ ] Are `event` / `experience` / `circle` treated as one concept in UX — `02` §2?
- [ ] Is anything in `02` §4 (out of scope) accidentally shipped?

### Participant trust and tone

- [ ] Do participant surfaces violate FR-42 — `06`?
- [ ] Does discovery match “not a noisy marketplace” — `10`?
- [ ] Does visual/copy direction match `12` north star?

### Apply / propose / discovery

- [ ] Apply remains event-specific and non-repetitive — `09`?
- [ ] Detail behavior for closed-but-published events matches `10`?
- [ ] Duplicate apply and readiness gates documented and tested — `09`, `06`?

### Payment

- [ ] No checkout path unless phase explicitly changed — `02`, `06` FR-23–25?
- [ ] No participant copy implying paywall or replacement rules that are not implemented — `05` vs FR-25?

### Ops and launch

- [ ] “MVP done” five-part definition in `docs/superpowers/specs/2026-04-21-mvp-finish-roadmap-design.md` satisfied with evidence?
- [ ] E2E and smoke evidence recorded for the journeys that matter — same roadmap doc?

---

## 10. Recommended way to proceed (executive summary)

1. **Hold the loop sacred** — judge every initiative against `02` §11; say “no” or “later” generously — `02` §4.
2. **Default discovery to curated feed**; treat map and hero layouts as deliberate, sparse experiments — `10`, `12`.
3. **Ship activation learning early** (browse → apply/propose, completion metrics) without payment language — `02` §10, FR-23 — `06`.
4. **Protect participant voice**; isolate admin precision — FR-42 — `06`, `12`.
5. **Resolve trust friction with words and sequencing**, not only with more fields — `08`, `09`, `11`.
6. **Use this file + `mvp-v1` + MVP finish roadmap** as the trio for audits: intent, specification, and “done means.”

---

## 11. Document control

| Version | Date | Notes |
|---------|------|--------|
| 1.0 | 2026-04-21 | Initial consolidated spec; cross-check against `docs/mvp-v1` and superpowers roadmap/spec set. |

**Subagent coverage used for synthesis (internal):** parallel passes on MVP-v1 anchors and tensions; design/RTL/copy and surface-style options; activation funnel and payment deferral sequencing — all reconciled to canonical paths above.

When this spec and `mvp-v1` disagree, **`mvp-v1` wins** unless the team explicitly adopts a change and updates those files.
