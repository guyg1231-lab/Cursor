# Current System State (As-Is)

## System Intent
Optimal matching of participants into social dining groups (4–6 people) based on personality roles, communication styles, and constraints, in order to ensure a balanced, safe, and comfortable social experience.

## Declared Logic
The declared matching logic is a wave-based greedy placement approach with multi-restart optimization.  
Personality roles are derived primarily from Extraversion/Agreeableness scores, using a 60/40 threshold split.  
Compatibility is composed of:
- Hard constraints: gender balance (M ≤ F), language compatibility, age constraints.
- Soft scoring weights: roles, interests, depth, and background.

The system includes a stated Similarity vs Diversity modulation mechanism (Q_MATCH), intended to adjust weighting across multiple dimensions.

## Effective Logic
In practice, the algorithm operates as a multi-restart (approximately 10 restarts) greedy formation process driven by expectation-based scoring.  
Group formation prioritizes placement density over individual quality, using an extremely high multiplier (approximately 10,000x) to favor seating an additional participant over marginal score improvements.

Scoring is based on predicted outcomes rather than questionnaire weights, averaging five expectation dimensions:
- Conversation Flow
- Inclusion
- Energy Balance
- Comfort
- Connection Likelihood

Restart termination occurs after three non-improving iterations, which may result in convergence on local maxima.

## Hidden Rules
- Gender value "Other" is mathematically treated as "Male" for balance calculations.
- Leader capacity is strictly capped at two per table, enforced as a hard rule rather than a soft warning.
- Age tolerance is calculated using the maximum tolerance tier of the two participants, not an average.
- Language constraints only block the specific Hebrew-only / English-only intersection.
- Legacy UI indicators (Interest, Context) are no longer direct drivers of the final score.

## Forced Constraints
- Seating structures are fixed by predefined division logic (tables of 4, 5, or 6).
- Friend pairs are treated as a single atomic unit and are always placed before individual participants.
- Friend pairs cannot be split under any condition.
- Gender isolation is explicitly blocked, even if binary balance conditions are technically satisfied.

## Pairing Logic
Friend pairs are processed first and treated as indivisible units.  
If no compatible table with at least two available seats is found, the entire pair remains unplaced.  
Individual participants are placed afterward using greedy assignment based on current table composition and scoring outcomes.

## Table Composition Patterns
Observed table formation patterns include:
1. Pair-Anchored Tables – tables seeded early by friend pairs.
2. Hard-Wave Clusters – tables formed early around participants with restrictive constraints.
3. Flexible Mix Tables – tables completed later using highly compatible participants as fillers.

## Scoring Components
The total score is calculated as the average of five expectation dimensions:
- Conversation Flow
- Inclusion
- Energy Balance
- Comfort
- Connection Likelihood

Each dimension is base-scored in the approximate range of 30–60 and modified by:
- Role composition (initiators, holders, etc.)
- Constraint penalties (gender isolation, zero-leader configurations)
- Interest matches (partial and legacy-based)

The scoring system exhibits high sensitivity to Extraversion/Agreeableness values, which act as multipliers across multiple dimensions, and includes double-counting of space-holding roles across a majority of metrics.
