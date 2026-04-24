# Circles Layer Alignment Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a source-grounded audit report that compares the Circles Layer mandate against the current MVP docs, execution plans, and implemented code, then recommends the next specs and sequencing.

**Architecture:** Treat this as an evidence-first documentation audit, not a product redesign. Build one report file that is fed by four narrow review passes: product intent, plan alignment, implementation reality, and contradiction/risk review. Each pass should stay isolated so disagreements are visible instead of blended into one summary.

**Tech Stack:** Markdown, Bash, `rg`, `sed`, git history, local repo docs, existing source tree, optional subagent explorer reviews.

---

### Task 1: Build the source map and document inventory

**Files:**
- Create: `docs/superpowers/specs/2026-04-24-circles-layer-alignment-audit-report.md`

- [ ] **Step 1: Inventory the source corpus with exact commands**

Run:

```bash
cd /Users/guygarfinkel/Documents/Cursor/social-matching-web
rg -n --hidden --glob '!node_modules' --glob '!.git' -i "pre-event onboarding|intent capture|interest / context capture|grouping / matching logic|group assignment|group insights|optional event-context prompts|post-event connection|feedback layer|Circles Layer|event shell|onboarding|matching|feedback" docs/mvp-v1 docs/superpowers/plans docs/superpowers/specs src e2e supabase
```

and:

```bash
cd /Users/guygarfinkel/Documents/Cursor/social-matching-web
git log --oneline --decorate -n 25
```

Expected: a focused list of relevant docs, plans, source files, and recent commits that show where the Circles Layer is already defined, implied, or missing.

- [ ] **Step 2: Draft the document inventory table in the report**

Create the first section of `docs/superpowers/specs/2026-04-24-circles-layer-alignment-audit-report.md` with a table that includes these columns:

- `Document`
- `What it defines`
- `Level` (`vision`, `product`, `flow`, `UI`, `system`, `plan`)
- `Status` (`up-to-date`, `partial`, `contradictory`, `outdated`, `missing`)
- `Why it matters to Circles Layer`

Include at minimum the canonical sources from `docs/mvp-v1/`, the active `docs/superpowers/specs/` files, the active `docs/superpowers/plans/` files, and the code areas that expose participant onboarding, matching, and feedback.

- [ ] **Step 3: Verify the inventory is evidence-based**

Re-read the table and remove any row that cannot be backed by a file in the repo or a file the user explicitly provided. The report should stay strict about source provenance and should not infer missing docs as if they were present.

- [ ] **Step 4: Save the first draft and keep it narrow**

Keep this draft limited to inventory and source map only. Do not write recommendations yet; the next tasks will derive them from the review passes.

### Task 2: Run narrow expert review passes with subagents

**Files:**
- Modify: `docs/superpowers/specs/2026-04-24-circles-layer-alignment-audit-report.md`

- [ ] **Step 1: Dispatch one review agent per concern area**

Spawn four fresh explorer-style subagents, each with a tight mandate:

- Agent A: product-intent reviewer
  - Scope: `docs/mvp-v1/`, the user-provided audit spec, and the question “what is the product right now?”
  - Output: a concise product picture and Circles Layer coverage notes.

- Agent B: plan-alignment reviewer
  - Scope: `docs/superpowers/plans/`, `docs/superpowers/specs/`
  - Output: which plans drive Event Shell behavior, which drive Circles Layer behavior, and where sequencing is off.

- Agent C: implementation-reality reviewer
  - Scope: `src/`, `supabase/`, `e2e/`
  - Output: which Circles Layer behaviors are present in code, partially present, or absent.

- Agent D: contradiction-and-risk reviewer
  - Scope: all of the above
  - Output: contradictions, missing concepts, generic-event-board drift, and the smallest set of missing specs required next.

- [ ] **Step 2: Consolidate the subagent findings without averaging them away**

When the agents return, write their findings into separate subsections in the report first. Preserve disagreements explicitly if two reviewers see the same artifact differently.

- [ ] **Step 3: Normalize every finding to a source file**

For each reviewer claim, attach a concrete file path from the repo or the user-provided spec. If a finding cannot be traced to a file, drop it.

- [ ] **Step 4: Keep the review passes independent**

Do not let Agent B’s plan reading overwrite Agent A’s product reading, and do not let Agent C’s code reality overwrite product intent. The final synthesis should show where the layers diverge, not hide it.

### Task 3: Map the Circles Layer coverage end-to-end

**Files:**
- Modify: `docs/superpowers/specs/2026-04-24-circles-layer-alignment-audit-report.md`

