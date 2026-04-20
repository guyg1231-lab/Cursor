# 09 — Apply Flow Specification

## 1. Purpose

ה-Apply Flow נועד לאפשר למשתמש להביע עניין באירוע מסוים,
מבלי להכריח אותו לעבור onboarding מלא מחדש.

## 2. Core Principle

השאלון הבסיסי עונה על:
> מי אני?

ה-Apply עונה על:
> למה האירוע הזה נכון עבורי?

## 3. Canonical Route

ה-route הקנוני ליצירה או צפייה ב-apply הוא:

> `/events/:eventId/apply`

`/gathering/:eventId` אינו אמור להיות מסלול apply מתחרה.
הוא יכול לשמש בהמשך כמשטח מידע / תגובה / שלב מאוחר יותר בלייפסייקל.

---

## 4. Preconditions

לפני Apply, המשתמש צריך:
- להיות authenticated
- להיות ready לפי החוק הפעיל כרגע של questionnaire readiness
- לא להיות כבר עם application קיימת לאותו event
- שהאירוע יהיה פתוח להגשות

---

## 5. Apply Questions

ב-MVP ה-Apply כולל:

### AQ-1
למה דווקא המפגש הזה מעניין אותך?

### AQ-2
מה היית רוצה לקבל מהמפגש הזה?

### AQ-3
מה היית רוצה להביא לקבוצה?

### AQ-4
יש משהו שחשוב למארגן לדעת?


## 6. Apply UX Principles

ה-Apply צריך להרגיש:
- lightweight
- event-specific
- intentional
- not repetitive
- not bureaucratic

המשתמש לא אמור להרגיש שהוא "ממלא הכל מחדש".


## 7. Persisted Outcome

ה-Apply חייב לייצר persisted event-specific state.

ב-MVP הראשון:
- persisted application state נשמר דרך `event_registrations`

### Important note
זהו MVP application-state contract,
לא בהכרח המודל הסופי של הדומיין.


## 8. Apply State Outcomes

לאחר submit, המשתמש יכול להיות ב:
- pending
- awaiting_response
- confirmed
- approved
- rejected
- waitlist
- cancelled
- attended
- no_show


## 9. Duplicate Protection

המערכת חייבת למנוע duplicate apply עבור:
- אותו user
- אותו event


## 10. Payment Principle

payment כרגע מושהה.

לכן ב-phase הנוכחי:
- ה-Apply Flow לא צריך לבקש או להבטיח תשלום
- ה-Apply Flow לא צריך להיות תלוי ב-payment state

אם payment יחזור בהמשך:
- לא משלמים בשלב ההגשה
- תשלום מגיע רק אחרי approval / confirmation


## 11. Apply Failure / Guard States

המערכת צריכה לטפל במצבים הבאים:
- unauthenticated
- questionnaire not ready
- duplicate apply
- event not found
- event closed
- submit error


## 12. Relationship To Dashboard

אחרי apply:
- המשתמש צריך לראות state קיים במסכי המשתמש
- ה-dashboard צריך לשקף את האפליקציה שנוצרה


## 13. Relationship To Proposal Flow

Apply לא מכסה יצירה של event / experience / circle חדש.

זה flow נפרד:
- המשתמש יוצר proposal
- ה-proposal נכנס ל-admin review
- ה-user רואה סטטוס request נפרד

---

## 14. Future Expansion

בהמשך אפשר להרחיב:
- richer apply answers persistence
- category-specific apply questions
- host-specific question sets
- richer post-apply participant messaging
