# Supabase Auth — מייל התחברות (OTP) מול קישור

האפליקציה משתמשת ב־`signInWithOtp({ email })` וב־`verifyOtp({ type: 'email', token })` — כלומר **קוד בן 6 ספרות** במסך, לא לחיצה על קישור בלבד.

## הבעיה

ברירת המחדל של Supabase בתבנית **Magic link** היא `{{ .ConfirmationURL }}` — מייל עם **קישור** בלי להדגיש את `{{ .Token }}`. אז המשתמש לא רואה קוד, בעוד הממשק מבקש OTP.

## הפתרון (חובה)

ב־Supabase Dashboard → **Authentication** → **Email Templates** → **Magic link**:

1. הוסיפו לגוף המייל את **`{{ .Token }}`** (הקוד בן 6 הספרות).
2. אפשר להסיר או להשאיר את `{{ .ConfirmationURL }}` — אם רוצים **רק OTP**, אל תסמכו על הקישור כנתיב העיקרי (העיקרון באפליקציה הוא הזנת הקוד במסך).

תיעוד רשמי (מקור ל־`@supabase/auth-js`): להחליף בתבנית את `{{ .ConfirmationURL }}` ב־`{{ .Token }}` כדי לשלוח קוד במקום קישור.

## נושא המייל (Subject)

מומלץ בעברית, למשל: **«קוד כניסה לאזור האישי»** — השדה ב־API הוא `mailer_subjects_magic_link` (מיפוי ל־Management API `PATCH .../config/auth`).

## סביבות

- **Production** — פרויקט `nshgmuqlivuhlimwdwhe` (ערכים כמו ב־[`.env.production.example`](../../.env.production.example)).
- **Staging** — פרויקט `huzcvjyyyuudchnrosvx` (כמו ב־[`.env.staging.example`](../../.env.staging.example)); כדאי לשמור על אותה מדיניות OTP כדי שלא יבלבלו בדיקות ידניות.

## נושאים נוספים (ברירת מחדל באנגלית)

באותו מסך ניתן לעדכן גם נושאים של הזמנה, אישור הרשמה, שחזור וכו׳ (`mailer_subjects_*`) כדי שלא יופיע "Confirm Your Signup" וכדומה במיילים למשתמשי קצה.

## קישור רלוונטי במוצר

- מסך התחברות: `src/pages/auth/AuthPage.tsx`
- שליחת OTP: `src/lib/authOtp.ts`

## כשמופיעה «בעיה זמנית בחיבור» / לא נשלח מייל

1. **בלי משתני סביבה בבילד** — אם `VITE_SUPABASE_URL` / המפתח לא הוגדרו בזמן `vite build`, הדפדפן פונה ל־`invalid.supabase.co` והבקשה נופלת. **תיקון:** להגדיר ב־Vercel (או CI) את `VITE_SUPABASE_URL` ו־`VITE_SUPABASE_PUBLISHABLE_KEY`, לבנות מחדש ולפרוס. לבדוק ב־Network שהבקשה יוצאת ל־`https://<ref>.supabase.co`.
2. **Redirect URLs** — `signInWithOtp` שולח `emailRedirectTo` ל־`/auth/callback` על אותו דומיין. ב־Supabase → **Authentication** → **URL Configuration** → **Redirect URLs** חייב להופיע המקור המדויק (למשל `https://social-matching-web.vercel.app/**`, ותצוגות תצוגה־מקדימה של Vercel אם משתמשים בהן). אחרת מקבלים שגיאת redirect — המוצר מציג הודעה ייעודית («כתובת האתר לא מאושרת»), לא רק «רשת».
3. **חוסם פרסומות / רשת** — אם זה באמת `Failed to fetch`, לבדוק חיבור, VPN, או חסימה לדומיין `*.supabase.co`.
