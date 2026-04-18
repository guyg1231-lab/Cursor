# Inbox - Stage 1 Outputs (Raw)

## Instructions
- Paste raw summaries here without editing.
- Do not organize here.
- Each paste should be separated by a header with date + source.
- After pasting, create extraction tasks (bullets) at the bottom.

---

## Paste Block 1 - Stage 1 Consolidated Summary (from Antigravity)
[PASTE HERE - your full Stage 1 summary]

---

## Extraction Tasks (to do next)
- [ ] Create "01_Current_State/Algorithm_As_Is.md"
- [ ] Create "02_Mismatches/Key_Mismatches.md"
- [ ] Create "03_Risks/Risky_Decision_Points.md"
- [ ] Create "04_KPIs/KPI_Candidates.md"
- [ ] Create "05_Decisions/Open_Decisions.md"
- [ ] Create "06_Dedup/Contradictions_Overlaps.md"
---

## Paste Block – Scoring & Algorithm Context (External)

Context:
The following information reflects the current understanding
of the V3 scoring system, algorithm behavior, and table logic,
based on analysis performed outside this repo (Antigravity, MAIN repo, discussions).

This is NOT final logic.
This is a descriptive snapshot to support scoring calibration.

### Known Scoring Components
- Roles (E/A derived)
- Talk / Listen balance
- Sensitivity / Safety signals
- Interests overlap
- Depth / Openness
- Hard constraints (language, friends, gender)

### Known Algorithm Behaviors
- Greedy table formation
- Hard constraints enforced first
- Soft scoring for balance and flow
- Priority to avoid isolation
- Fixed table sizes

### Known Risks / Concerns
- Over-weighting roles
- Talk/Listen as self-report
- Sensitivity signals unclear usage
- Interest overlap weak predictor

Source:
- Antigravity Stage 1 analysis
- MAIN algorithm review

---

## Paste Block – Scoring & Algorithm Context (External Snapshot)

Context:
This block captures the current understanding of the V3 scoring system,
algorithm behavior, and table formation logic, based on analysis and work
performed outside this repository (Antigravity, MAIN repo, discussions).

This is NOT final logic.
This is NOT a proposal.
This is a descriptive snapshot intended to support scoring calibration
and safe field deployment.

---

### Core Intent
The system aims to create safe, balanced, and flowing social dining tables
(4–6 participants) by combining questionnaire-derived signals with
constraint-based and soft-scoring logic.

Primary optimization goal:
- Avoid harmful or isolating table experiences
Secondary goal:
- Encourage natural conversation flow and human connection

---

### Known Scoring Components (V3)

1. Roles (E/A derived)
- Derived primarily from Extraversion / Agreeableness related inputs
- Used to balance initiators, holders, and quieter participants
- Strong influence on overall table dynamics

2. Talk / Listen Balance
- Self-reported communication style
- Intended to prevent dominance and silence
- Reliability as behavioral predictor is uncertain

3. Sensitivity / Safety Signals
- Signals related to emotional sensitivity, comfort, and safety needs
- Intended to avoid mismatches that create discomfort or exclusion
- Usage in scoring is partially unclear

4. Interests Overlap
- Measures topical or contextual similarity
- Intended to support conversation ease
- Known to be a weak predictor of deep connection

5. Depth / Openness
- Signals related to willingness for meaningful or personal conversation
- Intended to support richer interactions
- Risk of overestimating real-world behavior

6. Hard Constraints
- Language compatibility
- Friend pairing rules
- Gender balance constraints
- Table size limits

---

### Known Algorithm Behaviors

- Greedy table formation approach
- Hard constraints applied first
- Soft scoring used to balance tables
- Priority given to avoiding isolation or exclusion
- Fixed table sizes (typically 4–6)
- Friend pairs treated as atomic units when applicable

---

### Known Risks and Concerns

- Over-weighting Roles may create artificial balance but reduce authenticity
- Talk/Listen self-report may not reflect actual behavior
- Sensitivity signals risk being too vague or under-utilized
- Interests overlap may feel meaningful in scoring but not in experience
- Strong constraints may produce “legal but bad” tables
- Scoring complexity may exceed current learning capacity

---

### Known Unknowns

- Which scoring components truly impact real table experience
- Which signals are noise vs. meaningful predictors
- Where users adapt behavior differently than questionnaire responses
- How small scoring changes cascade at table level

---

### Purpose of This Snapshot

This snapshot exists solely to:
- Enable scoring calibration
- Support diagnostic analysis
- Prepare for safe field experimentation

All assumptions here are expected to be challenged and refined
after real-world data is collected.

Source:
- Antigravity Stage 1 analysis
- MAIN algorithm review
- Internal discussions