# 02 — MVP Scope

## 1. MVP Goal

מטרת ה-MVP היא להעמיד מערכת עובדת שמוכיחה את הליבה הבאה:

- אירועים קטנים ניתנים לגילוי
- משתמשים יכולים להגיש מועמדות לאירוע קיים
- משתמשים יכולים להציע אירוע / חוויה / circle חדש לבדיקת admin
- המערכת וה-admin בונים קבוצה מאושרת
- מתבצע מפגש אמיתי
- נאסף פידבק אחריו
- תשלום אינו חלק מהפאזה הנוכחית והוא מושהה להמשך

## 2. Core Domain Rule

- `event`, `experience`, ו-`circle` הם אותו אובייקט MVP
- ההבדל כרגע הוא בשפה ובמיתוג, לא במודל דומיין נפרד
- אם משתמש יוצר חדש event / experience / circle, הוא יוצר **הצעה לבדיקת admin**, לא אירוע חי מיד

## 3. In Scope

### Discovery
- browse של אירועים פתוחים
- event detail page
- filters בסיסיים

### Participant Intake
- profile questionnaire
- trust fields
- save / resume behavior

### Apply To Existing Event
- apply route פר event
- apply state persistence
- duplicate apply prevention
- readiness gate לפי החוק הפעיל כרגע, עם אפשרות להחלטה מוצרית מחודשת בהמשך

### Propose New Event / Experience / Circle
- טופס הצעה מצד המשתמש
- שמירת בקשה / proposal
- סטטוס creator-facing לבקשה
- העברה ל-admin review

### Curation / Matching
- admin review
- algorithm-assisted recommendation
- manual approval decision

### Registration State
- pending
- awaiting_response
- confirmed
- approved
- rejected
- waitlist
- cancelled
- attended / no-show later in lifecycle

### Payment
- payment on hold
- payment implementation is not in the current build
- if payment returns later, it still happens only after approval / confirmation

### Communication
- WhatsApp as initial group communication layer

### Feedback
- post-event feedback
- attendance tracking
- internal trust/reputation-lite updates

## 4. Out Of Scope

- native mobile app
- social feed
- internal chat system
- payment provider / checkout implementation in the current phase
- subscription model
- marketplace for businesses
- public rich profiles
- advanced recommendation transparency to users
- +1 / bring a friend flow
- gamification
- deep reputation engine

## 5. Geographic Scope

בשלב הראשון:
- עיר אחת
- אירועים מקבילים מעטים

## 6. Category Scope

מומלץ להתחיל ב-3–5 קטגוריות לכל היותר.

### Recommended starting set
- Dinner / Shared Meal
- Walk / Outdoor
- Conversation Salon
- Creative / Workshop
- Drinks / Evening Social

### Recommended pilot subset
- Dinner
- Walk
- Salon

## 7. Concurrency Scope

ב-MVP:
- עד 5 אירועים במקביל

## 8. Group Size Scope

הגודל הרצוי:
- 6–8 משתתפים

מינימום:
- 5 משתתפים + host
או לפי סוג האירוע

## 9. Operating Assumptions

- user אחד יכול להיות participant באירוע אחד ו-host באירוע אחר
- approval נשאר אנושי ב-MVP
- `admin` הוא המונח הקנוני; `operator` הוא אותו תפקיד בתיעוד הישן
- payment מושהה מהפאזה הנוכחית
- trust layer הוא חלק מהליבה, לא תוספת

## 10. MVP Success Metrics

### Funnel metrics
- browse → apply rate
- browse → proposal-submit rate
- profile completion rate
- apply completion rate

### Decision metrics
- approval rate
- proposal review turnaround
- invite / confirmation completion rate

### Real-world outcome metrics
- attendance rate
- feedback quality
- repeat participation intent

## 11. MVP Boundary Rule

אם feature לא תורם ישירות ללופ הבא:

> discover → apply or propose → review → confirm group → attend → feedback

הוא לא בליבת ה-MVP הראשונה.
