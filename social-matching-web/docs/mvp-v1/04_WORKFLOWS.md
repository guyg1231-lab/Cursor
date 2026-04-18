# 04 — Workflows

## 1. Overview

המסמך מגדיר את ה-workflows המרכזיים של המערכת ב-MVP הראשון.

ה-workflows המרכזיים הם:
- Participant workflow
- Host workflow
- Co-Host workflow
- Admin workflow
- Event lifecycle workflow

---

# 2. Participant Workflow

## Goal
לאפשר למשתתף לגלות אירוע, להבין אותו, להגיש מועמדות, ולעבור בצורה ברורה עד למפגש עצמו.

## Flow

### Step 1 — Browse events
המשתתף:
- נכנס למסך המפגשים
- רואה אירועים פתוחים
- מסנן/מעיין לפי מה שנראה לו נכון

### Step 2 — Open event detail
המשתתף:
- נכנס לעמוד האירוע
- מבין את האופי, הזמן, העיר, תהליך האישור והציפיות
- מחליט אם להגיש מועמדות

### Step 3 — Complete profile if needed
אם אין readiness מספיק:
- המשתתף משלים profile questionnaire
- המערכת שומרת את פרטי trust + matching core

### Step 4 — Apply to event
המשתתף:
- ממלא apply קצר לאירוע
- מביע כוונה והקשר רלוונטי
- מאשר את עקרון payment-after-approval

### Step 5 — Application state
אחרי submit:
- application נשמרת
- המשתתף רואה סטטוס קיים
- לא יכול להגיש שוב לאותו אירוע

### Step 6 — Review and decision
המערכת/אדמין:
- בודקים את ההגשה
- משתמשים באלגוריתם כהמלצה
- מחליטים approval / waitlist / rejection

### Step 7 — Payment stage
אם המשתתף approved:
- נשלח payment request
- המשתתף משלם בזמן מוגדר
- אם לא משלם — אפשר להחליף מ-waitlist

### Step 8 — Group opening
אם המשתתף approved + paid:
- הוא נכנס לקבוצה הסופית
- מקבל את המידע הרלוונטי
- מועבר לתקשורת הקבוצתית

### Step 9 — Attend event
המשתתף מגיע למפגש.

### Step 10 — Feedback
אחרי האירוע:
- המשתתף נותן פידבק
- המערכת מעדכנת attendance / trust-lite state

---

# 3. Host Workflow

## Goal
לאפשר ל-host להציע או להוביל מפגש, ולקבל קבוצה מאושרת שנבנתה על ידי המערכת והאדמין.

## Flow

### Step 1 — Host exists in system
ה-host הוא user רגיל במערכת.

### Step 2 — Event proposal / assignment
ב-MVP, event יכול:
- להיות מוצע ע"י host
או
- להיות משויך ל-host ע"י admin flow

### Step 3 — Event review
האדמין בודק:
- האם האירוע מתאים
- האם ה-host מתאים/מאושר
- האם האירוע נכנס ל-calendar הפעיל

### Step 4 — Event published
האירוע נפתח ל-discovery + apply.

### Step 5 — Applicant collection
applications נאספות עד:
- כמות מסוימת
- deadline
- או החלטת admin

### Step 6 — Group review
admin בונה קבוצה,
עם עזרה אפשרית מהאלגוריתם.

### Step 7 — Host receives confirmed group
ה-host מקבל את הקבוצה המאושרת ואת המידע שנחוץ לו להוביל את החוויה.

### Step 8 — Event delivery
ה-host מוביל את המפגש בפועל.

### Step 9 — Post-event feedback
ה-host יכול:
- לתת feedback על הקבוצה
- לסמן attendance / notes בהתאם למדיניות המערכת

---

# 4. Co-Host Workflow

## Goal
לאפשר ל-co-host לסייע ל-host באירוע מסוים.

## Flow

### Step 1 — Co-host assigned to event
co-host משויך לאירוע מסוים.

### Step 2 — Receives event-specific context
הוא מקבל רק את ההקשר שנדרש לצורך ההובלה.

### Step 3 — Assists in event delivery
הוא עוזר בניהול, קבלת אנשים, תיווך או הנחיה, בהתאם לסוג האירוע.

### Step 4 — Post-event support
יכול לעזור בפידבק או בסיכום, לפי policy.

---

# 5. Admin Workflow

## Goal
לאפשר שליטה אנושית על איכות, אמון, התאמה ותפעול.

## Flow

### Step 1 — Event intake
admin רואה events חדשים / להצעה / לאישור.

### Step 2 — Event approval
admin מאשר / דוחה / משהה event.

### Step 3 — Application review
admin רואה applicants לכל event.

### Step 4 — Matching support
admin מקבל:
- profile context
- trust context
- algorithm recommendation
- application context

### Step 5 — Group assembly
admin בוחר:
- approved
- waitlist
- rejected

### Step 6 — Payment trigger
לאחר group approval:
- payment stage נפתח
- המערכת עוקבת מי שילם ומי לא

### Step 7 — Replacement logic
אם מישהו לא משלם בזמן:
- admin / system מחליפים מה-waitlist

### Step 8 — Final operational state
admin עובר למצב:
- confirmed participant list
- readiness for communication and event execution

### Step 9 — Post-event review
admin יכול:
- לעקוב אחרי attendance
- לעקוב אחרי feedback
- לעדכן trust/internal status

---

# 6. Event Lifecycle Workflow

## Full lifecycle

1. Event created / proposed
2. Event approved by admin
3. Event published
4. Applications collected
5. Matching / recommendation / review
6. Group approved
7. Payment request sent
8. Payment confirmed
9. Final group opened
10. Event occurs
11. Feedback collected
12. Internal trust / lifecycle data updated

---

# 7. Workflow Notes

## Participant-first principle
למרות שיש שכבת admin חזקה,
ה-flow למשתמש צריך להרגיש:
- ברור
- רגוע
- לא בירוקרטי
- לא שיפוטי

## Admin-assisted principle
ב-MVP:
- admin הוא שכבת בקרה חשובה
- algorithm הוא כלי עזר
- approval remains human-controlled

## Payment principle
תשלום לעולם לא מגיע לפני approval.
