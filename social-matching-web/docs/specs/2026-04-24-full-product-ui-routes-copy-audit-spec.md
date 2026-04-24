# SPEC — מיפוי מלא: מסלולים, דפים, טקסטים, מקור מחרוזת, שינויים אחרונים

**תאריך:** 2026-04-24  
**מטרה:** תיעוד אחד שמאפשר **סנכרון מלא** בין סביבות, גרסאות, ושפות — ולהבין למה משתמשים רואים דברים שונים בין Vercel לבין localhost.

**תגיות בשימוש במסמך**

| תג | משמעות |
|----|--------|
| `[TAG:ROUTE]` | נתיב ורכיב ב־Router |
| `[TAG:GUARD]` | הגנה על נתיב (מחובר / אדמין) |
| `[TAG:PAGE]` | קובץ דף תחת `src/pages/` |
| `[TAG:COPY-H]` | מחרוזת בעברית קשיחה בקוד (לא `t()`) |
| `[TAG:COPY-T]` | מחרוזת דרך `t()` מ־`locales/*` |
| `[TAG:COPY-LOCAL]` | מחרוזות מקומיות בקומפוננטה (למשל `ProfileBaseQuestionnaire` עם בלוק he/en) |
| `[TAG:I18N-GAP]` | פער שפה / אין מפתח ב־locales |
| `[TAG:ENV]` | תלוי סביבה / build / משתני סביבה |
| `[TAG:HISTORY]` | שינוי אחרון ב־git (מתוך 40 הקומיטים האחרונים שנסרקו) |

**מקור המידע:** ארבעה סאב־אייגנטים (קריאה בלבד) — Router+דפים, השוואת locales מול hardcode, `git log`, ומעטפת (Header / Auth / Theme).

---

## 1) סיכום מנהלים

- יש **רשימת נתיבים מלאה** עם רכיב ו־guard — סעיף 2.  
- `he.ts` ו־`en.ts` **מסונכרנים מפתחות** (אותו מספר מפתחות); אבל **רוב המוצר לא משתמש בהם** — סעיף 4.  
- **Auth ורוב הדפים** — טקסט בעברית **קשיח** בקובץ; זה מסביר בקלות פערים בין **פריסה ישנה** לבין **בילד מקומי חדש**.  
- **תג סביבה:** תג `DEV` / מזהה פרויקט בכותרת תלוי ב־`MODE` ו־`VITE_SUPABASE_PROJECT_ID` — סעיף 5.

---

## 2) `[TAG:ROUTE]` — כל הנתיבים (מקור: `AppRouter.tsx`)

> `routeManifest.ts` הוא **תיעוד בלבד**; בזמן ריצה רק `AppRouter` קובע נתיבים ו־guards.

