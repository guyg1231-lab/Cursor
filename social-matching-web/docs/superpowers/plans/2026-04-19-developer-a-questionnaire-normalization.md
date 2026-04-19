# /questionnaire Normalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring `/questionnaire` to spec §8.3 "functional placeholder" compliance and §10.1 "canonical readiness completion route" by adding a Hebrew-only anonymous sign-in CTA, Hebrew display labels for English-keyed chip options, success-state CTAs to `/events` + `/dashboard`, a `RouteErrorState` for remote load failures, and a Playwright foundation gate — all inside Dev A scope (no foundation or shared-component edits).

**Architecture:** `QuestionnairePage.tsx` gains an auth-aware anonymous banner above the existing `<ProfileBaseQuestionnaire />` and a success-state CTA row after the last step. `ProfileBaseQuestionnaire.tsx` gains a Hebrew display-label map for the English-keyed `interestOptions`, `socialStyleOptions`, `rechargeOptions`, `meetingPriorityOptions`, `languageOptions`, `matchPreferenceOptions`, `motivationOptions` (DB-persisted VALUES stay English — display-only mapping). Remote-load error already sets a Hebrew `error` string in local state; we escalate to `RouteErrorState` rendered from `QuestionnairePage` via an exposed minimal callback/status prop (or via lifting the fetch, see Task 3 notes). Playwright foundation tests go in `e2e/participant-foundation.spec.ts`.

**Tech stack:** React 18, TypeScript, React Router 6, Tailwind, Supabase JS, Playwright.

**Spec alignment:** §8.3 Definition of a Functional Placeholder (route entry ✓ existing, correct auth/role gating — DECISION BELOW, clear title/purpose, loading/empty/error, ≥1 primary action, adjacent-page links, documented owner, explicit exit criteria) and §10.1 `/questionnaire` ("Existing and keep"; "remain the canonical readiness completion route; expose enough state that users understand whether they are ready to apply").

---

## Branch / stacked PR context

Implement on **`dev-a/questionnaire-normalization`**, stacked from **`dev-a/gathering-landing-polish`** (not `main`). Reconcile with the polish branch tip before executing tasks.

---

## Q1 Decision (guard mismatch resolution)

The user chose **option (c)**:

- Keep **`/questionnaire`** as **`auth: 'public'`** in the route manifest. The foundation manifest file is **out of bounds** for this pass anyway; do not edit it.
- Keep the existing **graceful-degradation persistence** behavior inside `ProfileBaseQuestionnaire` unchanged (anonymous users continue with local draft + cloud sync only when signed in).
- **Formalize the anonymous experience** by adding a **visible Hebrew sign-in CTA** on `QuestionnairePage` when `useAuth().user` is `null`.

**Why this stays inside Dev A scope (2–3 sentences):** No edits to `routeManifest.ts`, `AppRouter.tsx`, or `guards.tsx` are required to ship the decision: the page already loads for anonymous visitors and degrades cleanly—remote Supabase load runs only when `user` is present (`ProfileBaseQuestionnaire.tsx` around line 274), `saveDraft` / `persistProfile` branch on `user` for cloud writes vs local-only messaging (lines 396–403, 415–418), and anonymous submit surfaces `saveLocalOnly` instead of cloud upsert (lines 438–439). Document this decision explicitly in `docs/participant-routing.md` as part of Task 6.

---

## Scope rules (non-negotiable)

Forbidden files for this plan (do not modify):

- `src/app/router/routeManifest.ts`
- `src/app/router/AppRouter.tsx`
- `src/app/router/guards.tsx`
- Anything under `src/components/shared/*` (may import only)
- `src/features/applications/status.ts`, `src/features/applications/api.ts`, `src/features/applications/components/ApplicationStatusPanel.tsx` (frozen API)
- Host/admin pages
- `e2e/foundation-routes.spec.ts`, `e2e/slice-happy-path.spec.ts`, `e2e/slice-decline-path.spec.ts`, `e2e/slice-admin-review.spec.ts`
- Do NOT rename or alter DB persisted values for questionnaire chip options (`Music`, `Art`, `Initiator`, etc.). Display-only localization.

