# Cross-Source Comparison — V3 Preflight

## Purpose
Cross-validate three perspectives on the Circles V3 system before field launch: (1) baseline implementation (main), (2) development branch changes (dev vs main report), and (3) Cursor analytical findings (Preflight Alignment, Scoring Calibration, Preflight Action Plan Clean). Classify where perspectives **align**, **diverge**, or leave gaps **unaddressed**. No new algorithm changes; confidence and consistency check only.

**Inputs:** 11_Dev_vs_Main_Change_Report.md, 12_Preflight_Action_Plan_Clean.md, 07_Preflight_Alignment_V3.md, 08_Scoring_Calibration_V3.md.

---

## 1. Strong Alignment

Identified in both dev changes and Cursor analysis; high-confidence candidates.

---

### Q15 Removal & Score Normalization

**Description:** Remove Q15 (Social comfort) from scoring; max E/A raw score 15 (was 18). Align code with V3 survey and remove redundant signal.

**Sources:** Dev report (TAKE_NOW, Preflight Alignment); 12_Clean (MUST); 07 (scoring source of truth / expectation-based); 08 (roles rely on E/A, scale matters).

**Why it matters:** Both streams agree this is a pre-field fix. Prevents false learning (scores and role assignment would otherwise use a scale that doesn’t match the questionnaire) and supports a single scoring source of truth.

**Recommended stance:** **Confirmed** — Lock as must-fix before field.

---

### Gender Balance Pre-Check

**Description:** Validate gender balance before consolidation moves in table formation so the algorithm never outputs all-male or otherwise invalid tables during cleanup.

**Sources:** Dev report (TAKE_NOW, Preflight Alignment); 12_Clean (MUST); 08 (hard constraints, gender isolation blocked, diagnostic gaps).

**Why it matters:** Both agree this fixes a logical gap. Prevents broken expectations (tables that violate stated policy) and unreliable field results.

**Recommended stance:** **Confirmed** — Lock as must-fix before field.

---

### EnergyRole Naming Standardization

**Description:** Align internal role names with docs/UI: driver→leader, space_holder→holder, balancer→flexible, quiet_warmer→quiet. No change to scoring math.

**Sources:** Dev report (TAKE_NOW); 12_Clean (OPTIONAL); 08 (diagnostic opacity, admin labels vs E/A driver).

**Why it matters:** Dev implements it; Cursor analysis calls out that admin labels may not reflect E/A and that silent mismatches hurt diagnostics. Same direction; Cursor treats as optional (non-blocking).

**Recommended stance:** **Confirmed** — Include before field if capacity allows; does not block launch.

---

### Observability Tools / Hard Constraints Transparency

**Description:** Enable feasibility and placement diagnostics for ops; explain why participants were placed or not placed; do not change matching results.

**Sources:** Dev report (TAKE_NOW, “Deploy Admin Diagnostics”); 12_Clean (OPTIONAL); 07 (log exclusion reason per unplaced participant, track constraint-driven exclusion rates, messaging for unplaced).

**Why it matters:** Dev delivers diagnostic tools; Cursor explicitly asks for exclusion logging and constraint visibility. Same intent—better observability without relaxing constraints.

**Recommended stance:** **Confirmed** — Enable for field; optional for launch but recommended.

---

### Openness-Based Age Tolerance (Reject)

**Description:** Do not increase age tolerance by +2 years based on Openness score; keep age tiers stable for field tests.

**Sources:** Dev report (REJECT, “Roll Back Age Tier Modification”); 08 (asymmetric age tolerance, edge case fragility); 03 (edge case fragility).

**Why it matters:** Dev rejects the change; Cursor documents that asymmetric age tolerance skews compatibility and is a known risk. Both agree not to add this behavior for V3.

**Recommended stance:** **Confirmed** — Do not introduce for V3 field test.

---

## 2. Dev-Only Insight

Present in dev branch or report; not raised or prioritized by Cursor analysis.

---

### Story Matching as TAKE_NOW (dev’s original stance)

**Description:** Dev report originally marked Story Matching (Oleh/Moved/Local) as TAKE_NOW with cap 15. Cursor Clean restructured it as DEFERRED for the short 2–3 event test.

**Sources:** Dev report (TAKE_NOW, Heuristic Improvement); 12_Clean (DEFERRED).

**Why it matters:** Dev valued “significant social glue” and connection likelihood; Cursor valued baseline stability and cited interest-overlap as weak predictor. The *value* of story-based matching is a dev-side insight; the *timing* was overridden by the Clean plan.

**Recommended stance:** **Investigate later** — After field data, reassess whether to add Story Matching; cap at 15 if added.

---

### Talker Penalty as TAKE_NOW (dev’s original stance)

