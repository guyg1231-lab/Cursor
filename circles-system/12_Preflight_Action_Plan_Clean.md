# Preflight Action Plan (Clean)

## Purpose
Restructured view of the Preflight Action Plan for Circles V3. Same six actions as the full plan; organized by **Must-Fix**, **Optional**, and **Deferred**. No new actions; no changed decisions.

**Source:** 12_Preflight_Action_Plan.md, 07_Preflight_Alignment_V3.md, 08_Scoring_Calibration_V3.md.

---

## 1. Must-Fix Before Field (Alignment / Truth)

Actions that must be completed before any field event because they fix logical or contractual mismatches and prevent false learning or broken expectations.

---

### Q15 Removal & Score Normalization

**What & Why:** Q15 (Social comfort) is removed from scoring so code matches the V3 survey. Max raw score per E/A dimension becomes 15 (was 18). This removes a redundant signal and aligns implementation with the declared source of truth. Without it, role assignment and scores use a scale that no longer matches the questionnaire, which would distort field learning and diagnostics.

**Risk:** Low  
**Status:** MUST

---

### Gender Balance Pre-Check

**What & Why:** Gender balance is validated before any consolidation move in table formation. Tables that would become all-male or otherwise violate gender rules (M ≤ F, no isolation) during the final cleanup phase are not accepted. This fixes a logical gap: the algorithm could previously output invalid tables in that phase. Without the pre-check, we risk broken expectations (tables that violate stated policy) and unreliable field results.

**Risk:** Medium  
**Status:** MUST

---

## 2. Safe-to-Add (Optional Pre-Field)

Actions that improve observability or operational clarity and do not materially change matching behavior. Safe to add before field if capacity allows.

---

### EnergyRole Naming Standardization

**What & Why:** Internal role names in code are aligned with documentation and UI: driver → leader, space_holder → holder, balancer → flexible, quiet_warmer → quiet. Scoring math is unchanged; only naming and diagnostic labels change. This removes silent mismatches between code and docs so admins and post-event analysis interpret results correctly.

**Risk:** Low  
**Status:** OPTIONAL

---

### Observability Tools

**What & Why:** Feasibility and placement diagnostics are enabled for the ops team during events. Admins can see why participants were placed or not placed and assess feasibility. The tools do not alter matching results; they only improve operational clarity and post-event analysis.

**Risk:** Low  
**Status:** OPTIONAL

---

## 3. Deferred (Post-Field / Iteration Candidates)

Actions that change behavior or heuristics and are interesting but risky for a short 2–3 event field test. Defer until after V3 field data is reviewed.

---

### Story Matching (Oleh / Moved / Local)

**What & Why:** New scoring component: participant "story" is derived from origin and current location (e.g. Oleh, Moved, Local). Bonuses apply when two participants share the same story (+15 dual Oleh, +10 same category, cap 15). This aims to improve connection likelihood for similar-life-story pairs but changes table composition and scores. For a short test, the risk of over-homogenization or weak predictor (like interest overlap) outweighs the benefit; better to validate baseline first, then iterate.

**Risk:** Medium  
**Status:** DEFERRED

---

### Talker Penalty (TOO_MANY_TALKERS)

**What & Why:** When a table has 3+ "talkers," a 0.80 penalty is applied to that table’s score to reduce dominated conversations. Talk/listen is self-reported and its reliability is uncertain (07, 08). Adding a new penalty based on it for 2–3 events risks over-penalizing acceptable tables or misclassifying participants; better to observe talk/listen in field first, then consider the penalty in a later iteration.

**Risk:** Medium  
**Status:** DEFERRED

---

## Summary

| Action                       | Status   | Risk   |
|-----------------------------|----------|--------|
| Q15 Removal                 | MUST     | Low    |
| Gender Balance Pre-Check    | MUST     | Medium |
| EnergyRole Naming Standard  | OPTIONAL | Low    |
| Observability Tools         | OPTIONAL | Low    |
| Story Matching              | DEFERRED | Medium |
| Talker Penalty              | DEFERRED | Medium |

---

## Document metadata
- **Type:** Restructured view; same decisions as 12_Preflight_Action_Plan.md.
- **Use:** Quick prioritization for pre-field work and clear separation of must-do, optional, and post-field items.
