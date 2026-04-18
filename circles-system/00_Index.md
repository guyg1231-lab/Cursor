# Circles System - Source of Truth

## Purpose
This repo is the operational source of truth for improving:
- Matching algorithm (pairs + tables)
- Scoring system
- KPIs and learning loops from feedback
- Documentation alignment (docs vs code vs UI)

This is a decision and implementation guide, not a brainstorm dump.

## Scope
Included:
- Current-state documentation (as-is)
- Mismatches and gaps (docs vs code vs UI)
- Proposed changes (options with rationale)
- KPI framework and validation plan
- Test scenarios and rollout notes
- Links to relevant project files (MVP docs, algorithm files, etc.)

Excluded (for now):
- Implementing code changes inside this repo
- Building final HTML landing pages
- Large refactors before decisions are logged

## Working Principles
- Source of truth lives here. Anything outside is a reference.
- No idea becomes "real" until it is written here with:
  - Problem
  - Proposed change (option A/B/C)
  - Expected impact
  - Risks
  - KPIs / validation method
  - Status

## Status System
Use one of:
- IDEA - not decided
- REVIEW - needs partner review
- DECIDED - approved direction
- IMPLEMENTED - applied in codebase
- MEASURED - validated with KPIs

## Stage 2 Workflow (high level)
1) Dump Stage 1 results into 99_Inbox.md (no editing).
2) Extract into structured docs:
   - Current State
   - Mismatches
   - Risks
   - Open Decisions
   - KPI Candidates
3) Create a Decision Log (small, explicit).
4) Convert decisions into a Code Change Plan:
   - what to change
   - where (files/modules)
   - how to test
   - what KPIs to watch
5) Only then start implementation work in the codebase repo.

## Collaboration Rules (with partner)
- No direct edits to main for anything substantial.
- Use branches per topic.
- Merge only when:
  - decision is logged
  - doc is updated
  - acceptance criteria exists

## Links (fill in)
- MVP reference: /JSON/Circles_Docs/Circles MVP/03_Matching_Logic/31_Expectations_Outcomes_And_Q25_Loop.html
- Algorithm code (MAIN): [add paths]
- Questionnaire V3: [add path]
- End to End Algorithm doc: [add path]
V3 scoring and algorithm are locked for initial field learning.
No changes until first field review.