| path | component | `[TAG:GUARD]` | הערות |
|------|-----------|---------------|--------|
| `/` | `LandingPage` | — | נחיתה |
| `/privacy` | `PrivacyPage` | — | `[TAG:COPY-H]` עיקרי |
| `/terms` | `TermsPage` | — | `[TAG:COPY-H]` עיקרי |
| `/auth` | `AuthPage` | — | OTP; `[TAG:COPY-H]` כמעט כולו |
| `/sign-in` | `AuthPage` | — | alias ל־`/auth` |
| `/auth/callback` | `AuthCallbackPage` | — | `[TAG:COPY-H]` |
| `/gathering/:eventId` | `GatheringPage` | — | `[TAG:COPY-H]` |
| `/events` | `EventsPage` | — | `[TAG:COPY-H]` |
| `/events/demo-experiences` | `EventsExperiencesDemoPage` | — | דמו; **לא** ב־`routeManifest` (תיעוד) |
| `/events/propose` | `EventProposalPage` | מחובר | מתוך `HostEventsPage.tsx` |
| `/events/:eventId` | `EventDetailPage` | — | `[TAG:COPY-H]` |
| `/events/:eventId/apply` | `ApplyPage` | מחובר | `[TAG:COPY-H]` כבד |
| `/questionnaire` | `QuestionnairePage` | — | שילוב `[TAG:COPY-T]` + קומפוננטה |
| `/dashboard` | `DashboardPage` | מחובר | `[TAG:COPY-H]` |
| `/host/events` | `HostEventsPage` | מחובר | `[TAG:COPY-H]` |
| `/host/events/:eventId/registrations` | `HostEventRegistrationsPage` | מחובר | stub |
| `/host/events/:eventId/communications` | `HostEventCommunicationsPage` | מחובר | stub |
| `/host/events/:eventId/follow-up` | `HostEventFollowUpPage` | מחובר | stub |
| `/host/events/:eventId` | `HostEventWorkspacePage` | מחובר | stub |
| `/admin` | `AdminHomePage` | אדמין | redirect ל־`/admin/events` |
| `/admin/events` | `OperatorEventsListPage` | אדמין | `[TAG:COPY-H]` |
| `/admin/event-requests` | `AdminEventRequestsPage` | אדמין | `[TAG:COPY-H]` |
| `/admin/events/new` | `OperatorEventCreatePage` | אדמין | `[TAG:COPY-H]` |
| `/admin/events/:eventId/diagnostics` | `OperatorEventDiagnosticsPage` | אדמין | stub |
| `/admin/events/:eventId/audit` | `OperatorEventAuditPage` | אדמין | stub |
| `/admin/events/:eventId` | `OperatorEventDashboardPage` | אדמין | `[TAG:COPY-H]` כבד |
| `/team/gathering/:eventId` | `TeamGatheringPage` | אדמין | `[TAG:COPY-H]` |
| `*` | `Navigate` → `/` | — | catch-all |

---

## 3) `[TAG:PAGE]` — טבלת דפים (מטרה בשורה אחת)

| קובץ | מטרה |
|------|--------|
| `src/pages/landing/LandingPage.tsx` | נחיתה שיווקית; `[TAG:COPY-T]` |
| `src/pages/legal/PrivacyPage.tsx` | טיוטת מדיניות; `[TAG:COPY-H]` |
| `src/pages/legal/TermsPage.tsx` | טיוטת תנאים; `[TAG:COPY-H]` |
| `src/pages/events/EventsPage.tsx` | רשימת אירועים חיים |
| `src/pages/events/EventDetailPage.tsx` | פרטי אירוע + סטטוס הגשה |
| `src/pages/events/EventsExperiencesDemoPage.tsx` | דמו ללא API |
| `src/pages/apply/ApplyPage.tsx` | זרימת הגשה מלאה |
| `src/pages/questionnaire/QuestionnairePage.tsx` | שאלון בסיס; עטיפת `[TAG:COPY-T]` |
| `src/pages/dashboard/DashboardPage.tsx` | דשבורד משתתף |
| `src/pages/gathering/GatheringPage.tsx` | מפגש / deep link |
| `src/pages/auth/AuthPage.tsx` | התחברות OTP |
| `src/pages/auth/AuthCallbackPage.tsx` | callback אחרי auth |
| `src/pages/host/HostEventsPage.tsx` | מארח + `EventProposalPage` |
| `src/pages/host/HostEventWorkspacePage.tsx` | placeholder |
| `src/pages/host/HostEventRegistrationsPage.tsx` | placeholder |
| `src/pages/host/HostEventCommunicationsPage.tsx` | placeholder |
| `src/pages/host/HostEventFollowUpPage.tsx` | placeholder |
| `src/pages/admin/AdminHomePage.tsx` | redirect בלבד |
| `src/pages/admin/AdminEventRequestsPage.tsx` | תור אישור מארח |
| `src/pages/admin/OperatorEventsListPage.tsx` | רשימת אירועים למפעיל |
| `src/pages/admin/OperatorEventCreatePage.tsx` | יצירת אירוע |
| `src/pages/admin/OperatorEventDashboardPage.tsx` | לוח אירוע מפעיל |
| `src/pages/admin/OperatorEventDiagnosticsPage.tsx` | placeholder |
| `src/pages/admin/OperatorEventAuditPage.tsx` | placeholder |
| `src/pages/admin/TeamGatheringPage.tsx` | מפגש צוות |

