# STAGE 1 – Development Proposals & Exploratory Ideas (Official Consolidated Report)

> **Status:** Final Stage 1 Output
> **Purpose:** Verbatim export for system import.
# Development Inputs – Stage 1 (Exploratory)

This document contains all development ideas, proposals, questions,
alternative approaches, and exploratory thoughts generated during STAGE 1.

Nothing in this document is a decision.
Nothing here is approved for implementation.
This is a reference input for Stage 3 (Decision & Planning).

---
### 1. Development Proposals & Improvement Ideas
*   **Squad-First Table Anchoring:** Implementing a "Skeleton-first" structure where every table MUST have a predefined anchor pair (1 Leader + 1 Holder) before filling other seats.
*   **Q_MATCH Modulation:** Activating the dormant logic that adjusts similarity/diversity weights based on user preference (Similar/Different/Mixed).
*   **Story Match implementation:** Using birth and current location (Q6a/b) to create "Life Path" similarity scores (e.g., newcomers matching with other newcomers).
*   **Weighted Role Synergy:** Formalizing a scoring bonus for "Complementary Pairs" (e.g., high-extraversion Leader + high-agreeableness Holder).
*   **Hybrid Dietary/Allergy Sync:** Automated cross-referencing between structured dietary choices (Q9) and free-text safety alerts (Q27).
*   **Role Enrichment (Q26/Q27):** Moving from 2-property roles to 5-property enriched profiles by extracting supporting signals from free-text using NLP.
*   **Negative Signal Deal-breakers:** Implementing hard-blocking or heavy-penalty logic for direct preference clashes (e.g., Cynical vs. Gentle humor).

### 2. Alternative Approaches to Matching & Scoring
*   **Outcome-Focused Scoring (Expectations):** Shifting from "Similarity Weights" to a predictive model estimating 5 outcomes: Flow, Inclusion, Balance, Comfort, and Connection.
*   **Symmetry Breaking:** Moving away from "Homophily" (matching similar people) toward "Complementarity" (matching people whose traits fill each other's gaps).
*   **Wave-Based Priority (Wave 0):** A strategy where the most restrictive participants ("Hard Cases") are placed first when all tables are empty to ensure feasibility.
*   **Dynamic Table Scaling:** Allowing the system to automatically choose between sizes 4, 5, or 6 based on the specific personality mix of the event's attendee list.
*   **Multi-Restart Stochastic Search:** Running 10-100 iterations of the assignment algorithm with randomized logic seeds to escape local minima.

### 3. Research Questions & Open Considerations
*   **The "Deep Quiet" Identification:** Can we reliably identify introverts with high intellectual depth by cross-referencing Q13 (Quiet) with Q21 (Depth Preference)?
*   **Social Battery Metrics:** How does the "Talker/Listener" ratio (Q_TL) correlate with post-event reports of "Conversation Flow"?
*   **Validation Loop:** What is the minimal set of post-event survey questions required to mathematically validate the 5 "Expectation" dimensions?
*   **Role Elasticity:** To what extent can a "Flexible" energy role effectively replace a missing "Leader" or "Holder" in a squad?
*   **Big Five Mapping:** How accurately can the current 28 questions map to the "Openness" and "Conscientiousness" domains of the Big Five?

### 4. Trade-offs & Tensions Identified
*   **Density vs. Quality:** The inherent algorithm tension between seating every participant (high density) versus maintaining a minimum "Flow" score for every table.
*   **Friend Atomic-Unit Friction:** The fact that seating friends as a single unit significantly restricts the search space and can lower the global event score.
*   **Privacy vs. Safety:** The trade-off between requiring social links (Q4) for admin verification and reducing registration friction for new members.
*   **Processing Time vs. Optimization:** The balance between real-time admin responses (<500ms) and the number of optimization loops (Swaps/Restarts) performed.

### 5. Ideas "Worth Testing" (Exploratory/Speculative)
*   **Human Design Types:** Testing if matching based on "Type" (Generator, Projector, etc.) correlates with reported connection likelihood.
*   **The Inspiration Desk (Visual NPC):** Adding a playful, image-based question where users pick an "Ideal Guest" (Researcher, Artist, Philosopher) to reveal hidden values.
*   **Real-Time No-Show Recovery:** A specialized "Recovery Mode" that re-runs the final swaps during the event check-in based on the "Live" attendee list.
*   **Contextual Weight Shifting:** Dynamically altering weights based on the event's "Theme" (e.g., a "Fun" night weighing Interest Overlap higher than Depth).
*   **Historical Clash Graph:** A "Separation Logic" that tracks social clashes or poor past pairings to ensure those participants never sit together again.
