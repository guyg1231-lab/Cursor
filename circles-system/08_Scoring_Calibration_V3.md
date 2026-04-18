# Scoring Calibration V3 (Diagnostic)

## Purpose
This document calibrates the current V3 scoring system for Circles. For each scoring component in use, it describes: what it does in practice, which inputs it relies on, what human table experience it aims to create, how it can fail or harm experience, a confidence level, and what to observe in the field. No improvements or logic changes are proposed—diagnostic only.

## Scoring Architecture (Context)
The algorithm optimizes on **expectation-based outcomes**, not raw questionnaire weights. The total table score is the average of five dimensions: Conversation Flow, Inclusion, Energy Balance, Comfort, and Connection Likelihood. Each dimension is base-scored in an approximate range of 30–60 and then modified by role composition, constraint penalties, and interest matches. Hard constraints (gender, language, friends, leader cap) are enforced first; soft scoring drives balance and flow. Table formation is greedy with multi-restart; placement density is heavily prioritized (very large multiplier) over marginal quality gains.

---

## 1. Roles (E/A derived)

### What it does in practice
Personality roles are derived from Extraversion/Agreeableness using a 60/40 threshold split. Roles (e.g. initiators, space-holders, leaders) feed into the five expectation dimensions as modifiers. Leader capacity is capped at two per table as a hard rule. E/A values act as **multipliers** across multiple expectation dimensions; space-holding roles are double-counted across a majority of metrics.

### Inputs it relies on
- Extraversion and Agreeableness scores from the questionnaire
- 60/40 threshold for role classification
- Role-to-dimension mapping (initiator/holder impact on Conversation Flow, Inclusion, Energy Balance, Comfort, Connection Likelihood)

### Human table experience it aims to create
Balanced tables where no one is overloaded (leader cap), conversation is started and held (initiators + holders), and energy/comfort are matched so that no one feels stranded or dominated.

### How it can fail or harm experience
- **Over-weighting roles:** Small variances in E/A scores can disproportionately affect table-level outcomes; tables may be chosen for role balance at the expense of other fit factors.
- **Double-counting:** Initiator and space-holder roles amplifying across metrics can make role composition dominate over interests, depth, or safety signals.
- **Leader cap rigidity:** Strict “max two leaders” can exclude otherwise well-fitting participants or force suboptimal tables when the pool is leader-heavy.
- **Diagnostic opacity:** Admin labels may not reflect that E/A is the main driver; post-event analysis may misattribute outcomes.

### Confidence level
**MEDIUM** — Role logic is clearly in use and influential, but the exact mapping to the five dimensions and the degree of double-counting are not fully transparent from docs; field correlation between role mix and reported experience is not yet established.

### What to observe in the field
- Correlation between table role mix (initiator/holder/leader count) and participant ratings for Conversation Flow, Energy Balance, and Inclusion.
- Whether “too many quiet people” or “one person dominated” feedback aligns with tables that have zero or one initiator, or with leader-cap binding.
- Whether E/A variance within a table (homogeneous vs mixed) correlates with Comfort and Connection Likelihood scores.
- Post-event: whether role-based admin labels match what participants would describe as “who led” or “who held space.”

---

## 2. Talk / Listen balance

### What it does in practice
Talk/Listen style is used as an input to scoring, likely feeding into Conversation Flow and Energy Balance so that tables are not heavily skewed toward all talkers or all listeners. The exact formula (balance target, tolerance band) is not fully specified in the available context.

### Inputs it relies on
- Self-reported talk/listen preference or style from the questionnaire (e.g. talk-heavy vs listen-heavy).
- Possibly a balance metric per table (e.g. mix of talk vs listen orientations).

### Human table experience it aims to create
Tables where conversation flows naturally—no one feels unheard (all listeners) or unable to get a word in (all talkers). Intended to support voice balance and perceived inclusion.