User-facing copy: Hebrew only.

E2E: extend `e2e/participant-foundation.spec.ts` only.

Playwright TS loader cannot resolve `@/*` aliases in `e2e/` — use relative imports.

---

## File map

- **Modify:** `src/pages/questionnaire/QuestionnairePage.tsx` — add `useAuth`, anonymous-banner `Card`, success-state CTA row using `Button asChild` + `Link`, and render `RouteErrorState` when the child surfaces a remote-load error (see Task 4). Import `RouteErrorState` from `@/components/shared/RouteState` (import-only; do not edit `RouteState.tsx`).
- **Modify:** `src/features/profile/ProfileBaseQuestionnaire.tsx` — add Hebrew display-label `Record` maps; render `displayLabels[option]` inside `<ChoiceChip>` while keeping `form` values as English keys; add optional `onLoadError?: (hasError: boolean) => void` and `onSaved?: () => void` props (additive).
- **Modify:** `src/locales/he.ts` and `src/locales/en.ts` — new questionnaire keys (including `questionnaireLoadErrorTitle`); update `questionnaireSubtitle`.
- **Modify:** `docs/participant-routing.md` — append § "Readiness route — `/questionnaire`" (≤ 12 lines).
- **Modify:** `e2e/participant-foundation.spec.ts` — anonymous banner, authenticated chip labels, load-failure `RouteErrorState`, success CTAs (with documented brittleness / `test.skip` path), optional §13.2 serial workflow.

---

## Task 1 — i18n keys for the new copy

**Files:** `src/locales/he.ts`, `src/locales/en.ts`

`TranslationKey` is `keyof typeof he` (`src/lib/i18n.ts`), so **any reference to a missing key in real TypeScript code fails `npm run typecheck`**. `t()` is therefore type-safe for keys present on `he`.

- [ ] **Step 1: Failing typecheck gate (RED)**  
  Add a temporary compile-only gate file (delete in Task 1 Step 3 after keys exist):

  ```typescript
  // src/pages/questionnaire/questionnaireTranslationKeyGate.ts
  import type { TranslationKey } from '@/lib/i18n';

  export const QUESTIONNAIRE_I18N_KEYS = [
    'questionnaireAnonymousBannerTitle',
    'questionnaireAnonymousBannerBody',
    'questionnaireAnonymousBannerCta',
    'questionnaireSuccessTitle',
    'questionnaireSuccessBody',
    'questionnaireGotoEvents',
    'questionnaireGotoDashboard',
    'questionnaireLoadErrorTitle',
    'questionnaireLoadError',
  ] as const satisfies readonly TranslationKey[];
  ```

  Until `he.ts` contains every listed key, TypeScript errors on the `satisfies readonly TranslationKey[]` clause.

- [ ] **Step 2: Run typecheck — expect failure**  

  ```bash
  cd social-matching-web
  npm run typecheck
  ```

  Expected: failure on unknown string literals not assignable to `TranslationKey`.

