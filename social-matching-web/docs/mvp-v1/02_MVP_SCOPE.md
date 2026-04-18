# 02 — MVP Scope

## 1. MVP Goal

מטרת ה-MVP היא להעמיד מערכת עובדת שמוכיחה את הליבה הבאה:

- אירועים קטנים ניתנים לגילוי
- משתמשים משלימים פרופיל ומגישים מועמדות
- המערכת/האדמין בונים קבוצה מאושרת
- תשלום נדרש רק אחרי אישור
- מתבצע מפגש אמיתי
- נאסף פידבק אחריו

## 2. In Scope

### Discovery
- browse של אירועים פתוחים
- event detail page
- filters בסיסיים

### Participant Intake
- profile questionnaire
- trust fields
- save / resume behavior

### Event Apply
- apply per event
- apply state persistence
- duplicate apply prevention
- questionnaire readiness gate

### Curation / Matching
- admin review
- algorithm-assisted recommendation
- manual approval decision

### Registration State
- pending
- approved
- rejected
- waitlist
- cancelled
- attended / no-show later in lifecycle

### Payment
- payment only after approval
- payment request lifecycle exists conceptually in MVP
- provider support can begin with minimal operational model

### Communication
- WhatsApp as initial group communication layer

### Feedback
- post-event feedback
- attendance tracking
- internal trust/reputation-lite updates

## 3. Out Of Scope

- native mobile app
- social feed
- internal chat system
- subscription model
- marketplace for businesses
- public rich profiles
- advanced recommendation transparency to users
- +1 / bring a friend flow
- gamification
- deep reputation engine

## 4. Geographic Scope

בשלב הראשון:
- עיר אחת
- אירועים מקבילים מעטים

## 5. Category Scope

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

## 6. Concurrency Scope

ב-MVP:
- עד 5 אירועים במקביל

## 7. Group Size Scope

הגודל הרצוי:
- 6–8 משתתפים

מינימום:
- 5 משתתפים + host
או לפי סוג האירוע

## 8. Operating Assumptions

- user אחד יכול להיות participant באירוע אחד ו-host באירוע אחר
- approval נשאר אנושי ב-MVP
- payment לא קורה לפני approval
- trust layer הוא חלק מהליבה, לא תוספת

## 9. MVP Success Metrics

### Funnel metrics
- browse → apply rate
- profile completion rate
- apply completion rate

### Decision metrics
- approval rate
- approval → payment rate

### Real-world outcome metrics
- attendance rate
- feedback quality
- repeat participation intent

## 10. MVP Boundary Rule

אם feature לא תורם ישירות ללופ הבא:

> discover → apply → approve → pay → attend → feedback

הוא לא בליבת ה-MVP הראשונה.