**Description:** Dev report marked Talker Penalty (3+ talkers → 0.80 penalty) as TAKE_NOW. Cursor Clean deferred it, citing self-report reliability (07, 08) and short-test risk.

**Sources:** Dev report (TAKE_NOW); 12_Clean (DEFERRED); 07 (Talk/Listen experimental); 08 (Talk/Listen LOW confidence).

**Why it matters:** Dev aimed to prevent “cockfights”; Cursor flagged that Talk/Listen is self-reported and weakly validated. The *intent* is dev-only in terms of a concrete penalty; the *deferral* is the locked decision for V3.

**Recommended stance:** **Investigate later** — Observe talk/listen in field first; consider penalty in a later iteration.

---

### Openness Score (DEFER in dev)

**Description:** Dev explicitly defers “Openness Score” as a heuristic improvement. No corresponding Cursor action item; 08 treats Depth/Openness as a scoring component with LOW confidence.

**Sources:** Dev report (DEFER); 08 (Depth/Openness component, unclear implementation).

**Why it matters:** Dev chose not to add new Openness-driven behavior for field; Cursor did not propose an Openness change. Aligned outcome (no new Openness heuristic for V3); the explicit DEFER is dev-only.

**Recommended stance:** **Confirmed** — No Openness-based heuristic for V3 field test.

---

## 3. Cursor-Only Insight

Raised in Cursor docs (07, 08, 12_Clean); not addressed by dev code or report.

---

### Scoring Source of Truth (Expectation-Based)

**Description:** Declare expectation-based scoring (five dimensions) as the sole source of truth for V3; V3 questionnaire weights are design reference only, not active drivers.

**Sources:** 07 (Section A); 08 (scoring architecture); Dev report does not state this explicitly.

**Why it matters:** Removes ambiguity about what “matching quality” means and prevents false learning from mixing two paradigms. Doc/declaration only; no code change in dev report.

**Recommended stance:** **Confirmed** — Already decided in 07; lock for V3.

---

### Q_MATCH Disabled for V3

**Description:** Q_MATCH exists in UX/docs but is not implemented in code; user intent is collected but ignored. Decision: disable for V3, no influence on matching, mark experimental/future in UX.

**Sources:** 07 (Section B); Dev report does not mention Q_MATCH.

**Why it matters:** Prevents false learning from a partial or placeholder implementation. Purely declarative / UX; no dev change listed.

**Recommended stance:** **Confirmed** — Lock for V3; do not log Q_MATCH as diagnostic signal.

---

### Talk/Listen Marked Experimental

**Description:** Talk/Listen remains in scoring but is explicitly experimental; do not use it to explain table outcomes; observe only qualitative alignment with field feedback.

**Sources:** 07 (Section C); 08 (Talk/Listen LOW confidence, self-report risk).

**Why it matters:** Dev added Talker Penalty (which uses talk/listen); Clean deferred that penalty. So for V3 field: Talk/Listen still in scoring, but no new penalty, and Cursor says “experimental” and don’t explain outcomes by it.

**Recommended stance:** **Confirmed** — Mark experimental in docs; do not attribute table outcomes to Talk/Listen in analysis.

---

### Sensitivity Signals Passive Only

**Description:** Sensitivity-related inputs must not gate placement or trigger hard exclusions; use only for post-event analysis; treat safety outcomes as field-validated, not predicted.

**Sources:** 07 (Section D); 08 (Sensitivity LOW confidence, unclear usage).

**Why it matters:** Reduces risk of over-segmentation or invisible gating. Dev report does not mention sensitivity logic.

**Recommended stance:** **Investigate later** — Confirm in code that sensitivity does not hard-block placements before field.

---

### Interests & Depth Soft Only, No Tuning Pre-Field

**Description:** Interests and Depth remain soft modifiers only; do not present as primary matching logic; use only for correlation analysis post-event; no tuning or reweighting pre-field.

**Sources:** 07 (Section E); 08 (Interests weak predictor, Depth LOW confidence).

**Why it matters:** Aligns expectations with weak predictive power and avoids over-weighting before we have field data. Dev did not change interest/depth logic.

**Recommended stance:** **Confirmed** — No reweighting or presentation as primary logic for V3.

---

### Role Double-Counting Documented, No Change

**Description:** Roles (E/A) are double-counted across dimensions and have disproportionate impact; document explicitly, monitor in field, do not rebalance before field evidence.

**Sources:** 07 (Section F); 08 (Roles MEDIUM confidence, over-weighting and double-counting risks).

**Why it matters:** Dev improved diagnostic clarity via EnergyRole naming but did not change double-counting. Cursor explicitly accepts this as known risk for V3.

**Recommended stance:** **Confirmed** — Document in 08; monitor role-heavy tables; no rebalance for V3 field test.

