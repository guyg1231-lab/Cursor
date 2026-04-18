# 08 — Questionnaire Specification

## 1. Purpose

שאלון הבסיס נועד:
- לבנות trust baseline
- לאסוף matching signals
- לאפשר belonging/context signals
- לספק context טוב יותר לאדמין ולמערכת

המטרה שלו אינה "לדרג" את המשתמש,
אלא לעזור לבנות חוויה קבוצתית מדויקת ונעימה יותר.

---

## 2. Design Principles

השאלון צריך להרגיש:
- guided
- human
- calm
- respectful
- not bureaucratic

הוא לא צריך להרגיש כמו:
- psychometric test
- HR form
- admin intake
- evaluation funnel

---

## 3. Structure

## Section 1 — Identity and Trust
שדות בסיסיים לאימות, תקשורת ואחריות תפעולית.

### Fields
- full_name
- email
- phone
- social_link
- birth_date

## Section 2 — Fit and Belonging
Signals שעוזרים להבין התאמה ונוחות בקבוצה.

### Fields
- current_place
- origin_place
- language_pref
- q22_interests
- q13_social_style
- q17_recharge
- q20_meeting_priority
- q_match_preference
- q25_motivation

## Section 3 — Context and Comfort
Signals אנושיים ומשלימים.

### Fields
- q26_about_you
- q27_comfort_needs

---

## 4. Field Intent

## 4.1 Trust fields
### full_name
לזיהוי בסיסי ואמון.

### email
לתקשורת, auth, ולייף־סייקל.

### phone
לתיאום, אמון ותקשורת day-of-event.

### social_link
לאימות זהות ע"י הצוות בלבד.
לא מיועד לחשיפה ציבורית.

### birth_date
לתחושת cohort, התאמות גיל, ובטיחות.

---

## 4.2 Matching / belonging fields
### current_place
עוזר להקשר גיאוגרפי ולוגיסטי.

### origin_place
עוזר לייצר belonging / mix / familiarity signal.

### language_pref
עוזר לבנות קבוצה שמרגישה נוחה יותר שפתית.

### q22_interests
תחומי עניין כלליים להקשר ולחיבור.

### q13_social_style
תפקיד/נוכחות חברתית יחסית בקבוצה.

### q17_recharge
אנרגיה חברתית כללית.

### q20_meeting_priority
מה חשוב למשתמש במפגש עם אנשים חדשים.

### q_match_preference
האם המשתמש מחפש דמיון, שוני או שילוב.

### q25_motivation
למה הוא בכלל כאן, ומה הוא מחפש דרך החוויה.

---

## 4.3 Context fields
### q26_about_you
שדה חופשי שמספק אנושיות והקשר מעבר לשדות מובנים.

### q27_comfort_needs
שדה נוחות/רגישות/גבולות שעוזר לייצר חוויה בטוחה יותר.

---

## 5. Questionnaire Rules

### Rule 1
השאלון נשמר כ-profile base ולא נשאל מחדש במלואו לכל event.

### Rule 2
השאלון צריך לאפשר draft/save.

### Rule 3
שאלות trust-sensitive צריכות לכלול helper copy ברור.

### Rule 4
המערכת צריכה לדעת מתי השאלון נחשב complete לצורך readiness-to-apply.

---

## 6. Output Of Questionnaire

המערכת מפיקה מהשאלון:
- trust baseline
- matching baseline
- comfort / context baseline
- readiness signal ל-apply flow

---

## 7. Relationship To Apply Flow

השאלון עונה על השאלה:
> מי המשתמש?

ה-Apply עונה על השאלה:
> למה האירוע הזה מרגיש נכון עבורו?

---

## 8. Not In Questionnaire For MVP

הדברים הבאים אינם חלק מליבת Questionnaire MVP:
- budget level
- +1 flow
- deep humor modeling
- heavy psych-style profiling
- over-detailed social diagnostics
