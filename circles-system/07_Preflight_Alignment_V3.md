	•	Issue (פער)
	•	Decision (לטפל / לדחות)
	•	Action before field (כן/לא)


# Preflight Alignment – V3
(Status: REQUIRED before field launch)

## Purpose
This document resolves **logical and contractual mismatches** between:
- Questionnaire (UX)
- Documentation
- Scoring logic
- Algorithm behavior

This is **not optimization**.
This is **truth alignment** to ensure that:
- Collected data is real signal
- Admin diagnostics are interpretable
- Field results can be trusted

No scoring weights or behavioral tuning are introduced here.

---

## Alignment Rules
- No feature exists in UX unless it has real effect OR is explicitly marked experimental.
- No scoring logic runs unless it has a documented source of truth.
- No data is collected without a declared purpose.
- Everything unresolved is explicitly deferred, not silently ignored.

---

## A. Scoring Source of Truth

### Issue
Two parallel scoring paradigms exist:
- V3 questionnaire weights (legacy / documented)
- Expectation-based outcomes (5 dimensions) used in code

This creates ambiguity about what “matching quality” actually means.

### Decision
**Expectation-based scoring (5 dimensions) is the sole source of truth for V3 field testing.**

V3 weights are considered:
- Design reference only
- Not active drivers of total score

### Action before field
- [ ] Document expectation dimensions as primary scoring logic (DONE in 08)
- [ ] Mark V3 weights as non-operative for V3
- [ ] Ensure admin views reference expectation labels, not legacy V3 labels

---

## B. Q_MATCH (Similarity / Diversity Toggle)

### Issue
Q_MATCH exists in:
- UX
- Docs

But is **not implemented in code**.
User intent is collected but ignored.

### Decision
**Q_MATCH is disabled for V3 field testing.**

Rationale:
- Partial or placeholder implementation would generate false learning.
- Similarity/diversity effects require stable baseline first.

### Action before field
- [ ] Remove Q_MATCH influence from any matching assumptions
- [ ] Update UX copy to indicate experimental / future use
- [ ] Do not log Q_MATCH as diagnostic signal in V3 analysis

---

## C. Talk / Listen Balance

### Issue
Talk / Listen is described as:
- “Warning” or soft signal in docs
But appears to influence scoring dimensions (Flow, Energy Balance).

Self-report reliability is uncertain.

### Decision
**Talk / Listen remains in scoring but is explicitly marked as EXPERIMENTAL.**

### Action before field
- [ ] Mark Talk / Listen as experimental in internal docs
- [ ] Do not use it as explanation for table outcomes
- [ ] Observe only qualitative alignment with field feedback

---

## D. Sensitivity / Safety Signals

### Issue
Sensitivity-related inputs are collected but:
- Mapping to Comfort / Inclusion is unclear
- Weight and gating behavior are not transparent

### Decision
**Sensitivity signals remain passive modifiers only.**
They must not:
- Gate placement
- Trigger hard exclusions

### Action before field
- [ ] Confirm sensitivity does not hard-block placements
- [ ] Use only for post-event analysis, not pre-event filtering
- [ ] Treat safety outcomes as field-validated, not predicted

---

## E. Interests & Depth

### Issue
Interest overlap and Depth / Openness:
- Are collected
- Have weak or ambiguous predictive power
- Are inconsistently reflected in admin diagnostics

### Decision
**Interests and Depth remain soft modifiers only.**
They are not expected to strongly predict outcomes in V3.

### Action before field
- [ ] Avoid presenting interests/depth as primary matching logic
- [ ] Use only for correlation analysis post-event
- [ ] No tuning or reweighting pre-field

---

## F. Role Double Counting (E/A derived)

### Issue
Roles (Initiator / Holder / Leader):
- Influence multiple expectation dimensions
- Are effectively double-counted
- Have disproportionate impact on table score

### Decision
**No change before field.**
This is a known risk accepted for V3.

### Action before field
- [ ] Document role double-counting explicitly (DONE in 08)
- [ ] Monitor role-heavy tables closely in field feedback
- [ ] Do not rebalance without post-field evidence

---

## G. Hard Constraints Transparency

### Issue
Hard constraints (Gender, Language, Friends, Table Size):
- Are well-defined
- But exclusion reasons are not always surfaced clearly

### Decision
**Constraints remain unchanged.**
Focus is on observability, not relaxation.

### Action before field
- [ ] Log exclusion reason per unplaced participant
- [ ] Track constraint-driven exclusion rates separately
- [ ] Prepare messaging for unplaced participants (if needed)

---

## Final Preflight Checklist

Before field launch, confirm:
- [ ] No UX element implies effect that does not exist
- [ ] One scoring source of truth is declared
- [ ] Experimental components are labeled as such
- [ ] No data is collected “just in case”
- [ ] All known risks are documented, not hidden

Once complete:
→ V3 is LOCKED for 2–3 field events.
→ No changes until post-field review.

---

## Status
- Alignment: IN PROGRESS
- Field readiness: PENDING completion of this document