- [ ] **Step 3: Minimal implementation (GREEN)**  
  1. Add all keys to **`src/locales/he.ts`** (replace `questionnaireSubtitle`; insert new keys next to existing questionnaire keys). Hebrew copy:

  ```typescript
  questionnaireTitle: 'שאלון בסיס לפרופיל',
  questionnaireSubtitle: 'השאלון עוזר לנו לבנות את הקבוצה הנכונה עבורך. ההתקדמות נשמרת אוטומטית.',
  questionnaireAnonymousBannerTitle: 'רוצים לשמור את התשובות בחשבון?',
  questionnaireAnonymousBannerBody:
    'אפשר למלא את השאלון גם בלי להתחבר — התשובות יישמרו מקומית. כדי שנוכל להתאים אותך למפגשים ולשמור את הפרופיל לענן, יש להתחבר.',
  questionnaireAnonymousBannerCta: 'להתחברות',
  questionnaireSuccessTitle: 'הפרופיל נשמר. מה הלאה?',
  questionnaireSuccessBody: 'אפשר לגשת עכשיו למפגשים או לחזור לאזור האישי.',
  questionnaireGotoEvents: 'לצפייה במפגשים',
  questionnaireGotoDashboard: 'לאזור האישי',
  questionnaireLoadErrorTitle: 'שגיאת טעינה',
  questionnaireLoadError: 'לא הצלחנו לטעון את הנתונים השמורים. אפשר לרענן ולנסות שוב.',
  ```

  2. Mirror meaning in **`src/locales/en.ts`** (dev-facing English; production defaults to Hebrew per spec):

  ```typescript
  questionnaireTitle: 'Profile Base Questionnaire',
  questionnaireSubtitle:
    'The questionnaire helps us build the right group for you. Your progress is saved automatically.',
  questionnaireAnonymousBannerTitle: 'Want to keep your answers on your account?',
  questionnaireAnonymousBannerBody:
    'You can complete the questionnaire without signing in — answers are saved locally. To match you to gatherings and save your profile to the cloud, sign in.',
  questionnaireAnonymousBannerCta: 'Sign in',
  questionnaireSuccessTitle: 'Profile saved. What next?',
  questionnaireSuccessBody: 'You can go to gatherings now or return to your personal area.',
  questionnaireGotoEvents: 'View gatherings',
  questionnaireGotoDashboard: 'Personal area',
  questionnaireLoadErrorTitle: 'Load error',
  questionnaireLoadError: 'We could not load your saved data. Refresh and try again.',
  ```

  3. Delete `src/pages/questionnaire/questionnaireTranslationKeyGate.ts`.

- [ ] **Step 4: Verify**  

  ```bash
  cd social-matching-web
  npm run typecheck
  ```

  Expected: PASS.

- [ ] **Step 5: Commit**  

  ```bash
  git add src/locales/he.ts src/locales/en.ts
  git commit -m "feat(i18n): add questionnaire anonymous and success copy"
  ```

---

## Task 2 — Anonymous sign-in banner on `QuestionnairePage`

**Files:** `src/pages/questionnaire/QuestionnairePage.tsx`, `e2e/participant-foundation.spec.ts`

- [ ] **Step 1: Failing Playwright test (RED)**  
  Append to `e2e/participant-foundation.spec.ts` (use **relative** imports only inside `e2e/`):

  ```typescript
  test('questionnaire: anonymous visitor sees Hebrew sign-in banner with link to /auth', async ({ page }) => {
    await page.goto('/questionnaire');
    await expect(page.getByRole('heading', { level: 1, name: /שאלון/ })).toBeVisible();
    await expect(page.getByText('רוצים לשמור את התשובות בחשבון?', { exact: true })).toBeVisible();
    await expect(
      page.getByText('אפשר למלא את השאלון גם בלי להתחבר', { exact: false }),
    ).toBeVisible();
    const cta = page.getByRole('link', { name: 'להתחברות' });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/auth');
  });
  ```

- [ ] **Step 2: Run test — expect failure**  

  ```bash
  cd social-matching-web
  npx playwright test e2e/participant-foundation.spec.ts --project=chromium -g "anonymous visitor"
  ```

  Expected: FAIL (locators not found until banner exists).

- [ ] **Step 3: Minimal implementation (GREEN)**  

  ```tsx
  import { Link } from 'react-router-dom';
  import { Button } from '@/components/ui/button';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
  import { PageShell } from '@/components/shared/PageShell';
  import { useAuth } from '@/contexts/AuthContext';
  import { useLanguage } from '@/contexts/LanguageContext';
  import { ProfileBaseQuestionnaire } from '@/features/profile/ProfileBaseQuestionnaire';
  import { tokens } from '@/lib/design-tokens';

  export function QuestionnairePage() {
    const { t } = useLanguage();
    const { user } = useAuth();

    return (
      <PageShell title={t('questionnaireTitle')} subtitle={t('questionnaireSubtitle')}>
        <div className="space-y-6">
          {!user ? (
            <Card className={tokens.card.accent}>
              <CardHeader>
                <CardTitle>{t('questionnaireAnonymousBannerTitle')}</CardTitle>
                <CardDescription className="text-base text-foreground/90">
                  {t('questionnaireAnonymousBannerBody')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="primary">
                  <Link to="/auth">{t('questionnaireAnonymousBannerCta')}</Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>{t('questionnaireTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileBaseQuestionnaire />
            </CardContent>
          </Card>
        </div>
      </PageShell>
    );
  }
  ```

  Use **`/auth`** (registered in `AppRouter.tsx` as `<Route path="/auth" …>`). Do not use `onClick` + `navigate` for this CTA.

