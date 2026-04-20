# Dev A Non-Admin Product Boundary Design

**Date:** 2026-04-20  
**Owner:** Dev A  
**Status:** Proposed  
**Scope:** Define the post-handoff Dev A product boundary so non-admin work can proceed without leaking into Dev B's admin build.

---

## 1. Purpose

This spec resets Dev A scope around the real non-admin product after the alignment audit and follow-up clarification with the user.

It exists to answer four questions clearly:

1. What belongs to Dev A now?
2. What stays with Dev B?
3. Which words and objects should be normalized before more planning?
4. Which topics are explicitly deferred?

---

## 2. Decisions

### 2.1 Admin naming

`admin` and `operator` are the same role in MVP planning.

Active planning docs and new scope documents should prefer **admin** as the canonical term.  
Legacy code/file names may remain temporarily, but new planning should stop treating them as different concepts.

### 2.2 Core MVP object

`event`, `experience`, and `circle` refer to the same MVP object.

For now:

- one underlying domain object
- different wording may appear in user-facing copy
- no separate domain models for these labels

### 2.3 Dev A ownership

Dev A owns the **non-admin product**:

- discover existing events
- apply to existing events
- submit a new event / experience / circle request for admin review
- participant-facing lifecycle/status meaning
- route boundary and vocabulary across non-admin surfaces
- shared contract docs required to keep the non-admin experience coherent

### 2.4 Dev B ownership

Dev B owns the **admin build**:

- admin dashboards
- admin review/build surfaces
- admin diagnostics/audit/internal tooling
- deeper admin-side workflow implementation

Dev A may define shared contracts that admin work depends on, but Dev A does not deepen admin UI/product scope in this phase.

### 2.5 Payment

Payment is explicitly **on hold**.

For the current phase:

- no payment UX work
- no payment-state expansion
- no checkout/provider build
- no active planning that assumes payment must ship now

Where payment appears in older docs, it should be restated as:

- deferred
- later phase
- not part of current build

### 2.6 Questionnaire dependency

Whether a full questionnaire is required before:

- applying to an existing event
- creating a new request

is intentionally **not decided in this scope package**.

That decision is deferred to a later product/design pass.

---

## 3. Required Scope Adjustments

The following adjustments should be treated as active planning truth:

1. Dev A scope expands to include the user request-creation flow, because it is a core non-admin product path.
2. Dev B scope stays separate and downstream of shared contract clarification.
3. Payment must be removed from current-phase assumptions in active planning.
4. Active planning should stop using `admin` and `operator` as if they are separate roles.
5. Active planning should stop implying that `event`, `experience`, and `circle` are different MVP entities.

---

## 4. Implications For The Build

This boundary creates a cleaner build sequence:

1. Dev A stabilizes the non-admin product model.
2. Shared lifecycle and route meaning become explicit.
3. Dev B builds admin surfaces against a stable contract instead of shaping that contract by accident.

This is preferable to keeping request creation inside host/admin planning, because that would split the user product across workstreams in a way that increases drift.

---

## 5. Explicit Non-Goals

This scope package does not:

- redesign the matching algorithm
- deepen the admin product
- finalize questionnaire gating rules
- resume payment work
- split event/experience/circle into separate domain entities

---

## 6. Acceptance Criteria

This spec is satisfied when subsequent planning:

1. treats Dev A as the non-admin owner
2. keeps Dev B focused on admin build only
3. treats payment as deferred everywhere in active next-phase planning
4. uses `admin` as the canonical role term in new scope docs
5. treats event/experience/circle as one MVP object