### How it can fail or harm experience
- **Self-report bias:** Participants may over- or under-state their talk/listen style; calibration with actual behavior is unknown.
- **Over-weighting:** If talk/listen is weighted heavily, it may override other fit signals (interests, depth, safety) and produce tables that “look balanced” on paper but feel off in practice.
- **Weak predictor:** If talk/listen is a weak predictor of actual flow, optimizing for it may not improve CSAT or “conversation flow” ratings.
- **Politeness bias:** Self-reported “good balance” in post-event feedback may not reflect who actually talked vs listened.

### Confidence level
**LOW** — Usage in the scoring pipeline is implied (discourse/balance) but the exact implementation and weight are unclear; self-report is a known weak point; no clear link yet to observed flow or inclusion outcomes.

### What to observe in the field
- Whether self-reported talk/listen style predicts post-event “conversation flow” or “voice balance” ratings.
- Whether tables with mixed talk/listen scores report better or worse Inclusion and Energy Balance than homogeneous tables.
- Any qualitative feedback that explicitly mentions “couldn’t get a word in,” “everyone was quiet,” or “good balance of speaking” and whether that aligns with the table’s talk/listen composition.
- Correlation between talk/listen balance and NPS or “would recommend” by table.

---

## 3. Sensitivity / Safety signals

### What it does in practice
Sensitivity or safety-related inputs are intended to influence Comfort and possibly Inclusion (e.g. avoiding placing vulnerable or sensitive participants in high-intensity or mismatched tables). The precise definition of “sensitivity signals” and how they are used in the expectation dimensions is not clearly documented.

### Inputs it relies on
- Questionnaire items that capture sensitivity, past discomfort, or safety preferences (exact fields not specified in sources).
- Possibly binary or tiered flags that modify Comfort or Inclusion scores.

### Human table experience it aims to create
Participants who need a calmer or safer environment are placed at tables where Comfort and Inclusion are predicted to be high; isolation and dominance are avoided; no one is put in a situation that triggers known discomfort.

### How it can fail or harm experience
- **Unclear usage:** If sensitivity signals are collected but under-used or inconsistently applied, high-sensitivity participants may still be placed in poor-fit tables.
- **Over-protection:** Heavy use of sensitivity could over-segment the pool and reduce placement rate or create “sensitivity ghettos” that feel stigmatizing.
- **Missing signals:** If the questionnaire does not capture key safety or comfort needs, the algorithm cannot protect for them; harm may occur without a clear scoring lever.
- **Confidentiality vs scoring:** Tension between respecting privacy and feeding enough signal for Comfort/Inclusion without exposing sensitive data in logs or admin views.

### Confidence level
**LOW** — Listed as a known scoring component but “unclear usage” is explicitly called out in sources; no detailed mapping to dimensions or weights; field validation of safety/comfort outcomes is not yet documented.

### What to observe in the field
- Whether participants who indicated higher sensitivity or past discomfort report higher or lower Comfort and Inclusion scores by table.
- Any incident or discomfort reports: do they correlate with tables that had low predicted Comfort/Inclusion or with missing or weak sensitivity signals?
- Whether “sensitivity-heavy” tables (if identifiable) have different CSAT, NPS, or connection rates than others.
- Qualitative feedback mentioning “felt safe,” “felt exposed,” “too intense,” or “just right” and how that aligns with table composition and any sensitivity flags.

---

## 4. Interests overlap

### What it does in practice
Interest overlap is used as a soft modifier: shared or complementary interests improve the expectation dimensions (likely Connection Likelihood and Conversation Flow). Implementation is partially legacy-based; some UI indicators (Interest, Context) are no longer direct drivers of the final score, but interest matching still contributes to the base score and modifiers.

### Inputs it relies on
- Interest-related questionnaire data (topics, categories, or tags).
- Matching logic (exact overlap, partial overlap, or diversity) — exact rule not fully specified.
- Possibly legacy Interest/Context fields that are still used in scoring but not surfaced consistently in admin.