- [ ] **Step 4: Verify**  

  ```bash
  cd social-matching-web
  npx playwright test e2e/participant-foundation.spec.ts --project=chromium -g "anonymous visitor"
  npm run typecheck
  ```

  Expected: PASS.

- [ ] **Step 5: Commit**  

  ```bash
  git add src/pages/questionnaire/QuestionnairePage.tsx e2e/participant-foundation.spec.ts
  git commit -m "feat(questionnaire): add anonymous sign-in banner for preview form"
  ```

---

## Task 3 — Hebrew display labels for chip options (no DB change)

**Files:** `src/features/profile/ProfileBaseQuestionnaire.tsx`, `e2e/participant-foundation.spec.ts`

- [ ] **Step 1: Failing Playwright test (RED)**  

  ```typescript
  test('questionnaire: authenticated user sees Hebrew chip label for interest option', async ({ browser }) => {
    const ctx = await browser.newContext();
    await authenticateAs(ctx, ENV.EMAILS.P1);
    const page = await ctx.newPage();
    await page.goto('/questionnaire');

    await expect(page.getByRole('heading', { level: 1, name: /שאלון/ })).toBeVisible();
    await page.getByRole('button', { name: 'המשך' }).click();

    await expect(page.getByText('מוזיקה', { exact: true })).toBeVisible();
    await expect(page.getByText('אומנות', { exact: true })).toBeVisible();

    await ctx.close();
  });
  ```

  **Primary assertion:** After advancing to step 2 (`stepIndex === 1`), interest chips show Hebrew (`מוזיקה`, `אומנות`). **Fallback if staging P1 cannot pass step validation:** relax the test to `await expect(page.getByText('מוזיקה')).toBeVisible({ timeout: 15000 })` after `goto` only if product confirms P1 lands on step 2 with one click; otherwise document failure, merge chip mapping first, and tighten the test once a dedicated “questionnaire step-2” fixture user exists.

- [ ] **Step 2: Run test — expect failure**  

  ```bash
  cd social-matching-web
  npx playwright test e2e/participant-foundation.spec.ts --project=chromium -g "Hebrew chip label"
  ```

  Expected: FAIL until mappings + chip children updated.

