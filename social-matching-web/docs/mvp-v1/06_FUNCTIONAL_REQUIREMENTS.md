# 06 — Functional Requirements

## 1. Event Discovery

### FR-1
The system must display a list of public events available for discovery.

### FR-2
Each event card must expose enough information for an initial decision:
- title
- city / area
- timing
- short description or vibe signal
- registration status/open state

### FR-3
The system must support event detail pages for individual events.

### FR-4
The event detail page must show whether event applications are currently open.

---

## 2. Participant Profile / Questionnaire

### FR-5
The system must allow a user to complete a profile questionnaire.

### FR-6
The questionnaire must collect trust and matching baseline information.

### FR-7
The questionnaire must support draft save behavior.

### FR-8
The system must be able to determine whether a user is ready under the currently active questionnaire rule.

---

## 3. Apply Flow

### FR-9
The system must allow a user to apply to a specific event.

### FR-10
The system must prevent duplicate apply submissions for the same user and event.

### FR-11
The system must persist event application state.

### FR-12
The system must show the current event application state back to the user.

### FR-13
The system must block apply when the event is closed for registration.

### FR-14
The system must block apply when the user is not ready according to the active questionnaire-readiness rule.

### FR-15
The system must let the user revisit the same event-specific application state from the canonical apply route.

---

## 4. Event / Experience / Circle Proposal Flow

### FR-16
The system must allow a user to submit a new event / experience / circle proposal.

### FR-17
The system must treat that submission as a request for admin review, not as an instantly live public event.

### FR-18
The system must persist creator-visible request status.

### FR-19
The system must show the creator whether the proposal is pending review, approved, rejected, or active/live.

---

## 5. Status Model

### FR-20
The system must support at least the following application/registration statuses:
- pending
- awaiting_response
- confirmed
- approved
- rejected
- waitlist
- cancelled
- attended
- no_show

### FR-21
The system must display those states clearly in participant-facing surfaces.

---

### FR-22
The system must support a separate creator-facing request status model for proposed events / experiences / circles.

---

## 6. Deferred Payment Rule

### FR-23
The current MVP phase must not require payment implementation in order to complete the core non-admin flows.

### FR-24
If payment is reintroduced later, the system must enforce that it happens only after approval / confirmation.

### FR-25
Replacement logic after non-payment is a later-phase concern and is not required in the current build.

---

## 7. Host and Co-Host

### FR-26
The system must support assigning a host to an event.

### FR-27
The system must support assigning a co-host to an event.

### FR-28
The system must treat host / co-host as event-level capacities, not global identity roles.

---

## 8. Admin Operations

### FR-29
The system must allow admins to approve events.

### FR-30
The system must allow admins to review event applicants.

### FR-31
The system must allow admins to set participant decision states.

### FR-32
The system must allow admins to use algorithmic recommendation data as decision support.

---

## 9. Trust and Verification

### FR-33
The system must collect trust-relevant fields such as phone, email, social link, and birth date.

### FR-34
The system must support internal trust review by admin.

### FR-35
The system must keep social verification data internal and not expose it publicly to participants.

---

## 10. Feedback and Attendance

### FR-36
The system must support attendance-related lifecycle states.

### FR-37
The system must support post-event feedback collection.

### FR-38
The system must support internal trust/reputation-lite updates after attendance and feedback.

---

## 11. MVP Experience Rules

### FR-39
The system must preserve a clear, participant-friendly flow from discovery to apply.

### FR-40
The system must preserve a clear, participant-friendly flow from proposal creation to request-status tracking.

### FR-41
The system must treat `event`, `experience`, and `circle` as the same MVP object unless a later spec explicitly splits them.

### FR-42
The system must not expose generic marketplace noise or admin language in participant-facing surfaces.
