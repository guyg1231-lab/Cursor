# Dev A Lifecycle And Route Boundary Design

**Date:** 2026-04-20  
**Owner:** Dev A  
**Status:** Proposed  
**Scope:** Define the route boundary and lifecycle vocabulary needed to stop non-admin product drift before further implementation.

---

## 1. Purpose

The current codebase has useful lifecycle mechanics, but the meaning is not yet clean enough across docs, routes, and planning.

The two biggest sources of drift are:

1. competing meaning between `/events/:eventId/apply` and `/gathering/:eventId`
2. partially inconsistent lifecycle vocabulary across docs and runtime

This spec defines the minimum contract needed now.

---

## 2. Canonical Apply Route

`/events/:eventId/apply` is the canonical route for creating or revisiting an event application.

It is the route that should own:

- application submission
- application gating
- blocked-state handling
- participant-visible status for an existing application

Any future planning should assume this is the primary application funnel.

---

## 3. Gathering Route Boundary

`/gathering/:eventId` should no longer be treated as a second competing application funnel.

Recommended role for `/gathering/:eventId`:

- a later-stage participant route
- an experience/info/response surface
- a route that may help with post-application or invitation-stage interaction

Not recommended for the next phase:

- using `/gathering/:eventId` as an equal alternative to `/events/:eventId/apply` for initial application creation

The reason is simple: two competing application entrypoints create drift in validation, lifecycle copy, and future contract changes.

---

## 4. Application Lifecycle Vocabulary

The current phase should treat the following as the active participant/application states:

- `pending`
- `waitlist`
- `awaiting_response`
- `confirmed`
- `approved`
- `rejected`
- `cancelled`
- `attended`
- `no_show`

### 4.1 Meaning guidance

- `pending`: application exists and is under review
- `waitlist`: application exists but no place is currently reserved
- `awaiting_response`: a temporary place is waiting for participant response
- `confirmed`: a place is considered reserved for the participant
- `approved`: legacy/adjacent reserved-state meaning that must be reconciled with `confirmed`
- `rejected`: application was not accepted
- `cancelled`: prior application was cancelled and may be eligible for re-entry depending on the route rules
- `attended`: participation completed
- `no_show`: participant did not attend

### 4.2 Reconciliation rule

`approved` and `confirmed` should not continue to drift semantically.

Next-phase planning must either:

1. explicitly collapse them into one reserved-state meaning, or
2. assign each one a clearly different meaning

The current recommendation is to move toward **one reserved-state meaning** for participant surfaces unless a stronger distinction is required.

---

## 5. Request Lifecycle Vocabulary

For user-created event/circle proposals, the non-admin lifecycle should be simpler:

- draft
- submitted for review
- approved
- rejected
- active/live (only after admin approval)

This keeps the request flow legible without importing admin implementation detail into user-facing planning.

---

## 6. Payment Rule

Payment is explicitly deferred.

Therefore:

- no active lifecycle state should require payment implementation now
- no route boundary should depend on payment completion
- any older documentation that places payment inside the active next-step loop should be restated as later-phase behavior

This spec does not remove payment from the long-term product; it removes payment from the current development scope.

---

## 7. Immediate Documentation Consequences

Active planning should be updated to reflect:

1. `/events/:eventId/apply` is canonical
2. `/gathering/:eventId` is narrowed to a later-stage role
3. payment is deferred
4. `approved` vs `confirmed` needs explicit reconciliation
5. request creation and request-status lifecycle belong to the non-admin product

---

## 8. Acceptance Criteria

This spec is satisfied when:

1. new Dev A planning uses `/events/:eventId/apply` as the only canonical application route
2. `/gathering/:eventId` is no longer planned as a competing initial-apply route
3. application states are described consistently in new scope docs
4. request-state vocabulary is defined separately from admin implementation detail
5. payment is clearly marked deferred in next-phase planning

