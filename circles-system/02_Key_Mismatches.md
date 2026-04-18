# Key Mismatches (Docs / UI / Code)

## Mismatch 1 - Q_MATCH Similarity / Diversity
- Exists in questionnaire and documentation.
- Implemented as a placeholder in code.
- No observable impact on scoring or matching outcomes.

## Mismatch 2 - Scoring Source of Truth
- Documentation describes V3 weights and dimension-based scoring.
- Code uses an outcome-based "Expectations" average.
- Admin/UI labels still reference legacy dimensions.

## Mismatch 3 - Story Match & Complementary Bonuses
- Documented as active scoring components.
- Not implemented in the current scoring engine.

## Mismatch 4 - Leader Capacity
- Documented as a warning / soft constraint.
- Enforced in code as a hard block (max 2 leaders).

## Mismatch 5 - Gender Definitions
- UI allows "Other".
- Code treats "Other" as "Male" for balance calculations.
