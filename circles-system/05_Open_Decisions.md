# Open Decisions (To Be Resolved)

## Scoring Source of Truth
- Should matching be driven by documented V3 questionnaire weights?
- Or by the current outcome-based "Expectations" scoring?
- Or a defined hybrid model?

## Q_MATCH Similarity / Diversity Policy
- Implement the similarity/diversity modulation mathematically.
- Remove Q_MATCH from UX and documentation.
- Redefine its role as a soft preference only.

## Friend Pair Priority
- Keep friend pairs as absolute, atomic placement units.
- Allow soft priority with quality tradeoffs.
- Allow partial placement or split logic under constraints.

## Gender Policy Definitions
- How should "Other" be treated in balance logic?
- Is M ≤ F a permanent hard constraint?
- Should gender isolation always override quality considerations?

## Legacy Fields (Collected but Unused)
- Occupation
- Budget
- Background/contextual data

Decide whether to:
- Remove from data collection.
- Connect as soft signals.
- Keep for future use only.

## Placement vs Quality Tradeoff
- What is the acceptable quality threshold for seating an additional participant?
- Should placement density ever override individual isolation risk?

## Restart & Optimization Strategy
- Keep current greedy multi-restart approach.
- Adjust restart depth and diversity.
- Explore alternative optimization strategies.

## KPI Weighting Strategy
- Should KPIs differ for first-time vs returning participants?
- Which KPIs are gating vs observational?

## Decision Ownership
- Which decisions require partner agreement?
- Which can be owner-decided?
