# 03 — User Roles and Permissions

## 1. Role Model

המערכת משתמשת בשני סוגי roles:

### Global roles
- `user`
- `admin`

### Event-level capacities
- `host`
- `co_host`
- `participant`

## 2. Why This Model

אותו אדם יכול להיות:
- participant באירוע אחד
- host באירוע אחר
- co-host באירוע שלישי

לכן host / co-host אינם role גלובלי קשיח, אלא capacity ביחס לאירוע מסוים.

## 3. User

### Description
כל משתמש רשום במערכת.

### Capabilities
- complete profile questionnaire
- browse events
- open event detail
- apply to events
- see own application state
- pay after approval
- submit feedback after event

## 4. Participant

### Description
User שיש לו application או confirmed participation באירוע מסוים.

### Capabilities
- apply to a published event
- track own status for that event
- receive approval / rejection / waitlist state
- pay if approved
- access participant-facing post-approval flow
- join communication channel when relevant
- submit feedback

## 5. Host

### Description
User שמוביל אירוע מסוים.

### Capabilities
- submit or own an event
- view event-specific operational context (subject to admin policy)
- receive final approved group for hosted event
- help manage participant communication in later lifecycle
- run the actual gathering

### Non-capabilities in MVP
- no unrestricted admin access
- no global moderation permissions by default

## 6. Co-Host

### Description
User שמצורף לאירוע מסוים כדי לסייע ל-host.

### Capabilities
- view allowed event context
- help host run the event
- possibly assist with participant-facing communication later

### Non-capabilities in MVP
- no standalone global control layer
- no implicit admin privileges

## 7. Admin

### Description
מפעיל פנימי של המערכת.

### Capabilities
- approve/reject event requests
- approve/reject hosts if needed
- review applicants
- use algorithm recommendations
- finalize group composition
- move users to waitlist / rejection / approval states
- trigger payment stage after approval
- operate event lifecycle
- review trust signals and internal notes

## 8. Permissions Summary

| Capability | User | Participant | Host | Co-Host | Admin |
|---|---:|---:|---:|---:|---:|
| Browse events | ✅ | ✅ | ✅ | ✅ | ✅ |
| Open event detail | ✅ | ✅ | ✅ | ✅ | ✅ |
| Apply to event | ✅ | ✅ | ✅* | ✅* | ✅ |
| View own application state | ✅ | ✅ | ✅ | ✅ | ✅ |
| Submit profile questionnaire | ✅ | ✅ | ✅ | ✅ | ✅ |
| Receive approval/payment flow | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage event applications | ❌ | ❌ | ❌** | ❌** | ✅ |
| Finalize groups | ❌ | ❌ | ❌ | ❌ | ✅ |
| Trigger payment phase | ❌ | ❌ | ❌ | ❌ | ✅ |
| View global admin tools | ❌ | ❌ | ❌ | ❌ | ✅ |

### Notes
- `*` Host/Co-Host יכולים להיות גם participants באירועים אחרים.
- `**` Host visibility into applicants depends on product policy and is not assumed by default in MVP.

## 9. Trust Note

permissions בתחום trust-sensitive data צריכים להיות שמרניים.
ב-MVP:
- social verification
- internal trust flags
- admin review context

נשארים בעיקר באחריות admin layer.