- [ ] **Step 3: Minimal implementation (GREEN)**  
  Near the `interestOptions` / `socialStyleOptions` constants, add **verbatim** maps and use them in JSX (`key={option}` stays English; **children** use Hebrew):

  ```typescript
  const interestDisplayLabels: Record<(typeof interestOptions)[number], string> = {
    Music: 'מוזיקה',
    Art: 'אומנות',
    Books: 'ספרים',
    Film: 'קולנוע',
    'Philosophy / ideas': 'פילוסופיה / רעיונות',
    'Nature / outdoors': 'טבע / טיולים',
    'Movement / sports': 'תנועה / ספורט',
    'Food / culinary': 'אוכל / קולינריה',
    'Community / people': 'קהילה / אנשים',
    'Entrepreneurship / career': 'יזמות / קריירה',
    Technology: 'טכנולוגיה',
    Games: 'משחקים',
    'Urban culture': 'תרבות עירונית',
    'Personal growth': 'צמיחה אישית',
  };

  const socialStyleDisplayLabels: Record<(typeof socialStyleOptions)[number], string> = {
    Initiator: 'יוזם/ת',
    Connector: 'מחבר/ת',
    Flexible: 'גמיש/ה',
    Listener: 'מקשיב/ה',
  };

  const rechargeDisplayLabels: Record<(typeof rechargeOptions)[number], string> = {
    'With people': 'עם אנשים',
    Alone: 'לבד',
    'A mix of both': 'שילוב של שניהם',
  };

  const meetingPriorityDisplayLabels: Record<(typeof meetingPriorityOptions)[number], string> = {
    'Light and enjoyable conversation': 'שיחה קלה ונעימה',
    'Feeling heard': 'תחושה שמקשיבים',
    'Meeting people different from me': 'להכיר אנשים שונים ממני',
    'Feeling comfortable and opening up gradually': 'להרגיש בנוח ולהיפתח בהדרגה',
  };

  const languageDisplayLabels: Record<(typeof languageOptions)[number], string> = {
    Hebrew: 'עברית',
    'Hebrew + English is fine': 'עברית + אנגלית זה בסדר',
    'Comfortable in English': 'נוח באנגלית',
    'English only': 'אנגלית בלבד',
  };

  const matchPreferenceDisplayLabels: Record<(typeof matchPreferenceOptions)[number], string> = {
    'People more similar to me': 'אנשים דומים לי',
    'People more different from me': 'אנשים שונים ממני',
    'A mix of both': 'שילוב של שניהם',
  };

  const motivationDisplayLabels: Record<(typeof motivationOptions)[number], string> = {
    'Meet new people': 'להכיר אנשים חדשים',
    'Break routine': 'לשבור שגרה',
    'Build meaningful connections': 'לבנות קשרים משמעותיים',
    'Try a new kind of experience': 'לנסות חוויה חדשה',
  };
  ```

  Replace chip bodies, for example:

  ```tsx
  {interestOptions.map((option) => (
    <ChoiceChip
      key={option}
      selected={form.q22_interests.includes(option)}
      onClick={() => toggleMulti('q22_interests', option, 5)}
    >
      {interestDisplayLabels[option]}
    </ChoiceChip>
  ))}
  ```

  Apply the same pattern for `languageOptions`, `socialStyleOptions`, `rechargeOptions`, `meetingPriorityOptions`, `matchPreferenceOptions`, `motivationOptions`. **Never** change the strings stored in `form.*` — only the visible chip label.

- [ ] **Step 4: Verify**  

  ```bash
  cd social-matching-web
  npx playwright test e2e/participant-foundation.spec.ts --project=chromium -g "Hebrew chip label"
  npm run typecheck
  ```

  Expected: PASS.

- [ ] **Step 5: Commit**  

  ```bash
  git add src/features/profile/ProfileBaseQuestionnaire.tsx e2e/participant-foundation.spec.ts
  git commit -m "feat(questionnaire): localize chip labels to hebrew without changing db values"
  ```

---

## Task 4 — `RouteErrorState` for remote load failures

**Files:** `src/pages/questionnaire/QuestionnairePage.tsx`, `src/features/profile/ProfileBaseQuestionnaire.tsx`, `e2e/participant-foundation.spec.ts`

- [ ] **Step 1: Failing Playwright test (RED)**  

  ```typescript
  test('questionnaire: matching_responses load failure shows RouteErrorState and keeps form', async ({ browser }) => {
    const ctx = await browser.newContext();
    await authenticateAs(ctx, ENV.EMAILS.P1);
    const page = await ctx.newPage();

    await page.route('**/rest/v1/matching_responses**', async (route) => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
    });

    await page.goto('/questionnaire');

    await expect(page.getByText('שגיאת טעינה', { exact: true })).toBeVisible();
    await expect(
      page.getByText('לא הצלחנו לטעון את הנתונים השמורים. אפשר לרענן ולנסות שוב.', { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'המשך' })).toBeVisible();

    await ctx.close();
  });
  ```

- [ ] **Step 2: Run test — expect failure**  

  ```bash
  cd social-matching-web
  npx playwright test e2e/participant-foundation.spec.ts --project=chromium -g "matching_responses load failure"
  ```

  Expected: FAIL until `onLoadError` + page wiring exist.

