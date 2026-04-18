# Risky Decision Points

## Placement vs Quality Tradeoff
- The algorithm strongly prioritizes placement density over individual or table quality.
- Extremely high placement multipliers (approx. 10,000x) can cause quality degradation in order to seat one additional participant.
- High placement rates may mask poor experiential outcomes.

## Local Maxima Risk
- Multi-restart greedy optimization terminates after several non-improving iterations.
- Early convergence can lock the system into suboptimal table configurations.
- Limited exploration diversity between restarts increases stagnation risk.

## Sensitivity to Role Scores
- Extraversion / Agreeableness scores act as strong multipliers across multiple expectation dimensions.
- Small variances in E/A scores can disproportionately affect table-level outcomes.
- Double-counting of initiator and space-holder roles amplifies this effect.

## Constraint-Induced Exclusion
- Hard gender balance rules (M ≤ F) automatically exclude excess male participants.
- Friend pair atomicity can lead to unplaced participants even when partial seating is possible.
- Participants may be excluded solely due to remaining group size constraints (<4).

## Diagnostic Visibility Gaps
- Admin-facing labels do not consistently reflect the actual scoring drivers.
- Legacy indicators may mislead diagnostics and post-event analysis.
- Outcome-based scoring reduces transparency into why specific matches occurred.

## Edge Case Fragility
- Internal incompatibilities within friend pairs (age/language) can make pairs unplaceable.
- Asymmetric age tolerance may skew compatibility toward the most restrictive participant.
- Language constraints are inconsistently enforced across combinations.

## Notes
- This document captures observed risks only.
- No mitigation strategies or decisions are included at this stage.
