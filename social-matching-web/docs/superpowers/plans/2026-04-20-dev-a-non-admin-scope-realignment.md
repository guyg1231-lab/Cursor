# Dev A Non-Admin Scope Realignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Realign Dev A around the non-admin product by updating active scope docs, freezing the canonical non-admin route/lifecycle contracts, and preparing the repo for a later implementation pass that does not leak into Dev B's admin build.

**Architecture:** Start with documentation truth, not code changes. First freeze shared vocabulary and ownership boundaries, then update active planning documents to match those decisions, and only then prepare a narrow follow-up plan for code execution. Keep admin implementation untouched except where active docs must describe the dependency boundary correctly.

**Tech Stack:** Markdown docs, git, existing planning/spec structure under `docs/superpowers/` and `docs/mvp-v1/`

---

## File Map

- Create: `docs/superpowers/specs/2026-04-20-dev-a-non-admin-product-boundary-design.md`
- Create: `docs/superpowers/specs/2026-04-20-dev-a-non-admin-flows-design.md`
- Create: `docs/superpowers/specs/2026-04-20-dev-a-lifecycle-and-route-boundary-design.md`
- Modify: `docs/mvp-v1/02_MVP_SCOPE.md`
- Modify: `docs/mvp-v1/04_WORKFLOWS.md`
- Modify: `docs/mvp-v1/06_FUNCTIONAL_REQUIREMENTS.md`
- Modify: `docs/mvp-v1/09_APPLY_FLOW_SPEC.md`
- Modify: `docs/superpowers/plans/2026-04-20-dev-a-baseline-and-dev-b-collab-protocol.md`
- Modify: `docs/superpowers/plans/2026-04-20-developer-b-kickoff.md`
- Modify: `docs/superpowers/plans/2026-04-21-dev-a-remaining-work-audit-and-plan.md`
- Create: `docs/superpowers/plans/2026-04-20-dev-a-non-admin-scope-realignment-followup.md`

## Task 1: Freeze The New Dev A Scope In Specs

**Files:**
- Create: `docs/superpowers/specs/2026-04-20-dev-a-non-admin-product-boundary-design.md`
- Create: `docs/superpowers/specs/2026-04-20-dev-a-non-admin-flows-design.md`
- Create: `docs/superpowers/specs/2026-04-20-dev-a-lifecycle-and-route-boundary-design.md`

- [ ] **Step 1: Verify the new scope files exist and are the only new specs in this slice**

Run:

```bash
ls docs/superpowers/specs/2026-04-20-dev-a-*.md
```

Expected: the three new Dev A scope specs are listed.

- [ ] **Step 2: Read the new specs together and check they say the same thing**

Run:

```bash
rg -n "payment|admin|operator|gathering|apply|request" docs/superpowers/specs/2026-04-20-dev-a-*.md
```

Expected:

- payment is marked deferred
- admin is the canonical role term
- `/events/:eventId/apply` is canonical
- `/gathering/:eventId` is narrowed
- request creation is inside Dev A scope

- [ ] **Step 3: Commit the new scope specs**

```bash
git add \
  docs/superpowers/specs/2026-04-20-dev-a-non-admin-product-boundary-design.md \
  docs/superpowers/specs/2026-04-20-dev-a-non-admin-flows-design.md \
  docs/superpowers/specs/2026-04-20-dev-a-lifecycle-and-route-boundary-design.md
git commit -m "docs(dev-a): define non-admin scope and lifecycle boundaries"
```

## Task 2: Update MVP Product Docs To Match The Deferred Payment Decision

**Files:**
- Modify: `docs/mvp-v1/02_MVP_SCOPE.md`
- Modify: `docs/mvp-v1/04_WORKFLOWS.md`
- Modify: `docs/mvp-v1/06_FUNCTIONAL_REQUIREMENTS.md`
- Modify: `docs/mvp-v1/09_APPLY_FLOW_SPEC.md`

- [ ] **Step 1: Find every active payment statement in the MVP docs**

Run:

```bash
rg -n "payment|pay|checkout" \
  docs/mvp-v1/02_MVP_SCOPE.md \
  docs/mvp-v1/04_WORKFLOWS.md \
  docs/mvp-v1/06_FUNCTIONAL_REQUIREMENTS.md \
  docs/mvp-v1/09_APPLY_FLOW_SPEC.md
```

Expected: a short list of active payment references to rewrite as deferred.

- [ ] **Step 2: Rewrite the active payment sections**

Apply these content rules:

- keep payment in long-term product language only where needed
- mark it as deferred / on hold / later phase
- remove any wording that makes payment part of the immediate build sequence
- keep “no payment before approval” only as a deferred product rule, not an active build commitment

- [ ] **Step 3: Verify the wording now reflects deferment**

Run:

```bash
rg -n "payment|pay" \
  docs/mvp-v1/02_MVP_SCOPE.md \
  docs/mvp-v1/04_WORKFLOWS.md \
  docs/mvp-v1/06_FUNCTIONAL_REQUIREMENTS.md \
  docs/mvp-v1/09_APPLY_FLOW_SPEC.md
```

Expected: every remaining payment reference clearly reads as deferred/later, not current-phase work.

- [ ] **Step 4: Commit the MVP doc realignment**

