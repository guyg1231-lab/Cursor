# 04 — Workflows

## 1. Overview

המסמך מגדיר את ה-workflows המרכזיים של המערכת ב-MVP הראשון.

ה-workflows המרכזיים הם:
- Participant workflow
- Proposal workflow
- Host workflow
- Co-Host workflow
- Admin workflow
- Event lifecycle workflow

---

# 2. Participant Workflow

## Goal
לאפשר למשתתף לגלות אירוע קיים, להבין אותו, להגיש מועמדות, ולעבור בצורה ברורה עד למפגש עצמו.

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
- מבין שההגשה תיכנס לבדיקה

### Step 5 — Application state
אחרי submit:
- application נשמרת
- המשתתף רואה סטטוס קיים
- לא יכול להגיש שוב לאותו אירוע

### Step 6 — Review and decision
המערכת/אדמין:
- בודקים את ההגשה
- משתמשים באלגוריתם כהמלצה
- מחליטים pending / waitlist / awaiting_response / confirmed / rejection לפי השלב

### Step 7 — Group opening
אם נשמר למשתתף מקום:
- הוא רואה את הסטטוס המעודכן
- מקבל את המידע הרלוונטי
- מועבר לתקשורת הקבוצתית

### Step 8 — Attend event
המשתתף מגיע למפגש.

### Step 9 — Feedback
אחרי האירוע:
- המשתתף נותן פידבק
- המערכת מעדכנת attendance / trust-lite state

---

# 3. Proposal Workflow

## Goal
לאפשר למשתמש להציע event / experience / circle חדש, שייכנס ל-admin review לפני שהוא נהיה חי.

## Flow

### Step 1 — Start something new
המשתמש:
- בוחר ליצור משהו חדש
- רואה שהיצירה היא proposal לבדיקת admin

### Step 2 — Fill request details
המשתמש:
- ממלא את עיקרי ההצעה
- מתאר מה הוא רוצה לקיים

### Step 3 — Submit for review
הבקשה:
- נשמרת
- עוברת לסטטוס review
- עדיין לא הופכת ל-event ציבורי

### Step 4 — Track status
המשתמש:
- רואה את סטטוס הבקשה
- מבין אם הבקשה אושרה / נדחתה / ממתינה לבדיקה

---

# 4. Host Workflow

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

# 5. Co-Host Workflow

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

# 6. Admin Workflow

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

### Step 6 — Final operational state
admin עובר למצב:
- confirmed participant list
- readiness for communication and event execution

### Step 7 — Post-event review
admin יכול:
- לעקוב אחרי attendance
- לעקוב אחרי feedback
- לעדכן trust/internal status

---

# 7. Event Lifecycle Workflow

## Full lifecycle

1. Event created or proposed
2. If user-created: proposal enters admin review
3. Event approved by admin
4. Event published
5. Applications collected
6. Matching / recommendation / review
7. Temporary response / confirmation stages if used
8. Final group opened
9. Event occurs
10. Feedback collected
11. Internal trust / lifecycle data updated

---

# 8. Workflow Notes

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
payment כרגע מושהה ואינו חלק מה-build הנוכחי.
אם הוא יחזור בהמשך, הוא עדיין לא יופיע לפני approval / confirmation.

## Domain-language principle
`event`, `experience`, ו-`circle` הם אותו אובייקט MVP.
ההבדל כרגע הוא בשפה, לא בזרימות נפרדות.