**מסקנה:** אין קבצי `src/pages/` “יתומים” שלא מחוברים ל־Router.

---

## 4) `[TAG:I18N-GAP]` — מפתחות `locales` מול מה שהמשתמש באמת רואה

### 4.1 שוויון מפתחות `he.ts` ↔ `en.ts`

- **אין פער מפתחות:** אותו סט מפתחות בשתי השפות (הסאב־אייגנט ספר ~70 מפתחות זהים).

### 4.2 איפה בפועל משתמשים ב־`t()` ב־`src/pages/`

- בעיקר: **`LandingPage`**, **`QuestionnairePage`** (ועטיפות משותפות כמו `PageShell` / `AppHeader` שמושכות `t()`).

### 4.3 איפה רוב הטקסטים — `[TAG:COPY-H]` או `[TAG:COPY-LOCAL]`

| אזור | תיאור `[TAG:I18N-GAP]` |
|------|-------------------------|
| `ApplyPage`, `AuthPage`, אירועים, מארח, אדמין | עברית ארוכה בקוד; **החלפת שפה באפליקציה כמעט לא מתרגמת** את המסכים האלה דרך `en.ts` |
| `ProfileBaseQuestionnaire.tsx` | `[TAG:COPY-LOCAL]`: מפה מקומית `copy.he` / `copy.en` — לא מפתחות ב־`locales` |
| `src/features/*` (כרטיסי אירוע, סטטוסים, שגיאות API) | עברית / אנגלית מעורבת בקבצים; שגיאות API לפעמים **אנגלית** קשיחה |

**משמעות לסנכרון “מלא”:** איחוד שפה אמיתי דורש או **להעביר מחרוזות ל־locales**, או **להחליט במפורש** שעברית-only בדפים מסוימים ואז לכבות EN למסכים האלה.

---

## 5) `[TAG:ENV]` — מעטפת: Header, ניווט, שפה, ערכת נושא, Auth

### 5.1 `AppHeader` — מקור טקסט

| אלמנט | תנאי | מקור |
|--------|------|------|
| לוגו `aria-label` | תמיד | `[TAG:COPY-T]` `navHome` |
| אירועים / פרופיל(שאלון) / דשבורד | מצב default, מסך בינוני+ | `[TAG:COPY-T]` |
| מארח | `user` | `[TAG:COPY-T]` |
| אדמין | `isAdmin` | `[TAG:COPY-T]` |
| תג סביבה | `MODE !== 'production'` **או** `VITE_SUPABASE_PROJECT_ID` לא ריק | `[TAG:COPY-H]` לתווית `DEV`/`STAGING`/`PROD` + מזהה |
| כניסה / יציאה | לפי `user` | `[TAG:COPY-T]` |

### 5.2 `MobileBottomNav`

| אלמנט | מקור |
|--------|------|
| שלושת הטאבים | `[TAG:COPY-T]` — ללא תלות `user`/`MODE` |

### 5.3 `PageShell`

| אלמנט | מקור |
|--------|------|
| “דלג לתוכן” | `[TAG:COPY-T]` |
| כותרת/תת־כותרת של גיבור | **מהפרופס** — לא `t()` פנימית |

### 5.4 `ThemeToggle` / `LanguageToggle`

| אלמנט | מקור |
|--------|------|
| בהיר / כהה | `[TAG:COPY-T]` |
| `EN` / `עב` על הכפתור | `[TAG:COPY-H]` (קוד קבוע) |

### 5.5 `AuthPage` (חשוב לפער Vercel מול localhost)

| אלמנט | מקור | `[TAG:ENV]` |
|--------|------|----------------|
| כותרת ותת־כותרת של `PageShell` | `[TAG:COPY-H]` | תלוי **גרסת build** |
| גוף כרטיס OTP | `[TAG:COPY-H]` | תלוי גרסה |
| “היעד שנשמר…” | מוצג רק אם יש `returnTo` / ערך שמור | **התנהגות** — ב־Vercel לעיתים יש query, ב־localhost לעיתים לא |
| “חזרה למפגשים” | `[TAG:COPY-H]` | — |
| `MobileBottomNav` | **לא** מוצג ב־`/auth` | שונה מדפי משתתף |

