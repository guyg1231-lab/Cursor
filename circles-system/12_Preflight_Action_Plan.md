# Preflight Action Plan

## Purpose
This document is the Preflight Action List derived from changes marked **TAKE_NOW** in the Dev vs Main Change Report (11_Dev_vs_Main_Change_Report.md). Each action is specified with a decision statement, acceptance criteria, risks, affected KPIs, and whether it changes behavior or only observability. No new changes are proposed beyond the report.

**Sources:** 11_Dev_vs_Main_Change_Report.md, 07_Preflight_Alignment_V3.md, 03_Risky_Decision_Points.md, 04_KPI_Candidates.md, 05_Open_Decisions.md.

---

## Action 1: Q15 Removal & Score Normalization

### Decision statement
Q15 (Social comfort) is removed from the scoring logic. Max raw score per dimension (E/A) changes from 18 to 15. Expectation-based scoring remains the source of truth; code is aligned with V3 survey specs and removes a redundant/confusing signal.

### Acceptance criteria
- Q15 is not used in any scoring or role-assignment path in code (e.g. scoring.ts).
- Max raw score per E/A dimension is 15 in implementation and in any documented thresholds.
- Role assignment thresholds (e.g. 60/40) are defined and validated against the 15-point scale.
- Role assignment accuracy can be measured in the field (participant self-ID vs assigned role).

### Risks
- Slight shift in core scores; some participants may receive different role classifications than under the previous scale.
- Role assignment thresholds require re-validation; sensitivity to role scores (03) and double-counting of roles remain.
- If thresholds are not recalibrated, role-driven tables may diverge from participant self-perception.

### KPI(s) affected
- **Matching Effectiveness:** Algorithm prediction vs post-event feedback alignment.
- **Experience Quality:** CSAT, subjective satisfaction with table experience (roles feed Conversation Flow, Inclusion, Energy Balance).
- **Discourse & Dynamics:** Self-reported conversation flow, perceived inclusion / voice balance (role mix affects these outcomes).

### Behavior vs observability
**Behavior** — Scoring and role assignment logic change; table formation and scores can differ from baseline.

---

## Action 2: EnergyRole Naming Standardization

### Decision statement
Internal role names in code are aligned with documentation and UI: `driver` → `leader`, `space_holder` → `holder`, `balancer` → `flexible`, `quiet_warmer` → `quiet`. No change to scoring math; only naming and any labels used in diagnostics or logs.

### Acceptance criteria
- In candidateSelection.ts (and any matching path), the canonical role names are leader, holder, flexible, quiet.
- No production or diagnostic code uses driver, space_holder, balancer, quiet_warmer for these roles.
- Documentation and admin-facing labels use the same terminology (leader, holder, flexible, quiet).

### Risks
- Low (per report). Any external system or legacy log that still expects old names could misparse; one-time check for integrations and log consumers is sufficient.

### KPI(s) affected
- **Matching Effectiveness:** Algorithm prediction vs post-event feedback alignment (improved interpretability of diagnostics).
- **Diagnostic visibility** (03): Admin-facing labels reflect actual scoring drivers; reduces risk of misattribution in post-event analysis.

### Behavior vs observability
**Observability only** — No change to scoring or table formation; only naming and diagnostic consistency.

---

## Action 3: Gender Balance Pre-Check

### Decision statement
Gender balance validation is run before consolidation moves in table formation. Tables that would become all-male or otherwise violate gender balance (e.g. M ≤ F, no gender isolation) during the final cleanup phase are not accepted; the algorithm does not create such tables.

### Acceptance criteria
- Before any consolidation move that finalizes a table, a gender balance check is performed.
- No table is output that violates the existing gender rules (M ≤ F, no gender isolation).
- The pre-check is applied in tableFormation.ts (or equivalent) in the path that performs consolidation/cleanup.
- Placement rate and exclusion reasons are still observable (e.g. exclusion reason per unplaced participant, per 07).

### Risks
- Medium (per report). Stricter enforcement may reduce placement rate in pools where consolidation would have produced otherwise-valid but imbalanced tables.
- Constraint-induced exclusion (03): Hard gender balance rules already exclude excess males; pre-check may increase exclusion in edge cases or change which participants are unplaced.
- Gender policy definitions (05) remain open (e.g. treatment of "Other"); pre-check should be consistent with current policy.

### KPI(s) affected
- **Matching Effectiveness:** Placement rate, table completion rate (4–6 participants).
- **Risk & Safety:** Subjective discomfort or exclusion feedback, early departure or no-show correlation.
- **Discourse & Dynamics:** Perceived inclusion / voice balance (gender balance supports inclusion).

### Behavior vs observability
**Behavior** — Table formation and placement outcomes can change; fewer invalid tables, possibly fewer total placed depending on pool.

---

## Action 4: Observability Tools

