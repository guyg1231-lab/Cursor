# 09 — Apply Flow Specification

## 1. Purpose

ה-Apply Flow נועד לאפשר למשתמש להביע עניין באירוע מסוים,
מבלי להכריח אותו לעבור onboarding מלא מחדש.

## 2. Core Principle

השאלון הבסיסי עונה על:
> מי אני?

ה-Apply עונה על:
> למה האירוע הזה נכון עבורי?

---

## 3. Preconditions

לפני Apply, המשתמש צריך:
- להיות authenticated
- להיות ready לפי questionnaire readiness rule
- לא להיות כבר עם application קיימת לאותו event
- שהאירוע יהיה פתוח להגשות

---

## 4. Apply Questions

ב-MVP ה-Apply כולל:

### AQ-1
למה דווקא המפגש הזה מעניין אותך?

### AQ-2
מה היית רוצה לקבל מהמפגש הזה?

### AQ-3
מה היית רוצה להביא לקבוצה?

### AQ-4
יש משהו שחשוב למארגן לדעת?

### AQ-5
אני מבין/ה שהתשלום יישלח רק אם אתקבל/י.

### AQ-6
אם אתקבל/י, אני מתחייב/ת לשלם בזמן כדי לשמור על המקום שלי.

---

## 5. Apply UX Principles

ה-Apply צריך להרגיש:
- lightweight
- event-specific
- intentional
- not repetitive
- not bureaucratic

המשתמש לא אמור להרגיש שהוא "ממלא הכל מחדש".

---

## 6. Persisted Outcome

ה-Apply חייב לייצר persisted event-specific state.

ב-MVP הראשון:
- persisted application state נשמר דרך `event_registrations`

### Important note
זהו MVP application-state contract,
לא בהכרח המודל הסופי של הדומיין.

---

## 7. Apply State Outcomes

לאחר submit, המשתמש יכול להיות ב:
- pending
- approved
- rejected
- waitlist
- cancelled
- attended
- no_show

---

## 8. Duplicate Protection

המערכת חייבת למנוע duplicate apply עבור:
- אותו user
- אותו event

---

## 9. Payment Principle

ה-Apply Flow חייב להבהיר:
- לא משלמים בשלב ההגשה
- תשלום מגיע רק אחרי approval

---

## 10. Apply Failure / Guard States

המערכת צריכה לטפל במצבים הבאים:
- unauthenticated
- questionnaire not ready
- duplicate apply
- event not found
- event closed
- submit error

---

## 11. Relationship To Dashboard

אחרי apply:
- המשתמש צריך לראות state קיים במסכי המשתמש
- ה-dashboard צריך לשקף את האפליקציה שנוצרה

---

## 12. Future Expansion

בהמשך אפשר להרחיב:
- richer apply answers persistence
- category-specific apply questions
- host-specific question sets
- richer post-apply participant messaging