---

## 6) `[TAG:HISTORY]` — קומיטים אחרונים (40) עם השפעה על UI / טקסט / נתיבים

> רשימה מצומצמת מה שדווח על ידי הסאב־אייגנט; לפרטים מלאים: `git log` + `git show`.

| קומיט (קצר) | קבצים עיקריים | השפעה על המשתמש |
|-------------|----------------|------------------|
| `47a904d` | רבים כולל `AuthPage`, דפים, `locales` | איחוד קול Circles — **שינויי ניסוח רחבים** |
| `cbe9ecd` | שאלון, locales, Apply, Dashboard, Host | חידוד טקסטי פרופיל/כוונה |
| `1595cad` | `AppRouter`, דמו חוויות | נתיב דמו חדש |
| `5247b0c` | `ProfileBaseQuestionnaire` | fail-open כשסכימת פרוד לא זמינה |
| `61e62b5` | `AppHeader` | זהות ויזואלית / env guardrails |
| `259a400` | מעטפת + אירועים + apply | מפת מובייל / sheet |
| `0db3e0f` | `ApplyPage` | משוב אחרי אירוע |
| `d3025ae` | `OperatorEventDashboardPage` | סיכום הקצאות אדמין |
| … | (רשימה מלאה בסעיף גלם מהסאב־אייגנט) | |

**קומיטים ב־40 שלא נגעו בנתיבים שביקשנו:** חלק מ־`docs:` ו־migrations — לא מפורטים כאן כטקסט UI.

---

## 7) תוכנית סנכרון **מלאה** (מוצר + פריסה + DB + עותק)

### שלב 1 — “מה רץ באמת”

- [ ] לוודא ש־Vercel Production בנוי מ־**אותו commit** כמו מה שאתה בודק ב־`localhost:4173`.
- [ ] להריץ את סקריפט אימות הפרויקט (`ops:verify-deploy-supabase` לפי `package.json`) על URL הפרוד.

### שלב 2 — DB (כבר מתועד ב־SPEC אחר)

- [ ] ליישר Staging ל־Prod לפי `docs/specs/2026-04-24-dev-staging-vs-prod-environment-parity-spec.md`.

### שלב 3 — טקסט ושפה (מוצר)

- [ ] להחליט מדיניות: **עברית-only** למסכים מסוימים **או** להעביר מחרוזות ל־`locales` + `t()`.
- [ ] לתעד רשימת `[TAG:COPY-H]` לפי דף ולתת בעלות (מארח / משתתף / אדמין).

### שלב 4 — מניעת פערי “אותו URL, תוכן שונה”

- [ ] לאחר כל שינוי `VITE_*`: **build + deploy** חדש.
- [ ] לנקות בדיקות: להשוות `returnTo` ב־URL כשמשווים Auth.

### שלב 5 — איכות מתמשכת

- [ ] בדיקת regression ויזואלית קצרה לפי **טבלת סעיף 2** (עמודה: path).
- [ ] Gate לפני פרוד: “אין drift בסכימה” + “אין placeholder ב־Supabase env בבילד”.

---

## 8) גבולות המסמך (כנות)

- **לא** נסרקו אוטומטית **כל** מחרוזות בכל שורה בכל קובץ TSX — זה ייצור מסמך אלפי שורות ולא ניתן לתחזוקה.  
- כן נסרקו: **כל הנתיבים**, **כל קבצי הדפים**, **מלאי מפתחות locales**, **דפוסי hardcode עיקריים**, **מעטפת ניווט**, **היסטוריית git רלוונטית**.  
- להשלמת “תיוג כל מחרוזת בכל קובץ” צריך כלי אוטומציה (סקריפט AST) — אפשר להגדיר כמשימת המשך.

---

## 9) מעקב גרסה למסמך זה

| גרסה | תאריך | שינוי |
|--------|--------|--------|
| 1.0 | 2026-04-24 | יצירה — איחוד ארבעה סאב־אייגנטים |
