# Dev A Non-Admin Flows Design

**Date:** 2026-04-20  
**Owner:** Dev A  
**Status:** Proposed  
**Scope:** Define the two core non-admin user flows for the next planning phase: applying to an existing event and submitting a new event/circle request.

---

## 1. Purpose

The non-admin product now has two first-class entry actions:

1. **Join something existing**
2. **Start something new**

This spec defines those flows at a product-contract level without pulling admin implementation into Dev A scope.

---

## 2. Flow A — Apply To An Existing Event

### 2.1 Goal

Allow a user to discover an existing event and submit an application to join it.

### 2.2 Canonical route

`/events/:eventId/apply` is the canonical application route.

### 2.3 Expected flow shape

1. user browses visible events
2. user opens event detail
3. user chooses to apply
4. system shows the application route
5. application is created or existing application state is shown back to the user
6. later lifecycle states remain visible on participant surfaces

### 2.4 What the flow owns

The apply flow owns:

- event-specific intent capture
- duplicate prevention
- participant-visible lifecycle state
- revisit/status behavior after the application exists

### 2.5 What the flow does not own

The apply flow does not own:

- admin review implementation
- payment
- deep post-event feedback

---

## 3. Flow B — Submit A New Event / Experience / Circle Request

### 3.1 Goal

Allow a user to propose a new event / experience / circle that will be reviewed by admin before it becomes live.

### 3.2 Core rule

This flow creates a **request/proposal**, not a live public event.

### 3.3 Expected flow shape

1. user chooses to create something new
2. user fills a request/proposal form
3. request is saved and submitted
4. request enters an admin-review state
5. user can later view request status from a non-admin surface

### 3.4 Scope position

This belongs to Dev A because it is a user-originated non-admin flow, even though admin later reviews it.

### 3.5 What the flow owns

The request-creation flow owns:

- request form entry
- draft/save/submit behavior if present
- participant/creator-facing request statuses
- clear messaging that admin review happens later

### 3.6 What the flow does not own

The request-creation flow does not own:

- admin review UI
- admin approval tooling
- internal diagnostics/audit

---

## 4. Relationship Between The Two Flows

These two flows should be presented as sister actions in the non-admin product:

- **apply to something that exists**
- **propose something new**

They are different flows, but they should live under the same product logic:

- both are non-admin
- both create persisted state
- both produce statuses that the user can revisit
- neither should depend on payment in the current phase

---

## 5. Recommended Surface Model

Near-term non-admin surfaces should read like this:

- landing: explains the product simply
- events list/detail: supports finding existing events
- apply route: canonical event application route
- dashboard/personal area: shows user status and next steps
- request-creation surface: lets a user start a new event/circle proposal
- request-status surface: lets a user track the state of what they proposed

This keeps the non-admin experience coherent without relying on admin pages to explain the user's own workflow.

---

## 6. Deferred Topics

The following remain intentionally outside this spec:

- whether questionnaire completion is required before each flow
- payment behavior
- richer post-event feedback
- separate domain treatment for event vs experience vs circle

---

## 7. Acceptance Criteria

This spec is satisfied when next-phase planning:

1. treats apply and request-creation as the two core non-admin flows
2. keeps request creation in Dev A scope
3. models request creation as admin-reviewed, not instantly live
4. avoids tying either flow to payment work
5. avoids pulling admin build work into Dev A tasks

