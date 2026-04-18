# 10 — Event Discovery and Detail Specification

## 1. Purpose

להגדיר איך המשתמש מגלה אירועים, מבין אותם, ומחליט אם להגיש מועמדות.

---

## 2. Discovery Goal

ה-discovery layer צריך לעזור למשתמש:
- להבין מה קיים כרגע
- לדמיין את החוויה
- להרגיש שהמערכת סלקטיבית ולא רועשת
- להחליט אם כדאי להעמיק לאירוע מסוים

ה-discovery לא אמור להרגיש כמו marketplace עמוס.

---

## 3. Browse Requirements

מסך האירועים צריך:
- להציג רק אירועים רלוונטיים ל-MVP
- לשמור על low cognitive load
- להציג מידע מספיק להחלטה ראשונית
- לא לחשוף שפה אדמינית או טכנית

---

## 4. Browse Visibility Rule

ב-MVP הראשון, browse יציג:
- only published events
- only active events

### Explicit rule
- `is_published = true`
- `status = active`

---

## 5. Event Card Information

כל event card צריך לכלול לפחות:
- title
- city / area
- timing
- short vibe/context
- deadline or open state
- hint about process (reviewed / approval-before-payment)

---

## 6. Detail Goal

עמוד האירוע צריך לעזור למשתמש להרגיש:
- אני מבין מה המפגש הזה
- אני יודע למה לצפות
- אני מבין מה קורה אחרי apply
- אני סומך על התהליך

---

## 7. Detail Requirements

עמוד detail צריך לכלול לפחות:
- title
- description
- timing
- city / location hint
- group size / max capacity context
- application deadline if exists
- explanation of approval-before-payment
- CTA מותאם למצב

---

## 8. Detail Visibility Rule

עמוד detail יכול להציג:
- published event
גם אם ההגשה כבר סגורה.

### Reason
כדי שהמשתמש יקבל:
- explanation
- state clarity
- not-found רק כשבאמת אין event רלוונטי

---

## 9. CTA States On Detail

ה-CTA בעמוד detail צריך להשתנות לפי מצב:

### If no application exists and event open
- apply CTA

### If application already exists
- existing state block
- no duplicate apply CTA

### If event closed
- closed state
- back to events CTA

---

## 10. Empty / Not Found / Loading States

### Browse states
- loading
- empty
- error

### Detail states
- loading
- not found
- closed
- already applied

---

## 11. Discovery UX Principle

המסכים האלה צריכים להרגיש:
- curated
- calm
- socially legible
- trust-building
- not transactional

---

## 12. Future Expansion

בהמשך אפשר להוסיף:
- richer filtering
- category-based discovery refinement
- host presentation layer
- richer event previews
- trust and social-fit indicators