- [ ] **Step 3: Minimal implementation (GREEN)**  

  **`ProfileBaseQuestionnaire.tsx`** — extend the component signature and wire the remote `useEffect` (same effect that uses `supabase.from('matching_responses')` today). **Do not add `onSaved` until Task 5** (keep this task strictly `onLoadError`).

  ```tsx
  type ProfileBaseQuestionnaireProps = {
    onLoadError?: (hasError: boolean) => void;
  };

  export function ProfileBaseQuestionnaire({ onLoadError }: ProfileBaseQuestionnaireProps = {}) {
  ```

  Inside the `.then` for the matching_responses fetch:

  ```typescript
  if (fetchError) {
    setError(text.loadRemoteError);
    onLoadError?.(true);
    setLoadedRemote(true);
    return;
  }
  // ... merge data when data is truthy ...
  onLoadError?.(false);
  setLoadedRemote(true);
  ```

  **`QuestionnairePage.tsx`** — track surfaced route-level error and render **below** the main questionnaire `Card` (form stays mounted). Wire `onSaved` only in Task 5.

  ```tsx
  import { useState } from 'react';
  import { RouteErrorState } from '@/components/shared/RouteState';

  const [remoteLoadFailed, setRemoteLoadFailed] = useState(false);

  return (
    <PageShell title={t('questionnaireTitle')} subtitle={t('questionnaireSubtitle')}>
      <div className="space-y-6">
        {/* anonymous banner from Task 2 — unchanged */}
        <Card>
          <CardHeader>
            <CardTitle>{t('questionnaireTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileBaseQuestionnaire
              onLoadError={(hasError) => {
                setRemoteLoadFailed(hasError);
              }}
            />
          </CardContent>
        </Card>
        {remoteLoadFailed ? (
          <RouteErrorState title={t('questionnaireLoadErrorTitle')} body={t('questionnaireLoadError')} />
        ) : null}
      </div>
    </PageShell>
  );
  ```

  Keep the existing inline `error` paragraph inside the questionnaire for local validation errors; the new block is specifically for **remote load** escalation to `RouteErrorState`.

- [ ] **Step 4: Verify**  

  ```bash
  cd social-matching-web
  npx playwright test e2e/participant-foundation.spec.ts --project=chromium -g "matching_responses load failure"
  npm run typecheck
  ```

  Expected: PASS.

- [ ] **Step 5: Commit**  

  ```bash
  git add src/pages/questionnaire/QuestionnairePage.tsx src/features/profile/ProfileBaseQuestionnaire.tsx e2e/participant-foundation.spec.ts
  git commit -m "feat(questionnaire): surface remote load failures via routeerrorstate"
  ```

---

## Task 5 — Success-state CTA row on `QuestionnairePage`

**Files:** `src/pages/questionnaire/QuestionnairePage.tsx`, `src/features/profile/ProfileBaseQuestionnaire.tsx`, `e2e/participant-foundation.spec.ts`

- [ ] **Step 1: Failing Playwright test (RED)**  

  ```typescript
  test('questionnaire: successful profile save shows Hebrew success CTAs', async ({ browser }) => {
    test.skip(true, 'TODO: stabilize once e2e fixture for clean questionnaire user exists');

    const ctx = await browser.newContext();
    await authenticateAs(ctx, ENV.EMAILS.P1);
    const page = await ctx.newPage();
    await page.goto('/questionnaire');

    await page.getByRole('button', { name: 'שמירת פרופיל' }).click();

    await expect(page.getByText('הפרופיל נשמר. מה הלאה?', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'לצפייה במפגשים' })).toHaveAttribute('href', '/events');
    await expect(page.getByRole('link', { name: 'לאזור האישי' })).toHaveAttribute('href', '/dashboard');

    await ctx.close();
  });
  ```

  **Trade-off (explicit):** A full save success path in Playwright requires a signed-in user whose form passes `validateStep` on all sections and completes `persistProfile` without `upsertError`, or a **fixture reset** of `matching_responses` / draft state. Until a dedicated staging user or DB reset helper exists, **`test.skip` is acceptable**; the implementer must **manually verify** in a browser that `onSaved` fires after a successful cloud save and that both links render. When staging data is reliable, remove `test.skip` and drive the flow with real interactions (or re-submit an already-complete questionnaire if that reliably hits `setMessage(text.saveSuccess)` — only if verified on staging).

- [ ] **Step 2: Run test — expect skip / optional fail**  

  ```bash
  cd social-matching-web
  npx playwright test e2e/participant-foundation.spec.ts --project=chromium -g "successful profile save"
  ```

  Expected: skipped until unskipped; if unskipped without fixture work, may FAIL.

