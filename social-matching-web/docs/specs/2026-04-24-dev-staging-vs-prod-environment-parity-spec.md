# SPEC — יישור סביבות: Local DEV / Staging ↔ Production

**תאריך:** 2026-04-24  
**סטטוס:** נכון ליום הכתיבה (מבוסס על קוד הריפו + אימות DB חי + סקירת סאב־אייגנטים)

---

## 0) איך נכתב המסמך

נשלחו **שלושה סאב־אייגנטים** (קריאה בלבד) לייצוב תמונה:

1. **מיגרציות ו־ops** — מיפוי `supabase/migrations`, `supabase/config.toml`, מסמכי ops (db push, SQL ידני, refs).
2. **Frontend / Vite / env** — `vite.config.ts`, `src/integrations/supabase/client.ts`, משתני `VITE_*`, סיכוני build לפרוד.
3. **E2E ופרוד** — `playwright`, `e2e/fixtures`, מסמכי slice — מה הבדיקות מניחות מול מה שפרוד באמת חייב.

בנוסף בוצע **אימות DB חי** (שני פרויקטי Supabase המחוברים ל־MCP):

- השוואת `supabase_migrations.schema_migrations`
- בדיקות קיום: `registration_payments`, עמודות תשלום על `events`, פונקציה `get_public_event_social_signals`, עמודת `presentation_key`

---

## 1) הגדרות (חשוב לקריאה אחידה)

| מונח | משמעות בפרויקט הזה |
|--------|---------------------|
| **Local DEV** | `npm run dev` / `vite` מקומי, טוען `.env.local` ולעיתים `.env.staging.local` (ראו `vite.config.ts`, `scripts/dev/assert-browser-env.mjs`). |
| **Staging (DB + Auth)** | פרויקט Supabase ברירת־מחדל ב־`supabase/config.toml`: **`huzcvjyyyuudchnrosvx`**. |
| **Production (DB + Auth)** | פרויקט Supabase מתועד ב־ops: **`nshgmuqlivuhlimwdwhe`** (ראו `docs/ops/public-readiness-smoke-checklist.md`, `docs/ops/participant-spa-deploy.md`). |
| **Production (אפליקציה)** | דיפלוי Vercel; `VITE_*` נקבעים בזמן **build** ונשארים בתוך ה־bundle. |

> הערה: כשמשתמשים ב־"DEV מול PROD" במוצר — לרוב הכוונה היא **Local + Staging מול Production**, לא רק "מחשב מול שרת".

---

## 1ב) למה פרוד יכול “להתקדם” לפני סטייג׳ — גם כשהכל עובר דרך גיט (פוש)

**פוש לגיט מעדכן רק את קוד המקור** (קבצים, מיגרציות כקבצי SQL ב־`supabase/migrations/`).  
**הוא לא מפעיל אוטומטית** את אותן מיגרציות על **פרויקט Supabase של סטייג׳** ולא על **פרויקט Supabase של פרוד**.

לכן לגמרי אפשרי:

- מישהו הריץ שינוי **ישירות בפרוד** (SQL בקונסולה, `db push` מחובר לפרוד, תיקון חירום).
- **CI או תהליך שחרור** יישם מיגרציות לפרוד לפני שמישהו הריץ אותן לסטייג׳.
- **סטייג׳ נשאר מאחור** למרות שהקוד בגיט כבר כולל את המיגרציה — עד שמריצים את אותו יישום **מול מזהה הפרויקט של סטייג׳**.

**במילה אחת:** גיט = תוכנית משותפת; **כל בסיס נתונים** צריך **הרצה מכוונת** של אותה תוכנית. בלי זה — אין “לקיחה אוטומטית מסטייג׳ לפרוד” ברמת DB.

---

## 1ג) מודל שלוש סביבות (DEV / STAGING / PROD) — הגדרה ותהליך קידום

### מה כל סביבת אחריות

