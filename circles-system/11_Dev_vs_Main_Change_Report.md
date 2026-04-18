DEV vs MAIN - Change Report for V3 Preflight
Executive Summary
This report summarizes the changes in the matching algorithm between the main branch (baseline) and the dev branch (Circles-Guy-edit). The development branch implements V3 Preflight Alignment, focusing on truthfulness, removing silent mismatches, and improving observability for the upcoming field tests.

Key highlights include:

Truthfulness: Removal of latent data (Q15) and refinement of role definitions.
Improved UX: New "Story Matching" and "Openness" factors to better reflect real-world social dynamics.
Observability: A robust diagnostics and feasibility system to explain matching results.
Table of Changes
Change Item	Category	Status	Risk
Q15 Removal	Preflight Alignment	TAKE_NOW	Low
EnergyRole Standard	Preflight Alignment	TAKE_NOW	Low
Gender Balance Fix	Preflight Alignment	TAKE_NOW	Medium
Observability Tools	Preflight Alignment	TAKE_NOW	Low
Story Matching	Heuristic Improvement	TAKE_NOW	Medium
Openness Score	Heuristic Improvement	DEFER	Low
Talker Penalty	Heuristic Improvement	TAKE_NOW	Medium
Age Tolerance Logic	Experiment	REJECT	Medium
Detailed Analysis
1. Preflight Alignment Fixes
Focus: Consistency, truthfulness, and observability.

[CHANGE] Q15 Removal & Score Normalization
What changed: Q15 (Social comfort) was removed from the scoring logic. Max raw score per dimension (E/A) changed from 18 to 15.
Where: 
scoring.ts
Why it matters: Removes a redundant/confusing signal. Aligns code with V3 survey specs.
Impact: Slight shift in core scores; requires re-validation of role assignment thresholds.
Status: TAKE_NOW
Measure in Field: Role assignment accuracy (participant self-ID vs assigned role).
[CHANGE] EnergyRole Naming Standardization
What changed: Renamed driver → leader, space_holder → holder, balancer → flexible, quiet_warmer → quiet.
Where: 
candidateSelection.ts
Why it matters: Aligns code with documentation and UI terminology. Removes "silent mismatches" in developer communication.
Status: TAKE_NOW
[CHANGE] Gender Balance Pre-Check
What changed: Added gender balance validation before consolidation moves in table formation.
Where: 
tableFormation.ts
Why it matters: Prevents the creation of "all-male" or imbalanced tables during the final "cleanup" phase of the algorithm.
Status: TAKE_NOW
2. Heuristic Improvements
Focus: Better social outcomes (potentially beneficial).

[CHANGE] Story Matching (Oleh/Moved/Local)
What changed: New logic to detect participant "stories" based on origin and current location. Adds bonuses (+15 for dual Oleh, +10 for same category).
Where: 
scoring.ts
Why it matters: Significant social "glue". Participants from similar backgrounds (e.g., Olim) have higher connection likelihood.
Risk: Over-homogenization if weights are too high.
Status: TAKE_NOW
Measure in Field: Connection Likelihood KPI; "Did you find someone with a similar life story?"
[CHANGE] Talker Penalty (TOO_MANY_TALKERS)
What changed: Detects if 3+ "talkers" are at a table and applies a 0.80 penalty.
Where: 
constraints.ts
, 
config.ts
Why it matters: Prevents "cockfights" or dominated conversations where everyone tries to lead.
Status: TAKE_NOW
3. Experiments / Risky Changes
Focus: Defer or reject for field testing.

[CHANGE] Openness-Based Age Tolerance
What changed: Increases age tolerance by +2 years if either participant has an "Openness" score > 80.
Where: 
constraints.ts
Risk: High. This effectively "breaks" the hard age tiers based on a secondary derived score. This should be deferred to ensure core age logic is stable first.
Status: REJECT (for now).
Recommended Actions
Merge Alignment Fixes: Immediately merge Q15 removal, naming updates, and gender balance fixes.
Accept Story Matching: Include the Story Matching logic but cap the bonus at 15 points to prevent it from overriding table roles.
Roll Back Age Tier Modification: Revert the Openness-based age tolerance bonus to keep field tests predictable.
Deploy Admin Diagnostics: Enable the new feasibility and placement diagnostic tools for the ops team during the events.