- [ ] **Step 3: Minimal implementation (GREEN)**  

  **`ProfileBaseQuestionnaire.tsx`** — extend the Task 4 props type and destructuring:

  ```tsx
  type ProfileBaseQuestionnaireProps = {
    onLoadError?: (hasError: boolean) => void;
    onSaved?: () => void;
  };

  export function ProfileBaseQuestionnaire({ onLoadError, onSaved }: ProfileBaseQuestionnaireProps = {}) {
  ```

  After successful `matching_responses` upsert inside `persistProfile`:

  ```typescript
  if (upsertError) {
    throw upsertError;
  }

  setMessage(text.saveSuccess);
  onSaved?.();
  ```

  Do **not** call `onSaved` for the `!user` early return or for draft-only / error paths.

  **`QuestionnairePage.tsx`**:

  ```tsx
  const [profileSaved, setProfileSaved] = useState(false);

  <ProfileBaseQuestionnaire
    onLoadError={(hasError) => {
      setRemoteLoadFailed(hasError);
    }}
    onSaved={() => {
      setProfileSaved(true);
    }}
  />

  {profileSaved ? (
    <Card className={tokens.card.accent}>
      <CardHeader>
        <CardTitle>{t('questionnaireSuccessTitle')}</CardTitle>
        <CardDescription className="text-base text-foreground/90">
          {t('questionnaireSuccessBody')}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button asChild variant="primary">
          <Link to="/events">{t('questionnaireGotoEvents')}</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link to="/dashboard">{t('questionnaireGotoDashboard')}</Link>
        </Button>
      </CardContent>
    </Card>
  ) : null}
  ```

- [ ] **Step 4: Verify**  
  Manual browser verification if Playwright remains skipped; otherwise:

  ```bash
  cd social-matching-web
  npx playwright test e2e/participant-foundation.spec.ts --project=chromium -g "successful profile save"
  npm run typecheck
  ```

- [ ] **Step 5: Commit**  

  ```bash
  git add src/pages/questionnaire/QuestionnairePage.tsx src/features/profile/ProfileBaseQuestionnaire.tsx e2e/participant-foundation.spec.ts
  git commit -m "feat(questionnaire): add success-state ctas to events and dashboard"
  ```

---

## Task 6 — Document Q1 decision in `docs/participant-routing.md`

**Files:** `docs/participant-routing.md`

- [ ] **Step 1: Failing artifact gate (RED)**  
  Acceptance: `docs/participant-routing.md` contains a markdown H2 heading exactly: `## Readiness route — /questionnaire` (no backticks inside the heading text in the file).

- [ ] **Step 2: Run gate — expect failure**  

  ```bash
  cd social-matching-web
  grep -q "Readiness route" docs/participant-routing.md
  ```

  Expected: non-zero exit status until the section exists.

- [ ] **Step 3: Minimal implementation (GREEN)**  
  Append **≤ 12 lines**:

  ```markdown
  ## Readiness route — /questionnaire

  - In the route manifest, `/questionnaire` remains **auth: 'public'** (foundation-owned; do not change in Dev A passes).
  - Anonymous visitors get a **preview** questionnaire: drafts persist **locally**; **Supabase** persistence for profile / `matching_responses` runs **after sign-in** (`ProfileBaseQuestionnaire`).
  - Public access is **intentional** for onboarding; tightening guards is a **foundation** ticket, not Dev A.
  ```

- [ ] **Step 4: Verify**  

  ```bash
  cd social-matching-web
  grep -q "Readiness route" docs/participant-routing.md
  npm run typecheck
  ```

- [ ] **Step 5: Commit**  

  ```bash
  git add docs/participant-routing.md
  git commit -m "docs: document /questionnaire public preview decision"
  ```

---

## Task 7 — §13.2 workflow E2E (OPTIONAL, BEST-EFFORT)

**Files:** `e2e/participant-foundation.spec.ts`

**Status:** OPTIONAL. Ship only if a staging participant email is verified to have **no** `matching_responses` row (or a dedicated disposable user) **before** each run.

