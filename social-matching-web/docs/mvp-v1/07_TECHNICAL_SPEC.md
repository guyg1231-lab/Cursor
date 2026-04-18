# 07 — Technical Specification

## 1. Technical Goal

להגדיר baseline טכני למימוש MVP v1 של הפלטפורמה החדשה.

המסמך מגדיר:
- מבנה אפליקטיבי
- ישויות ליבה
- שכבות לוגיקה
- data contracts ראשוניים
- כללי יישום בסיסיים

---

## 2. App Structure

האפליקציה החדשה יושבת תחת:

`apps/social-matching-web/`

### Current structure
- `src/app/` — app shell, providers, router
- `src/components/` — shared UI and local primitives
- `src/contexts/` — auth, language, etc.
- `src/features/` — domain-oriented modules
- `src/integrations/` — Supabase integration
- `src/lib/` — utilities and design helpers
- `src/pages/` — route surfaces
- `docs/` — product and implementation docs

---

## 3. Technical Principles

1. No-Touch Legacy
2. Forked Build / Copy-Then-Adapt reuse
3. Web-first MVP
4. Product-facing UX first, admin later
5. Keep the first loop real before expanding scope
6. Prefer clear transitional contracts over fake abstraction

---

## 4. Core Domain Entities

## 4.1 User
Represents a signed-in user in the system.

### Relevant fields
- id
- full_name
- email
- phone
- preferred_language
- questionnaire_draft
- funnel_status
- social_verified

## 4.2 Event
Represents a published or internal event.

### Relevant fields
- id
- title
- description
- city
- starts_at
- ends_at
- venue_hint
- exact_location
- max_capacity
- registration_deadline
- is_published
- status

## 4.3 Matching Response / Profile Base
Represents the participant baseline questionnaire.

### Relevant fields
- user_id
- completed_at
- full_name
- email
- phone
- birth_date
- social_link
- current_place
- origin_place
- language_pref
- q22_interests
- q13_social_style
- q17_recharge
- q20_meeting_priority
- q_match_preference
- q25_motivation
- q26_about_you
- q27_comfort_needs

## 4.4 Event Registration / MVP Application State
For MVP v1, this entity is used as the persisted event-specific application-state record.

### Relevant fields
- id
- event_id
- user_id
- status
- questionnaire_completed
- payment_required
- payment_status

### Important note
This is a transitional MVP contract, not necessarily the final long-term domain model.

---

## 5. Roles Model

### Global roles
- user
- admin

### Event-level capacities
- host
- co_host
- participant

---

## 6. Participant Readiness Rule

The system must determine whether a user is ready to apply to an event.

### Temporary MVP compatibility rule
User is ready if either:
- `matching_responses.completed_at` exists
or
- `profiles.funnel_status` is beyond `needs_questionnaire`

### Note
This rule should later be replaced by a cleaner new-app-native readiness contract.

---

## 7. Event Visibility Rule

## Browse
A visible event must satisfy:
- `is_published = true`
- `status = active`

## Detail
An event detail page may show any published event, even if its registration is no longer open.

---

## 8. Workflow Data Contracts

## 8.1 Discovery
Frontend reads from `events`.

## 8.2 Profile questionnaire
Frontend reads/writes:
- `profiles.questionnaire_draft`
- `matching_responses`
- selected profile fields in `profiles`

## 8.3 Apply
Frontend writes an event-specific persisted state row into `event_registrations`.

## 8.4 Dashboard
Frontend reads participant-facing event state from `event_registrations` joined with `events`.

---

## 9. Feature Modules

## 9.1 `features/events`
Responsible for:
- event browse loading
- event detail loading
- event formatting helpers
- event query contracts

## 9.2 `features/applications`
Responsible for:
- questionnaire readiness rule
- duplicate apply detection
- application-state creation
- status formatting helpers

## 9.3 `features/profile`
Responsible for:
- profile questionnaire
- draft persistence
- matching baseline persistence

---

## 10. Route Surfaces

### Public / participant surfaces
- `/`
- `/events`
- `/events/:eventId`
- `/questionnaire`
- `/events/:eventId/apply`
- `/dashboard`

### Admin surface
- `/admin`

---

## 11. State Behaviors Required

### Discovery states
- loading
- empty
- error

### Detail states
- loading
- not found
- registration closed
- already applied

### Apply states
- loading
- unauthenticated
- questionnaire not ready
- duplicate apply
- closed event
- submit success
- submit error

### Dashboard states
- loading
- empty
- list of persisted applications

---

## 12. Design / UX Technical Baseline

The new app should use:
- a Circles-style `PageShell`
- shared header/chrome
- local design tokens
- product surfaces with gradient shell
- admin surfaces with minimal shell
- participant-facing copy that avoids admin/system jargon

---

## 13. Known Technical Open Questions

1. האם `event_registrations` נשאר מודל היישום הקבוע של apply state?
2. איפה נשמרות apply answers העשירות בטווח הארוך?
3. מהו readiness contract הסופי של profile completion?
4. מהו contract הסופי בין matching engine לבין admin review UI?
5. איך payment abstraction תמומש כשה-provider הראשון ייכנס?

---

## 14. Immediate Technical Boundary

כל הרחבה עתידית צריכה לשמור על העיקרון:

> קודם משמרים לופ אמיתי ופשוט שעובד, ורק אחר כך מרחיבים שכבות.