- [ ] **Step 1: Build the coverage matrix**

Add a section with one row for each Circles Layer element from the user’s mandate:

- pre-event onboarding
- participant intent capture
- interest / context capture
- grouping / matching logic
- group assignment
- group insights
- optional event-context prompts
- post-event connection and feedback layer

For each row, record:

- whether it exists
- where it exists
- whether it is strongly or weakly defined
- whether it is future intent or active planning
- what is missing to make it actionable

- [ ] **Step 2: Separate the Event Shell from the Circles Layer**

Write a second table that classifies each item as either:

- `Event Shell`
- `Circles Layer`
- `Both`
- `Not yet defined`

This is the key distinction the user cares about, so keep it explicit and do not collapse the categories.

- [ ] **Step 3: Call out the product-model gap clearly**

Document whether the current system assumes only `one event = many attendees`, or whether it already models group structure, group assignment, and later-stage connection signals. If the docs or code do not define those concepts, say so plainly.

- [ ] **Step 4: Mark deferred vs. required-now items**

Use a simple tag in the report for each coverage item:

- `required now`
- `deferred`
- `ambiguous`
- `missing spec`

That tag should reflect the evidence, not a wish list.

### Task 4: Analyze plan alignment and product drift

**Files:**
- Modify: `docs/superpowers/specs/2026-04-24-circles-layer-alignment-audit-report.md`

- [ ] **Step 1: Compare plans against the Circles mandate**

Read the active plans and classify them into three buckets:

- plans that mainly build the Event Shell
- plans that genuinely move the Circles Layer forward
- plans that are useful but orthogonal to the Circles Layer

- [ ] **Step 2: Identify drift risks**

Write a short section that explicitly answers:

- where the repo risks becoming a generic event board
- where the docs blur event platform language with social-matching language
- where implementation work is progressing without a matching product spec

- [ ] **Step 3: Produce the explicit verdict**

Add one paragraph that answers the user’s special emphasis question directly:

> Is the system currently building a true Circles platform, or is it still mainly an event platform with social aspirations?

Base that verdict only on the evidence already collected in the report.

- [ ] **Step 4: Keep the verdict short and defensible**

Avoid slogans. The verdict should be one or two tight paragraphs that cite the strongest supporting evidence from the docs and code.

### Task 5: Write the recommendations and next-spec list

**Files:**
- Modify: `docs/superpowers/specs/2026-04-24-circles-layer-alignment-audit-report.md`

- [ ] **Step 1: Draft the prioritized recommendations**

Create a recommendations section with exactly these buckets:

- `A. Must be defined immediately`
- `B. Can be left open for now`
- `C. Missing specs / concepts / entities`
- `D. Recommended execution priority`

Each bullet should name the concrete concept or document gap, not a vague theme.

- [ ] **Step 2: List the required new specs**

Add a short section naming the next documents the repo should write if the team wants the Circles Layer to become a real product layer instead of a concept. Include the minimum viable spec names, not a large roadmap.

- [ ] **Step 3: Recommend sequencing**

Write the most logical path forward in order of dependency. The sequence should explain what needs to be defined before anything else can be implemented safely.

- [ ] **Step 4: Keep the recommendations grounded**

Remove any recommendation that cannot be traced to a documented gap or contradiction. If the report suggests a future idea, label it as such.

### Task 6: Self-review, tighten, and finalize

**Files:**
- Modify: `docs/superpowers/specs/2026-04-24-circles-layer-alignment-audit-report.md`

- [ ] **Step 1: Scan for placeholders and unsupported claims**

Run a final pass for `TBD`, `TODO`, soft language, or invented concepts. Every recommendation and status label must have a source.

- [ ] **Step 2: Check internal consistency**

Make sure the product picture, coverage matrix, plan alignment, and verdict all agree with each other. If there is a contradiction, surface it instead of smoothing it over.

- [ ] **Step 3: Commit the finished audit report**

Run:

```bash
cd /Users/guygarfinkel/Documents/Cursor/social-matching-web
git add docs/superpowers/specs/2026-04-24-circles-layer-alignment-audit-report.md docs/superpowers/plans/2026-04-24-circles-layer-alignment-audit.md
git commit -m "docs: add circles layer alignment audit"
```

Expected: a clean commit that captures both the execution plan and the audit report.

---

### Notes on execution style

- Keep the review agents narrow and independent.
- Do not turn the audit into a generic product strategy essay.
- Do not invent missing Circles Layer concepts that are not in the repo.
- Prefer explicit evidence tables over prose where possible.
- If the system is still mostly an Event Shell, say that directly.