- [ ] **Step 1: Test design (RED sketch)**  
  Add `test.describe.serial('questionnaire workflow §13.2 (optional)', () => { ... })` containing one flow: **new user → complete questionnaire → readiness flips → apply unblocks**.

  ```typescript
  import { test, expect } from '@playwright/test';
  import { authenticateAs } from './fixtures/auth';
  import { ENV } from './fixtures/env';
  import { createServiceRoleClient } from './fixtures/supabase';

  test.describe.serial('questionnaire workflow §13.2 (optional)', () => {
    const admin = createServiceRoleClient();
    let userId: string;
    let hadRow: boolean;
    let snapshot: Record<string, unknown> | null;

    test.beforeAll(async () => {
      const { data: profile, error } = await admin.from('profiles').select('id').eq('email', ENV.EMAILS.P2).maybeSingle();
      if (error) throw error;
      if (!profile?.id) throw new Error('Missing profile for ENV.EMAILS.P2');
      userId = profile.id;

      const { data: row } = await admin.from('matching_responses').select('*').eq('user_id', userId).maybeSingle();
      hadRow = Boolean(row);
      snapshot = row ? { ...row } : null;

      const { error: delError } = await admin.from('matching_responses').delete().eq('user_id', userId);
      if (delError) throw delError;
    });

    test.afterAll(async () => {
      if (!hadRow) return;
      if (!snapshot) return;
      const { error } = await admin.from('matching_responses').upsert(snapshot, { onConflict: 'user_id' });
      if (error) throw error;
    });

    test('new user completes questionnaire and can proceed toward apply', async ({ browser }) => {
      test.skip(true, 'Enable after verifying P2 has no matching_responses at test start on staging');

      const ctx = await browser.newContext();
      await authenticateAs(ctx, ENV.EMAILS.P2);
      const page = await ctx.newPage();
      await page.goto('/questionnaire');
      // ... fill all steps, submit, then assert readiness / apply unblocked per §13.2 ...
      await ctx.close();
    });
  });
  ```

  Replace `ENV.EMAILS.P2` with whichever email is confirmed empty. **Verify first** with:

  ```typescript
  const { data } = await admin.from('matching_responses').select('user_id').eq('user_id', userId).maybeSingle();
  ```

  If the environment cannot guarantee isolation, **leave `test.skip(true, …)`** and note in the PR body: deferred follow-up for a disposable questionnaire user.

- [ ] **Step 2: Run test — expect skip until enabled**  

  ```bash
  cd social-matching-web
  npx playwright test e2e/participant-foundation.spec.ts --project=chromium -g "§13.2"
  ```

- [ ] **Step 3: Implementation**  
  Only remove `test.skip` after `beforeAll` proves a clean slate and the full interaction sequence is stable.

- [ ] **Step 4: Verify**  
  Same Playwright command; must PASS when unskipped.

- [ ] **Step 5: Commit**  

  ```bash
  git add e2e/participant-foundation.spec.ts
  git commit -m "test(participant): cover new-user questionnaire-to-apply workflow"
  ```

---

## Verification commands (full pass)

```bash
cd social-matching-web
npx playwright test e2e/participant-foundation.spec.ts --project=chromium
npm run typecheck
npm run build
```

---

## Developer B coordination — do not touch

Developer B should avoid these paths for this pass (Developer A owns them here):

- `src/pages/questionnaire/QuestionnairePage.tsx`
- `src/features/profile/ProfileBaseQuestionnaire.tsx`
- `src/locales/he.ts`, `src/locales/en.ts` (questionnaire-related keys only)
- `docs/participant-routing.md`
- `e2e/participant-foundation.spec.ts`

---

## What this plan explicitly excludes

- No changes to `routeManifest.ts`, `AppRouter.tsx`, `guards.tsx`, or any shared-component file.
- No DB migrations; English values in `matching_responses` stay as-is.
- No change to `ApplicationStatusPanel` API.
- No refactor of `ProfileBaseQuestionnaire`'s existing remote-fetch `useEffect` beyond adding two optional callback props (`onLoadError`, `onSaved`) which are additive and backward-compatible.
- No follow-through on debt items D1–D6 from the handoff (those are Plan #6's scope).
- No new shared primitives under `src/components/shared/*`.
