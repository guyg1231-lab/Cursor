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
The system must allow a user to complete a profile questionnaire before applying.

### FR-6
The questionnaire must collect trust and matching baseline information.

### FR-7
The questionnaire must support draft save behavior.

### FR-8
The system must be able to determine whether a user is ready to apply to an event.

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
The system must block apply when the user is not ready according to the questionnaire-readiness rule.

---

## 4. Status Model

### FR-15
The system must support at least the following application/registration statuses:
- pending
- approved
- rejected
- waitlist
- cancelled
- attended
- no_show

### FR-16
The system must display those states clearly in participant-facing surfaces.

---

## 5. Payment Flow

### FR-17
The system must enforce the rule that payment happens only after approval.

### FR-18
The system must support a post-approval payment stage for approved participants.

### FR-19
The system must support replacement logic after non-payment, even if implementation starts later.

---

## 6. Host and Co-Host

### FR-20
The system must support assigning a host to an event.

### FR-21
The system must support assigning a co-host to an event.

### FR-22
The system must treat host / co-host as event-level capacities, not global identity roles.

---

## 7. Admin Operations

### FR-23
The system must allow admins to approve events.

### FR-24
The system must allow admins to review event applicants.

### FR-25
The system must allow admins to set participant decision states.

### FR-26
The system must allow admins to use algorithmic recommendation data as decision support.

---

## 8. Trust and Verification

### FR-27
The system must collect trust-relevant fields such as phone, email, social link, and birth date.

### FR-28
The system must support internal trust review by admin.

### FR-29
The system must keep social verification data internal and not expose it publicly to participants.

---

## 9. Feedback and Attendance

### FR-30
The system must support attendance-related lifecycle states.

### FR-31
The system must support post-event feedback collection.

### FR-32
The system must support internal trust/reputation-lite updates after attendance and feedback.

---

## 10. MVP Experience Rules

### FR-33
The system must preserve a clear, participant-friendly flow from discovery to apply.

### FR-34
The system must not require payment before approval.

### FR-35
The system must not expose generic marketplace noise or admin language in participant-facing surfaces.