### Decision statement
A feasibility and placement diagnostics system is enabled for the ops team during events. Admins can use it to understand why participants were placed or not placed and to assess feasibility; it does not change matching results.

### Acceptance criteria
- Feasibility and placement diagnostic tools are available to ops during events (e.g. admin-facing views or exports).
- Diagnostics explain matching results (e.g. why a participant was placed at a table, or why unplaced) without altering the algorithm output.
- No code path uses observability output as an input to scoring or placement decisions.

### Risks
- Low (per report). Risk of info overload or misuse (e.g. using diagnostics to manually override or second-guess matching without a formal process); training or guardrails may be needed so diagnostics support analysis only.

### KPI(s) affected
- **Matching Effectiveness:** Algorithm prediction vs post-event feedback alignment (better analysis of why matches occurred).
- **Diagnostic visibility** (03): Reduces gaps between admin labels and actual scoring drivers; supports post-event analysis and messaging for unplaced participants (07).

### Behavior vs observability
**Observability only** — No change to scoring or placement; only availability of explanations and feasibility information.

---

## Action 5: Story Matching (Oleh / Moved / Local)

### Decision statement
Story-based matching is added: participant "story" is derived from origin and current location (e.g. Oleh, Moved, Local). A bonus is applied when two participants share the same story category (+15 for dual Oleh, +10 for same category). The story bonus is capped at 15 points total so it does not override table role balance (per report recommendation).

### Acceptance criteria
- Story detection logic is implemented (origin + current location → category).
- Bonus applied in scoring: +15 when both are Oleh, +10 when same category (exact rule as in report); total story bonus capped at 15.
- Logic lives in scoring.ts (or documented equivalent).
- Connection Likelihood and "similar life story" can be measured in the field (per report).

### Risks
- Medium (per report). Over-homogenization if weights are too high; cap at 15 is intended to limit this. Interest overlap is a weak predictor (03, 07); story overlap may behave similarly—observe in field before increasing weight.
- May reduce diversity of perspective at tables with high story overlap.

### KPI(s) affected
- **Experience Quality:** Subjective satisfaction with table experience.
- **Retention & Continuity:** Direct connection rate (exchange of contact details), post-event follow-up interactions.
- **Matching Effectiveness:** Algorithm prediction vs post-event feedback alignment; Connection Likelihood dimension.

### Behavior vs observability
**Behavior** — New scoring component; table scores and composition can change (e.g. higher likelihood of same-story pairs at a table).

---

## Action 6: Talker Penalty (TOO_MANY_TALKERS)

### Decision statement
When a table has 3 or more participants classified as "talkers," a penalty factor of 0.80 is applied to that table’s score. This is intended to reduce "cockfights" or dominated conversations where too many people try to lead.

### Acceptance criteria
- Talker classification is defined and used consistently (e.g. from questionnaire or existing talk/listen signal).
- When 3+ talkers are present at a table, a 0.80 penalty is applied (implementation in constraints.ts / config.ts as in report).
- When 2 or fewer talkers are present, no such penalty is applied.
- Behavior is documented (e.g. in config or internal docs) so diagnostics can interpret it.

### Risks
- Medium (per report). Talk/Listen is self-reported (07, 03); reliability as behavioral predictor is uncertain. Risk of over-penalizing tables where self-report does not match actual behavior, or of misclassifying talkers.
- May lower placement or table quality score for some tables that would have been acceptable in practice; could affect placement rate or which tables are filled first.

### KPI(s) affected
- **Discourse & Dynamics:** Self-reported conversation flow, perceived inclusion / voice balance, absence of dominance or social isolation signals.
- **Experience Quality:** CSAT, subjective satisfaction with table experience.

### Behavior vs observability
**Behavior** — Scoring and table formation change; tables with 3+ talkers are penalized and may be deprioritized or broken up in formation.

---

## Summary Table

| # | Action                       | Behavior / Observability | Risk  | Primary KPI areas                          |
|---|-----------------------------|---------------------------|-------|--------------------------------------------|
| 1 | Q15 Removal                 | Behavior                  | Low   | Matching Effectiveness, Experience, Discourse |
| 2 | EnergyRole Naming Standard  | Observability             | Low   | Matching Effectiveness, Diagnostic visibility |
| 3 | Gender Balance Pre-Check    | Behavior                  | Medium| Placement, Table completion, Risk & Safety, Discourse |
| 4 | Observability Tools         | Observability             | Low   | Matching Effectiveness, Diagnostic visibility |
| 5 | Story Matching              | Behavior                  | Medium| Connection/Retention, Experience, Matching Effectiveness |
| 6 | Talker Penalty              | Behavior                  | Medium| Discourse & Dynamics, Experience Quality   |

---

## Document metadata
- **Source:** TAKE_NOW items from 11_Dev_vs_Main_Change_Report.md only; no new changes proposed.
- **Use:** Preflight checklist for implementation and field readiness; acceptance criteria support sign-off before field tests.