### Human table experience it aims to create
Tables where people have enough in common to spark conversation and feel “my kind of people,” without requiring full overlap. Aims to support Connection Likelihood and ease of conversation.

### How it can fail or harm experience
- **Weak predictor:** Interest overlap has been called out as a weak predictor of actual connection or satisfaction; optimizing for it may not improve outcomes.
- **Legacy vs current:** If some interest data is legacy and no longer the main driver, participants and admins may assume interests are central when they are only one of several modifiers.
- **Over-weighting similarity:** Strong interest overlap may reduce diversity of perspective and depth; under-weighting may produce tables that feel random or shallow.
- **Measurement gap:** “Meaningful depth” and “connection” are hard to measure without intrusiveness; interest overlap may be a poor proxy.

### Confidence level
**LOW** — Explicitly noted as a weak predictor; legacy vs current usage is ambiguous; contribution to the five dimensions is partial and not fully transparent.

### What to observe in the field
- Correlation between measured interest overlap (per table) and post-event Connection Likelihood, Conversation Flow, or “would exchange contact” / connection rate.
- Whether participants who mention “great conversation” or “had nothing in common” align with high vs low interest overlap on their table.
- Whether first-time vs returning participants show different sensitivity to interest match (e.g. newcomers needing more overlap for comfort).
- Any feedback that “interests didn’t match what I said” or “we found common ground despite different interests” to test whether overlap is predictive or incidental.

---

## 5. Depth / Openness

### What it does in practice
Depth and openness are part of the soft scoring mix, intended to support Connection Likelihood and possibly Comfort (e.g. placing more open participants together or balancing depth so that no one feels over-exposed or under-engaged). The exact implementation—whether depth is a modifier, a dimension, or a constraint—is not fully specified.

### Inputs it relies on
- Questionnaire items related to openness, willingness to go deep, or preferred conversation depth.
- Possibly used to modulate Connection Likelihood and Comfort scores.

### Human table experience it aims to create
Tables where depth of conversation is possible for those who want it, without forcing depth on those who prefer lighter interaction; comfort for both “go deep” and “keep it light” preferences.

### How it can fail or harm experience
- **Unclear implementation:** If depth/openness is collected but lightly weighted or inconsistently applied, tables may not reflect stated preferences.
- **Mismatch:** Placing high-depth and low-depth preferences together without a clear strategy can produce one side feeling bored or the other feeling pushed.
- **Measurement risk:** “Meaningful depth” is hard to measure without intrusiveness; depth scores may not correlate with actual depth of conversation or connection quality.
- **Privacy:** Depth/openness can touch sensitive territory; over-use in scoring or logging could create privacy or stigma concerns.

### Confidence level
**LOW** — Depth/openness is listed as a component but the mapping to dimensions and weight are not clearly documented; no established link to field outcomes.

### What to observe in the field
- Whether self-reported depth/openness preference correlates with Connection Likelihood and Comfort ratings by table.
- Qualitative feedback that mentions “conversation went deep,” “stayed surface-level,” “felt safe to share,” or “wanted to go deeper” and how that aligns with table depth composition.
- Whether “depth mismatch” (e.g. one deep-oriented person with several light-oriented) correlates with lower satisfaction or early departure.
- Any correlation between depth/openness mix and connection rate (exchange of contact, follow-up) vs only CSAT.

---

## 6. Hard constraints (language, friends, gender)

### What it does in practice
Hard constraints are enforced before soft scoring. **Language:** Only the Hebrew-only / English-only intersection is blocked; other combinations are allowed. **Friends:** Friend pairs are a single atomic unit, placed first; they cannot be split. If no compatible table with at least two seats exists, the pair stays unplaced. **Gender:** Balance rule M ≤ F is enforced; “Other” is treated as Male for balance; gender isolation is explicitly blocked even when binary balance is satisfied. **Leader cap:** Max two leaders per table. These constraints gate placement and table formation; they are not soft weights.