| סביבה | מה זה | למה משתמשים |
|--------|--------|----------------|
| **DEV (localhost)** | האפליקציה על המחשב + בדרך כלל DB של **סטייג׳** (לפי `vite.config` / `.env.local`) | פיתוח מהיר, ניסויים, דיבוג |
| **STAGING** | פרויקט Supabase ייעודי + (רצוי) דיפלוי Vercel **Preview** על אותו commit | בדיקות אמיתיות, E2E, אישור לפני לקוחות |
| **PROD** | פרויקט Supabase של לקוחות + דיפלוי Vercel **Production** | רק מה שאושר |

### תהליך קידום מומלץ (חד־כיווני)

1. **DEV** — פיתוח + בדיקות מקומיות מול סטייג׳ (או מול DB מקומי אם יש בעתיד).
2. **PR → merge ל־main** — הקוד והמיגרציות בגיט.
3. **STAGING** — יישום מיגרציות **רק** על פרויקט הסטייג׳ + דיפלוי Preview עם `VITE_*` של סטייג׳.
4. **בדיקות** (ידניות + E2E) על סטייג׳.
5. **PROD** — יישום **אותן** מיגרציות על פרויקט הפרוד + דיפלוי Production עם `VITE_*` של פרוד + בדיקת smoke.

### כללים שמונעים חזרה של הפער

- **אין שינוי DB בפרוד בלי שקיים אותו דבר בגיט ובסטייג׳** (חירום → מיד תיקון בגיט ואז יישור סטייג׳).
- **אחרי שינוי `VITE_*` ב־Vercel** — תמיד build+deploy מחדש לפרוד ולפריוויו.
- **לפני פרוד** — gate: השוואת מצב מיגרציות / אובייקטים קריטיים (כמו בסעיף 8 במסמך זה).

### Vercel — אותו פרויקט, שני פרויקטי Supabase (חובה)

| יעד ב־Vercel | איזה `*.supabase.co` | מזהה (ברירת מחדל בריפו) |
|---------------|----------------------|---------------------------|
| **Production** | פרויקט **PROD** בלבד | `nshgmuqlivuhlimwdwhe` |
| **Preview** + **Development** | פרויקט **STAGING** בלבד | `huzcvjyyyuudchnrosvx` |

