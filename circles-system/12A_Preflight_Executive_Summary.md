# Preflight Executive Summary — Circles V3

**One-page overview. Readable in under 3 minutes.**

---

## What is the goal of Preflight?

Preflight aligns the **Circles V3 matching system** with what we say it does—questionnaire, docs, and code—before we run 2–3 field events. The goal is **truth alignment**, not new features: fix mismatches, prevent false learning, and make diagnostics interpretable so field results can be trusted.

---

## What is locked for V3?

- **Scoring source of truth:** Expectation-based scoring (five dimensions: Conversation Flow, Inclusion, Energy Balance, Comfort, Connection Likelihood). V3 questionnaire weights are design reference only, not active drivers.
- **No new heuristics in scope for field:** New behavioral changes (e.g. Story Matching, Talker Penalty) are deferred until after we have field data.
- **Constraints unchanged:** Gender balance (M ≤ F, no isolation), language, friend pairs, table size (4–6), leader cap. Focus is observability and correctness, not relaxing rules.
- **Experimental labels:** Talk/Listen and similar signals stay in scoring but are marked experimental; we observe, we don’t explain outcomes by them yet.

---

## What must be done before field?

**Two must-fix actions:**

1. **Q15 Removal & score normalization** — Remove Q15 (Social comfort) from scoring and set max E/A raw score to 15. Aligns code with the V3 survey and removes a redundant signal. Without it, scores and role assignment use a scale that doesn’t match the questionnaire.
2. **Gender balance pre-check** — Validate gender balance before consolidation moves in table formation. Prevents the algorithm from outputting all-male or otherwise invalid tables during the final cleanup phase. Without it, we risk tables that violate stated policy.

Until these are done, V3 is not considered ready for field.

---

## What is explicitly deferred?

- **Story Matching (Oleh / Moved / Local)** — New scoring bonus for similar-life-story pairs. Behavior change; interesting but risky for a short 2–3 event test. Revisit after field data.
- **Talker Penalty (TOO_MANY_TALKERS)** — Penalty when 3+ talkers at a table. Depends on self-reported talk/listen, which is not yet validated. Revisit after we observe talk/listen in the field.

Optional pre-field (if capacity allows): **EnergyRole naming standardization** (code terms match docs/UI) and **Observability tools** (feasibility and placement diagnostics for ops). Neither changes matching behavior.

---

## When is V3 considered "ready"?

V3 is **ready for field** when:

- Both must-fix actions are complete (Q15 removed, gender balance pre-check in place).
- Preflight alignment checklist is satisfied: one scoring source of truth declared, no UX implying effects that don’t exist, experimental components labeled, known risks documented.
- No behavioral changes beyond the two must-fixes are included for the 2–3 event test.

After 2–3 events, we review field data and then decide on deferred items (Story Matching, Talker Penalty) and any further iteration.