### Inputs it relies on
- Language preference (Hebrew-only, English-only, or both).
- Friend pair declarations (pairs are indivisible).
- Gender (M / F / Other) for balance and isolation checks.
- Role classification (leader) for the two-leader cap.
- Age and age-tolerance (max of the two participants’ tolerance tiers) for compatibility.
- Table size constraints (4–6) and predefined division logic.

### Human table experience it aims to create
- **Language:** No one at a table where they cannot participate in the primary language.
- **Friends:** Friends sit together when possible; no splitting that would break the social unit.
- **Gender:** No one is the only person of their gender; no gender isolation; balance supports comfort and inclusion.
- **Leader cap:** No table overloaded with dominant personalities.

### How it can fail or harm experience
- **Constraint-induced exclusion:** Excess male participants are automatically excluded when M ≤ F; friend pairs can be unplaced when no table has two free seats, even if partial seating is possible; participants can be excluded solely due to remaining group size (<4).
- **Friend pair fragility:** Internal incompatibilities within a pair (e.g. age, language) can make the whole pair unplaceable; one person’s constraints can block the pair.
- **Gender “Other”:** Treating Other as Male may misrepresent balance and affect comfort or inclusion for non-binary participants.
- **Language inconsistency:** Only Hebrew-only/English-only is blocked; edge cases (e.g. preference for “mostly Hebrew” or mixed tables) may be inconsistently enforced.
- **Placement vs quality:** Extremely high placement multiplier can degrade table quality to seat one more person; high placement rate may mask poor experience for the placed.
- **Diagnostic gaps:** Hard constraints are clear in intent but exclusion reasons (gender vs friends vs size) may not be transparent to participants or admins.

### Confidence level
**HIGH** — Hard constraints are clearly defined and enforced; behavior is well-understood from docs and risk write-ups; failure modes (exclusion, rigidity) are explicitly documented. Confidence is in *description*, not in whether outcomes are always good.

### What to observe in the field
- Placement rate and table completion rate (4–6 per table) and how often exclusion is due to gender, friends, language, or size.
- Whether unplaced participants (especially friend pairs or excess males) receive clear communication and whether their feedback correlates with constraint type.
- Comfort and Inclusion scores at tables where gender balance was tight (e.g. 2M/2F) vs more slack (e.g. 2M/4F).
- Whether “Other” gender participants report different comfort or inclusion when grouped with M vs F; whether balance logic feels fair to them.
- Friend pairs: do placed pairs report higher connection/satisfaction than solos; do unplaced pairs report frustration and does it align with “no table with two seats” or internal pair incompatibility.
- Language: any feedback that “couldn’t follow the conversation” or “language was fine” by table language mix.
- Early departures or no-shows correlated with constraint-heavy placement (e.g. last-minute fill at a tight table).

---

## Summary: Confidence by component

| Component              | Confidence | Note                                                                 |
|------------------------|------------|----------------------------------------------------------------------|
| Roles (E/A derived)    | MEDIUM     | Strong influence, double-counting and dimension mapping unclear    |
| Talk / Listen balance  | LOW        | Self-report, weak predictor, implementation unclear                 |
| Sensitivity / Safety   | LOW        | Unclear usage, field link not established                           |
| Interests overlap      | LOW        | Weak predictor, legacy vs current ambiguous                         |
| Depth / Openness       | LOW        | Implementation and weight not clearly documented                     |
| Hard constraints       | HIGH       | Well-defined and enforced; failure modes documented                  |

---

## Document metadata
- **Type:** Diagnostic calibration only; no proposed improvements or logic changes.
- **Sources of truth:** 99_inbox.md (scoring & algorithm context), 04_KPI_Candidates.md, 03_Risky_Decision_Points.md, 05_Open_Decisions.md.
- **Use:** Inform what to observe in the field and where confidence is low before changing scoring or algorithm logic.