משתני חובה בכל יעד (אותם שמות): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`.

**סנכרון:** `npm run ops:sync-vercel-vite-env` (מעודכן) מעלה **ערכים שונים** ל־Production לעומת Preview+Development — כל עוד `SUPABASE_PROJECT_REF` ≠ `STAGING_PROJECT_REF`.  
להחזרת ההתנהגות הישנה (אותו ref לכולם): `VERCEL_SUPABASE_ENV_UNIFIED=1`.

אחרי שינוי: **deploy מחדש** ל־Production ול־Preview כדי שה־bundle ייבנה מחדש.

### עד עכשיו — האם זה היה ככה?

**לרוב לא.** היה **פרויקט Vercel אחד** ל־URL הציבורי, והסקריפט הישן שם לעיתים **את אותו** `VITE_SUPABASE_*` על Production **וגם** על Preview — אז Preview לא תמיד ייצג סטייג׳ נקי, ופרוד היה יכול להיסגר עם ערכים לא נכונים אם בילדו בטעות.

**עכשיו** (ברירת מחדל חדשה בסקריפט): באותו פרויקט Vercel — Production → DB פרוד; Preview + Development → DB סטייג׳.

### למה עדיין יש פער בין לוקאל (DEV) לפרוד?

| גורם | בקצרה |
|------|--------|
| קוד | במחשב רצה גרסה עדכנית; בפרוד רצה מה ש**פורסם** לאחרונה. |
| DB | לוקאל בדרך כלל מחובר ל־**סטייג׳**; פרוד ל־**DB אחר** — סכימה ונתונים יכולים להיות שונים. |
| Build | `VITE_*` נטמעים בבילד; שינוי בלי deploy מחדש = אתר פרוד “מאחור”. |

### פרויקט Vercel נפרד לסטייג׳ (הוקם בפועל)

| | |
|--|--|
| **שם פרויקט ב־Vercel** | `social-matching-web-staging` |
| **כתובת ייצור (alias)** | https://social-matching-web-staging.vercel.app |
| **Supabase** | `huzcvjyyyuudchnrosvx` (אומת ב־bundle עם `npm run ops:verify-staging-deploy-supabase`) |
| **Git → Vercel** | הריפו `guyg1231-lab/Cursor` מחובר; **Root Directory** בפרויקט הסטייג׳ = `social-matching-web` |
| **Auth (staging DB)** | `supabase/config.toml` (פרויקט מקושר ל־staging) + `npm run ops:push-staging-supabase-config` מעדכנים Site URL / Redirect URLs ב־Supabase |

**תווית הסביבה בכותרת (`STAGING` / `PROD` / `DEV`):** נגזרת מ־**מזהה פרויקט Supabase** (`VITE_SUPABASE_PROJECT_ID` או host מ־`VITE_SUPABASE_URL`), לא מ־`import.meta.env.MODE` של Vite — אחרי `vite build` ה־MODE הוא `production` גם בדיפלוי ל־`social-matching-web-staging.vercel.app`, ולכן שימוש ב־MODE לבד היה מציג בטעות `PROD` למרות DB סטייג׳. ראו `src/lib/deployEnvBadge.ts`.

**לוקאל (DEV) מסונכרן לסטייג׳:** אותם `VITE_*` כמו ב־`.env.staging.local` או `npm run dev:staging` — אותו DB כמו האתר הסטייג׳.

**לפרוס שוב לסטייג׳ בלי לשבור את ה־link לפרוד:**  
`vercel link --yes --project social-matching-web-staging --scope team_CX08JGBHES7PtScTMGrtzAk5` → `vercel deploy --prod --yes` → להחזיר link לפרוד:  
`vercel link --yes --project social-matching-web --scope team_CX08JGBHES7PtScTMGrtzAk5`  
(או לשחזר מגיבוי `.vercel/project.json` אם שמרתם עותק.)

---

## 2) למה בכלל נוצר פער (שורשים, לפי סדר הסבירות)

1. **שתי נקודות אמת לפרויקט Supabase**  
   Staging ו־Production הם פרויקטים נפרדים; אין סנכרון אוטומטי של סכימה/נתונים.

2. **ברירת מחדל של CLI לסטייג׳**  
   `supabase/config.toml` מצביע על **`huzcvjyyyuudchnrosvx`** — פקודות כמו `supabase db push` נוטות לפגוע בסטייג׳ אלא אם מפעילים במפורש פרויקט פרוד.

3. **הרצות SQL ידניות / עורך SQL**  
   המסמכים מאפשרים יישום דרך Dashboard / SQL editor — קל ליצור **schema או נתונים** שלא משקפים את סט המיגרציות בגיט.

4. **מיגרציות עם מסלול "זמני" (018) ואז הסרה (019)**  
   אם סביבה אחת עברה רק חלק מהמסלול, תישאר **פונקציה / התנהגות** שלא קיימת באחרת.

5. **מיגרציות "שם מספר" לעומת תוכן בפועל**  
   מספר גרסה ב־`schema_migrations` לא תמיד תואם 1:1 לשם קובץ בגיט אם היו שינויים/היסטוריה; לכן חובה לאמת **אובייקטים בפועל** (טבלאות, עמודות, RPC), לא רק רשימת גרסאות.

6. **Build time לעומת runtime**  
   טעות ב־`VITE_SUPABASE_*` ב־Vercel יוצרת אתר פרוד שמדבר עם **סטייג׳** (תועד ב־`docs/ops/public-readiness-smoke-checklist.md`).

7. **E2E רץ נגד סטייג׳ עם סיסמה + service role**  
   זה לא מייצג auth/נתונים/מדיניות של פרוד — "ירוק ב־E2E" ≠ "פרוד תקין".

---

## 3) פערים מדודים כרגע (Staging ↔ Prod DB)

### 3.1 היסטוריית מיגרציות (`schema_migrations`)

- **בסטייג׳** מופיעות גרסאות כולל **`018_host_submit_gathering_rpc`** ו־**`018_host_submit_gathering_rpc_dev_shortcut`** (שני רישומים תחת קידומת 018 שונים), וללא רצף שמקביל לפרוד סביב תשלום/סיגנלים חברתיים.
- **בפרוד** מופיעים במפורש **`015_payment_foundation_schema`**, **`016_payment_foundation_rpcs`**, **`019_drop_host_submit_gathering_dev_shortcut`**, **`020_public_event_social_signals`**, וכן **`011_fix_internal_offer_queue_ambiguity`** — חלקם **לא** מופיעים בהיסטוריית הסטייג׳ שנמדדה.

### 3.2 אובייקטים בפועל (אימות SQL)

| בדיקה | Staging | Prod |
|--------|---------|------|
| טבלת `registration_payments` | לא | כן |
| עמודות תשלום על `events` (`payment_required` וכו') | לא | כן |
| `get_public_event_social_signals` | לא | כן |
| `events.presentation_key` | כן | כן |

**מסקנה מוצרית:** אותו קוד frontend שמניח תשלום או social signals עלול **לעבוד בפרוד ולהיכשל או להתנהג אחרת בסטייג׳** (או להפך אם יבוצעו שינויים עתידיים רק בסביבה אחת).

---

## 4) מפת מיגרציות בגיט (מקור אמת לקוד)

כל הקבצים תחת `supabase/migrations/` (סדר לוגי):

| קובץ | תכלית בשורה אחת |
|------|------------------|
| `001_base_enums.sql` | טיפוסי enum ליבה + הרחבות בסיס. |
| `002_core_identity_tables.sql` | `profiles`, `matching_responses`, זהות משתמש. |
| `003_events.sql` | טבלת `events` ומחזור חיים. |
| `004_event_registrations.sql` | הרשמות, סטטוסים, חלונות הצעה. |
| `005_email_templates_queue_message_logs.sql` | תבניות מייל, תור, לוגים. |
| `006_constraints_and_indexes.sql` | אילוצים ואינדקסים. |
| `007_triggers_and_helper_functions.sql` | טריגרים ופונקציות עזר (כולל `is_admin`). |
| `008_rls.sql` | RLS ומדיניות גישה. |
| `009_app_called_rpcs.sql` | RPCים לזרימות האפליקציה. |
| `010_internal_queue_ops_helpers.sql` | עזרי תור פנימיים / service. |
| `011_fix_internal_offer_queue_ambiguity.sql` | תיקון עמימות ב־`internal_offer_registration_with_timeout`. |
| `012_fix_internal_offer_enqueue_aliases.sql` | תיקון aliases ב־enqueue. |
| `013_fix_enqueue_email_queue_on_conflict_ambiguity.sql` | תיקון ON CONFLICT ב־`enqueue_email_queue`. |
| `014_pick_next_refill_include_pending.sql` | לוגיקת refill כולל pending/waitlist. |
| `015_payment_foundation_schema.sql` | בסיס תשלום: עמודות אירוע + `registration_payments`. |
| `016_payment_foundation_rpcs.sql` | חיבור RPCים לכללי תשלום. |
| `017_vertical_slice_registration_rpcs.sql` | decline / attended וכו' לסלייס אנכי. |
| `018_host_submit_gathering_rpc_dev_shortcut.sql` | קיצור dev (לא חוזה פרוד). |
| `019_drop_host_submit_gathering_dev_shortcut.sql` | הסרת הקיצור לאחר מסלול אדמין. |
| `020_public_event_social_signals.sql` | `get_public_event_social_signals` לציבור. |
| `021_prod_hardening_indexes_search_path.sql` | אינדקסים + `search_path` לפונקציות. |
| `022_event_presentation_key.sql` | `presentation_key` לאירועים. |

---

## 5) פערים: Local DEV ↔ Production (אפליקציה)

| נושא | סיכון | מה לבדוק |
|------|--------|-----------|
| `VITE_SUPABASE_*` בזמן build | גבוה | `npm run ops:verify-deploy-supabase`, `scripts/ops/verify-deployed-supabase-project.mjs` |
| `.env.local` דורס `.env.production.local` ב־`vite build` | גבוה | `vite.config.ts` — סדר טעינה |
| Preview ב־Vercel בלי env | בינוני | `docs/ops/participant-spa-deploy.md` |
| אירועים מזויפים ב־localhost בלבד | נמוך־בינוני | `src/features/events/api.ts` — `shouldInjectCuratedDevEvents` |
| תיעוד מול קוד: `VITE_ENABLE_HOST_DEV_SHORTCUT` | בינוני | מופיע בתיעוד/SQL; **לא נמצא שימוש ב־TS** — סיכון תיאור שגוי |

---

## 6) פערים: E2E (Staging) ↔ Production

| נושא | פירוט |
|------|--------|
| Auth | E2E: סיסמה + session מזויף; פרוד: OTP / מדיניות שונה. |
| Service role | קיים ב־E2E לצורך ניקוי/עדכון DB — **אסור** בדפדפן פרוד. |
| נתונים | אירועי slice, משתמשי validation — לא קיימים בפרוד. |
| תיעוד מול קבצים | `docs/ops/admin-review-slice.md` מתייחס ל־`e2e/slice-admin-review.spec.ts` — לוודא אם הקובץ קיים/שונה שם. |

---

## 7) רשימת יישור מלאה (Runbook) — סדר ביצוע

### שלב A — הקפאה והכנה

- [ ] **A1** הקפאת שינויי סכימה בשני הפרויקטים לחלון היישור.
- [ ] **A2** גיבוי / snapshot לפרוד לפני שינוי (לפי מדיניות הארגון).
- [ ] **A3** ייצוא `schema_migrations` משני הפרויקטים לקובץ text והשוואה.

### שלב B — יישור סכימה: Staging ← אל מצב היעד (Prod כרגע)

> יעד: שסטייג׳ יכיל לפחות את אותם **אובייקטים** שפרוד משתמש בהם לזרימות המוצר (לא בהכרח אותה **גרסת מיגרציה** בטבלת ההיסטוריה).

- [ ] **B1** יישום חסרים לפי הגיט, בסדר עולה, **רק מה שחסר בסטייג׳**:
  - `011_fix_internal_offer_queue_ambiguity.sql` (אם חסר לפי בדיקת RPC/היסטוריה)
  - `015_payment_foundation_schema.sql`
  - `016_payment_foundation_rpcs.sql`
  - `019_drop_host_submit_gathering_dev_shortcut.sql` (אם עדיין קיימת פונקציית shortcut)
  - `020_public_event_social_signals.sql`
- [ ] **B2** אחרי כל קובץ: הרצת בדיקות הקיום בסעיף 8 (Acceptance).
- [ ] **B3** אם קיימת בסטייג׳ מיגרציה "נוספת" שלא בפרוד (למשל `018_host_submit_gathering_rpc` בהיסטוריה): **לא למחוק ידנית** שורות ב־`schema_migrations` בלי החלטת ארכיטקט; לעיתים עדיף **מיגרציית ניקוי קדימה** (forward-only) שמבטיחה end-state.

### שלב C — יישור אפליקציה (Vercel)

- [ ] **C1** וידוא `VITE_SUPABASE_URL` + מפתח publishable ב־Production **ופריוויו**.
- [ ] **C2** build חדש אחרי שינוי env (הערכים נטמעים בבילד).
- [ ] **C3** הרצת `npm run ops:verify-deploy-supabase` על URL הפרוד.
- [ ] **C3b** הרצת `npm run ops:verify-staging-deploy-supabase` על הדומיין הסטייג׳ (`social-matching-web-staging.vercel.app`).
- [ ] **C3c** אחרי שינוי `supabase/config.toml` ל־Auth: `npm run ops:push-staging-supabase-config` (פרויקט מקושר ל־`huzcvjyyyuudchnrosvx`).

### שלב D — יישור תיעוד וכלים

- [ ] **D1** ליישר `docs/ops/admin-review-slice.md` עם שמות קבצי E2E בפועל.
- [ ] **D2** להחליט אם `VITE_ENABLE_HOST_DEV_SHORTCUT` נשאר בתיעוד או נמחק/מסומן כהיסטורי.
- [ ] **D3** `supabase gen types` מול הפרויקט שממנו מייצרים types ל־PR (בדרך כלל staging) — לתעד מתי חייבים לסנכרן מול prod.

### שלב E — אימות מוצרי (Smoke) אחרי יישור

- [ ] **E1** `/auth` + OTP (פרוד) / password (סטייג׳ לפי הגדרה).
- [ ] **E2** `/questionnaire` — שמירה; מייל נעול למשתמש מחובר (שינוי קוד אחרון).
- [ ] **E3** `/events` — טעינה + social signals אם מופעל בקוד.
- [ ] **E4** apply → offer → confirm (כולל RPCים מ־`src/features/applications/api.ts`, `src/features/admin/api.ts`).
- [ ] **E5** `/admin/event-requests` — אישור אירוע host → פרסום.

---

## 8) קריטריוני קבלה (Acceptance) — SQL לבדיקה

```sql
-- תשלום
select to_regclass('public.registration_payments') is not null as has_registration_payments;
select exists(
  select 1 from information_schema.columns
  where table_schema='public' and table_name='events' and column_name='payment_required'
) as events_has_payment_required;