```bash
git add \
  docs/mvp-v1/02_MVP_SCOPE.md \
  docs/mvp-v1/04_WORKFLOWS.md \
  docs/mvp-v1/06_FUNCTIONAL_REQUIREMENTS.md \
  docs/mvp-v1/09_APPLY_FLOW_SPEC.md
git commit -m "docs(mvp): defer payment in active product scope"
```

## Task 3: Update Active Collaboration Docs Around The New Dev A / Dev B Split

**Files:**
- Modify: `docs/superpowers/plans/2026-04-20-dev-a-baseline-and-dev-b-collab-protocol.md`
- Modify: `docs/superpowers/plans/2026-04-20-developer-b-kickoff.md`
- Modify: `docs/superpowers/plans/2026-04-21-dev-a-remaining-work-audit-and-plan.md`

- [ ] **Step 1: Update the collaboration protocol**

In `docs/superpowers/plans/2026-04-20-dev-a-baseline-and-dev-b-collab-protocol.md`, change the active scope language so it says:

- Dev A owns non-admin product scope
- Dev A includes request creation for new event/experience/circle proposals
- Dev B owns admin build
- admin is the canonical role term in active planning

- [ ] **Step 2: Update the Dev B kickoff boundary**

In `docs/superpowers/plans/2026-04-20-developer-b-kickoff.md`, revise active sections so they do **not** imply that user request-creation flow belongs to Dev B. The kickoff should instead say that Dev B builds admin surfaces downstream of the shared contracts frozen by Dev A.

- [ ] **Step 3: Update the Dev A remaining-work audit**

In `docs/superpowers/plans/2026-04-21-dev-a-remaining-work-audit-and-plan.md`, replace maintenance-mode language that is now too narrow. The updated audit should say Dev A next-phase work includes:

- non-admin scope realignment
- canonical route/lifecycle clarification
- request-creation flow planning

while still keeping admin implementation outside Dev A.

- [ ] **Step 4: Verify the split language is clean**

Run:

```bash
rg -n "operator|admin|Dev A owns|Dev B owns|request creation|non-admin" \
  docs/superpowers/plans/2026-04-20-dev-a-baseline-and-dev-b-collab-protocol.md \
  docs/superpowers/plans/2026-04-20-developer-b-kickoff.md \
  docs/superpowers/plans/2026-04-21-dev-a-remaining-work-audit-and-plan.md
```

Expected:

- active planning uses admin as the normalized role term
- Dev A non-admin ownership is explicit
- Dev B admin ownership is explicit
- request creation sits with Dev A

- [ ] **Step 5: Commit the collaboration doc changes**

```bash
git add \
  docs/superpowers/plans/2026-04-20-dev-a-baseline-and-dev-b-collab-protocol.md \
  docs/superpowers/plans/2026-04-20-developer-b-kickoff.md \
  docs/superpowers/plans/2026-04-21-dev-a-remaining-work-audit-and-plan.md
git commit -m "docs(dev-a): realign ownership around non-admin scope"
```

## Task 4: Prepare The Narrow Follow-Up Plan For Code Execution

**Files:**
- Create: `docs/superpowers/plans/2026-04-20-dev-a-non-admin-scope-realignment-followup.md`

- [ ] **Step 1: Write a follow-up execution plan with only Dev A-owned code targets**

The follow-up plan should cover:

- canonical apply-route cleanup
- narrowing `/gathering/:eventId`
- non-admin request-creation surface alignment
- lifecycle vocabulary cleanup in participant/shared files

The follow-up plan must not include:

- admin dashboard feature work
- admin diagnostics/audit buildout
- Dev B-owned page deepening

- [ ] **Step 2: Verify the follow-up plan stays inside Dev A-owned paths**

Run:

```bash
rg -n "src/pages/admin|src/pages/host|Dev B|diagnostics|audit" \
  docs/superpowers/plans/2026-04-20-dev-a-non-admin-scope-realignment-followup.md
```

Expected: no Dev B implementation scope appears, except short dependency notes if needed.

- [ ] **Step 3: Commit the follow-up execution plan**

```bash
git add docs/superpowers/plans/2026-04-20-dev-a-non-admin-scope-realignment-followup.md
git commit -m "docs(dev-a): add non-admin scope realignment follow-up plan"
```

## Task 5: Final Verification Pass

**Files:**
- Modify: none

- [ ] **Step 1: Run a final doc sanity grep**

Run:

```bash
rg -n "operator|payment only after approval|payment stage|competing application funnel|gathering.*apply" \
  docs/mvp-v1 \
  docs/superpowers/specs \
  docs/superpowers/plans
```

Expected:

- no active next-phase docs treat payment as current work
- no active next-phase docs treat admin and operator as different roles
- no active Dev A docs leave `/gathering/:eventId` as a competing canonical apply route

- [ ] **Step 2: Review git status**

Run:

```bash
git status --short
```

Expected: only the intended docs for this slice are staged/committed; local-only artifacts remain untracked and untouched.

- [ ] **Step 3: Tag the scope package completion point if desired**

```bash
git tag dev-a-non-admin-scope-frozen
```

Expected: optional local tag created successfully.

## Self-Review

- Spec coverage: this plan covers scope boundary, payment deferment, ownership clarification, canonical route/lifecycle planning, and the handoff from scope docs into a Dev A-only follow-up plan.
- Placeholder scan: no tasks say “figure it out later” without naming the exact doc targets or verification commands.
- Type consistency: the plan consistently uses `admin` as the canonical role term, treats event/experience/circle as one MVP object, and keeps `/events/:eventId/apply` as the canonical apply route.