---

## 4. Unaddressed / Ignored

Known gaps or risks that neither dev nor Cursor explicitly addressed with a change or decision.

---

### Gender “Other” Treatment

**Description:** “Other” is mathematically treated as Male for balance (08, 05). Open decision: how should Other be treated? Should balance logic change?

**Sources:** 08 (Hard constraints); 05 (Gender Policy Definitions); 07 does not resolve it.

**Why it matters:** May affect comfort or inclusion for non-binary participants; neither stream proposed a change for V3.

**Recommended stance:** **Ignore for V3 field test** — Keep current behavior; observe comfort/inclusion feedback by gender mix; revisit in 05 after field.

---

### Placement vs Quality Tradeoff

**Description:** Very high placement multiplier can degrade table quality to seat one more participant; high placement rate may mask poor experience (03, 08).

**Sources:** 03 (Placement vs Quality Tradeoff); 08 (placement vs quality in hard constraints).

**Why it matters:** Core algorithm tradeoff; neither dev nor Cursor proposed changing the multiplier or threshold for V3.

**Recommended stance:** **Ignore for V3 field test** — Observe placement rate and experience KPIs; no algorithm change.

---

### Local Maxima / Restart Termination

**Description:** Multi-restart greedy optimization stops after a few non-improving iterations; can converge on local maxima (03).

**Sources:** 03 (Local Maxima Risk); 08 references greedy formation; no change proposed.

**Why it matters:** May produce suboptimal table sets; neither stream proposed changing restart depth or strategy for V3.

**Recommended stance:** **Ignore for V3 field test** — No change; observe table completion and quality in field.

---

### Friend Pair Atomicity and Exclusion

**Description:** Friend pairs are indivisible; internal pair incompatibilities (e.g. age, language) can make whole pair unplaceable; exclusion reasons not always clear (03, 07, 08).

**Sources:** 03 (Constraint-Induced Exclusion, Edge Case Fragility); 07 (log exclusion reason); 08 (friend pair fragility). Dev added observability, not constraint relaxation.

**Why it matters:** Exclusion and frustration risk; 07 asks for logging/messaging. Observability addresses part of it; atomicity and split logic are unchanged.

**Recommended stance:** **Confirmed** — Rely on Observability Tools and 07 actions (log exclusion, messaging); no change to friend pair rules for V3.

---

## Summary

### Where confidence increased

- **Must-fix alignment:** Q15 Removal and Gender Balance Pre-Check are agreed by both dev and Cursor as pre-field fixes. Safe to lock.
- **No new risky behavior for field:** Age tolerance change rejected; Story Matching and Talker Penalty deferred. Openness Score deferred. Aligns with “short 2–3 event test, validate baseline first.”
- **Observability and truth alignment:** EnergyRole naming and Observability Tools are in both streams; 07’s scoring source of truth, Q_MATCH disabled, and experimental labels are Cursor-only but consistent with dev’s “truthfulness and observability” focus. Confidence that V3 field will not mix paradigms or over-claim for weak signals.
- **Hard constraints:** Gender pre-check and rejection of age-tier tweak increase confidence that constraint behavior is stable and interpretable for field.

### Where uncertainty remains

- **Talk/Listen:** Still in scoring; reliability and impact unclear (08 LOW confidence). No Talker Penalty for V3, but we are still using the signal; field should show whether it predicts flow/inclusion.
- **Sensitivity signals:** Cursor asks that they not gate placement; need to confirm in code. Uncertainty until verified.
- **Story Matching and Talker Penalty:** Dev originally TAKE_NOW; Clean deferred. Uncertainty is timing only—after field we will have data to decide.
- **Role double-counting:** Accepted as known risk; uncertainty is whether it distorts outcomes in practice; field will inform.

### What is safe to lock for field testing

- **Lock as must-fix before field:** Q15 Removal, Gender Balance Pre-Check.
- **Lock as optional pre-field:** EnergyRole Naming Standardization, Observability Tools.
- **Lock as deferred (no inclusion in V3 field):** Story Matching, Talker Penalty, Openness-Based Age Tolerance, Openness Score heuristic.
- **Lock as declared policy (no code change):** Expectation-based scoring as sole source of truth; Q_MATCH disabled for V3; Talk/Listen experimental; Sensitivity passive only; Interests & Depth soft only; Role double-counting documented, no rebalance.
- **Lock as “observe, no change”:** Gender “Other” treatment, placement vs quality, local maxima, friend pair atomicity—current behavior and observability only.

---

## Document metadata

- **Type:** Cross-source validation; no new algorithm changes or optimizations.
- **Use:** Increase confidence before field launch; clarify alignment, divergence, and unaddressed gaps; support go/no-go and post-field iteration choices.