-- social signals
select exists(
  select 1 from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname='public' and p.proname='get_public_event_social_signals'
) as has_public_social_signals;

-- presentation
select exists(
  select 1 from information_schema.columns
  where table_schema='public' and table_name='events' and column_name='presentation_key'
) as has_presentation_key;

-- shortcut removal
select exists(
  select 1 from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname='public' and p.proname='host_submit_gathering_dev_shortcut'
) as dev_shortcut_still_exists; -- צפי: false בשתי הסביבות אחרי 019
```

**קריטריון הצלחה ליישור סטייג׳→פרוד:** ערכי השורה האחרונה זהים בין הסביבות לכל הבדיקות למעלה (כולל `dev_shortcut_still_exists = false`).

---

## 9) Rollback וסיכונים

- מעדיפים **תיקון קדימה** (מיגרציה חדשה idempotent) על פני מחיקת היסטוריה.
- שינויי תשלום עלולים להשפיע על אירועים קיימים — לבדוק `payment_required` / `price_cents` לפני הפעלה בפרוד.
- אחרי יישור סכימה: לבדוק שוב **RLS** ו־**grants** על RPCים ציבוריים (`020`).

---

## 10) ניהול שוטף (מניעת חזרת drift)

- [ ] כל שינוי סכימה: PR + יישום ל**סטייג׳** → smoke → רק אז **פרוד**.
- [ ] איסור שינוי DDL ידני בפרוד בלי מיגרציה מקבילה בגיט.
- [ ] צ'קליסט שחרור: השוואת `schema_migrations` + שאילתות סעיף 8.
- [ ] CI: בדיקה ש־`npm run build` לא משתמש בערכי placeholder ל־`VITE_SUPABASE_*` (סקריפטים קיימים בריפו).

---

## 11) נספח — מזהי פרויקט (למניעת טעויות אנוש)

| סביבה | Project ref (מתוך מסמכי הריפו) |
|--------|--------------------------------|
| Staging | `huzcvjyyyuudchnrosvx` |
| Production | `nshgmuqlivuhlimwdwhe` |

---

## 12) מעקב שינויים במסמך הזה

| גרסה | תאריך | שינוי |
|--------|--------|--------|
| 1.0 | 2026-04-24 | יצירה ראשונה לפי סאב־אייגנטים + אימות DB |
| 1.1 | 2026-04-24 | Git ל־Vercel סטייג׳; `config.toml` + `config push` ל־Auth סטייג׳; סקריפטים `ops:verify-staging-deploy-supabase` / `ops:push-staging-supabase-config`; תווית כותרת לפי ref Supabase (`deployEnvBadge`) |
