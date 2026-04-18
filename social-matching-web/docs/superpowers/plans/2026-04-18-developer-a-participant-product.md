# Participant Product Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Normalize and expand the participant-facing product surfaces after shared foundation normalization, using the new shared route-state and placeholder primitives.

**Architecture:** Keep participant work inside existing route files and add a small set of local participant components under `src/features/events`, `src/features/applications`, and `src/features/profile`. Reuse the shared foundation components instead of inventing new page-state patterns, and keep the participant route graph centered on `/events/:eventId` rather than letting `/gathering/:eventId` become the accidental primary entry surface.

**Tech Stack:** React 18, TypeScript, React Router 6, Tailwind, Supabase client, Playwright

---

## Prerequisite

Merge the shared foundation plan first. This plan assumes these shared exports already exist:

- `RouteLoadingState`
- `RouteErrorState`
- `RouteUnavailableState`
- `PlaceholderPanel`
- `PageActionBar`
- `SectionHeader`
- `StatusBadge`

## File Map

- Create: `src/features/events/components/EventSummaryCard.tsx`
- Create: `src/features/applications/components/ApplicationStatusPanel.tsx`
- Create: `src/features/profile/components/QuestionnaireReadinessPanel.tsx`
- Modify: `src/pages/landing/LandingPage.tsx`
- Modify: `src/pages/auth/AuthPage.tsx`
- Modify: `src/pages/auth/AuthCallbackPage.tsx`
- Modify: `src/pages/events/EventsPage.tsx`
- Modify: `src/pages/events/EventDetailPage.tsx`
- Modify: `src/pages/apply/ApplyPage.tsx`
- Modify: `src/pages/dashboard/DashboardPage.tsx`
- Modify: `src/pages/questionnaire/QuestionnairePage.tsx`
- Modify: `src/pages/gathering/GatheringPage.tsx`
- Test: `e2e/participant-foundation.spec.ts`

## Task 1: Normalize Discovery and Detail Entry Points

**Files:**
- Create: `src/features/events/components/EventSummaryCard.tsx`
- Modify: `src/pages/landing/LandingPage.tsx`
- Modify: `src/pages/events/EventsPage.tsx`
- Modify: `src/pages/events/EventDetailPage.tsx`
- Test: `e2e/participant-foundation.spec.ts`

- [ ] **Step 1: Write the failing test for canonical participant navigation**

```ts
import { test, expect } from '@playwright/test';
import { ENV } from './fixtures/env';

test.describe('participant foundation', () => {
  test('discovery links into canonical event detail before apply', async ({ page }) => {
    await page.goto('/events');
    await page.getByRole('link', { name: /לפרטי המפגש/i }).first().click();
    await expect(page).toHaveURL(new RegExp(`/events/`));
    await expect(page.getByRole('button', { name: /להגיש מועמדות|לסטטוס ההרשמה|למקום הזמני ולתגובה/i })).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npx playwright test e2e/participant-foundation.spec.ts --project=chromium
```

Expected: FAIL because `EventsPage.tsx` still sends users to `/gathering/:eventId` instead of the canonical detail route.

- [ ] **Step 3: Write the minimal participant discovery and detail components**

```tsx
// src/features/events/components/EventSummaryCard.tsx
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatEventDate } from '@/features/events/formatters';
import { tokens } from '@/lib/design-tokens';
import type { VisibleEvent } from '@/features/events/types';

export function EventSummaryCard({ event }: { event: VisibleEvent }) {
  return (
    <Card className={tokens.card.accent}>
      <CardHeader>
        <CardTitle className="text-xl leading-tight">{event.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-foreground/85">
        <p><strong className="text-foreground">עיר:</strong> {event.city}</p>
        <p><strong className="text-foreground">מתי:</strong> {formatEventDate(event.starts_at)}</p>
        <Button asChild variant="primary">
          <Link to={`/events/${event.id}`}>לפרטי המפגש</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
```

```tsx
// src/pages/events/EventsPage.tsx (render path only)
{events.map((event) => (
  <EventSummaryCard key={event.id} event={event} />
))}
```

```tsx
// src/pages/events/EventDetailPage.tsx (action row only)
<PageActionBar>
  <Button asChild variant="outline">
    <Link to="/events">חזרה לכל המפגשים</Link>
  </Button>
  <Button asChild variant="primary">
    <Link to={`/events/${event.id}/apply`}>
      {application ? 'לסטטוס ההרשמה' : 'להגיש מועמדות'}
    </Link>
  </Button>
</PageActionBar>
```

- [ ] **Step 4: Run the participant test and typecheck**

Run:

```bash
npx playwright test e2e/participant-foundation.spec.ts --project=chromium
npm run typecheck
```

Expected: PASS on both commands

- [ ] **Step 5: Commit**

```bash
git add src/features/events/components/EventSummaryCard.tsx src/pages/landing/LandingPage.tsx src/pages/events/EventsPage.tsx src/pages/events/EventDetailPage.tsx e2e/participant-foundation.spec.ts
git commit -m "feat: normalize participant discovery and detail flow"
```

## Task 2: Standardize Apply-State Presentation

**Files:**
- Create: `src/features/applications/components/ApplicationStatusPanel.tsx`
- Modify: `src/pages/events/EventDetailPage.tsx`
- Modify: `src/pages/apply/ApplyPage.tsx`
- Test: `e2e/participant-foundation.spec.ts`

- [ ] **Step 1: Write the failing test for blocked apply states**

```ts
import { authenticateAs } from './fixtures/auth';

test('authenticated participant sees a readiness message before applying when blocked', async ({ browser }) => {
  const ctx = await browser.newContext();
  await authenticateAs(ctx, ENV.EMAILS.P1);
  const page = await ctx.newPage();

  await page.goto(`/events/${ENV.EVENT_ID}/apply`);
  await expect(page.getByText(/הגשה למפגש|סטטוס ההרשמה/i)).toBeVisible();
  await expect(page.getByText(/צריך להשלים את הפרופיל|המקום שלך במפגש נשמר|כבר קיימת הגשה/i)).toBeVisible();

  await ctx.close();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npx playwright test e2e/participant-foundation.spec.ts --project=chromium
```

Expected: FAIL because apply-state messaging is spread across ad hoc inline blocks with inconsistent headings.

- [ ] **Step 3: Add a shared participant application-status component and use it**

```tsx
// src/features/applications/components/ApplicationStatusPanel.tsx
import { PlaceholderPanel } from '@/components/shared/PlaceholderPanel';

export function ApplicationStatusPanel({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return <PlaceholderPanel title={title} body={body} contractState="mixed" />;
}
```

```tsx
// src/pages/apply/ApplyPage.tsx (one usage example)
{!questionnaireReady ? (
  <ApplicationStatusPanel
    title="לפני שממשיכים להגשה"
    body="צריך להשלים את הפרופיל והשאלון לפני שאפשר להגיש למפגש הזה."
  />
) : null}
```

```tsx
// src/pages/events/EventDetailPage.tsx (one usage example)
{awaitingResponse ? (
  <ApplicationStatusPanel
    title={offerExpired ? 'חלון התגובה למקום הזמני נסגר' : 'נשמר עבורך מקום זמני'}
    body={
      offerExpired
        ? 'המקום הזמני כבר לא ממתין לתגובה.'
        : 'כדי לשמור על המקום צריך להיכנס למסך ההרשמה ולהגיב בזמן.'
    }
  />
) : null}
```

- [ ] **Step 4: Run the participant test and typecheck**

Run:

```bash
npx playwright test e2e/participant-foundation.spec.ts --project=chromium
npm run typecheck
```

Expected: PASS on both commands

- [ ] **Step 5: Commit**

```bash
git add src/features/applications/components/ApplicationStatusPanel.tsx src/pages/events/EventDetailPage.tsx src/pages/apply/ApplyPage.tsx e2e/participant-foundation.spec.ts
git commit -m "feat: standardize participant apply-state panels"
```

## Task 3: Normalize Dashboard and Questionnaire Handoffs

**Files:**
- Create: `src/features/profile/components/QuestionnaireReadinessPanel.tsx`
- Modify: `src/pages/dashboard/DashboardPage.tsx`
- Modify: `src/pages/questionnaire/QuestionnairePage.tsx`
- Modify: `src/pages/gathering/GatheringPage.tsx`
- Test: `e2e/participant-foundation.spec.ts`

- [ ] **Step 1: Write the failing test for questionnaire-to-dashboard next steps**

```ts
test('dashboard exposes participant next steps with a questionnaire handoff', async ({ browser }) => {
  const ctx = await browser.newContext();
  await authenticateAs(ctx, ENV.EMAILS.P1);
  const page = await ctx.newPage();

  await page.goto('/dashboard');
  await expect(page.getByRole('link', { name: 'לשאלון הפרופיל' })).toBeVisible();
  await expect(page.getByText(/מה השלב הבא|לפני ההגשה הבאה/i)).toBeVisible();

  await ctx.close();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npx playwright test e2e/participant-foundation.spec.ts --project=chromium
```

Expected: FAIL because dashboard next-step messaging is still too generic and not standardized with the shared foundation.

- [ ] **Step 3: Add the readiness panel and use it in dashboard, questionnaire, and gathering**

```tsx
// src/features/profile/components/QuestionnaireReadinessPanel.tsx
import { PlaceholderPanel } from '@/components/shared/PlaceholderPanel';

export function QuestionnaireReadinessPanel({
  body,
}: {
  body: string;
}) {
  return <PlaceholderPanel title="לפני ההגשה הבאה" body={body} contractState="mixed" />;
}
```

```tsx
// src/pages/dashboard/DashboardPage.tsx
<QuestionnaireReadinessPanel body="כאן יופיע הסטטוס של הפרופיל, ההגשות שלך, והשלב הבא בכל מפגש." />
```

```tsx
// src/pages/gathering/GatheringPage.tsx
<PageActionBar>
  <Button asChild variant="outline">
    <Link to={`/events/${event.id}`}>לפרטי המפגש</Link>
  </Button>
  <Button asChild variant="outline">
    <Link to="/dashboard">לאזור האישי</Link>
  </Button>
</PageActionBar>
```

- [ ] **Step 4: Run participant verification**

Run:

```bash
npx playwright test e2e/participant-foundation.spec.ts --project=chromium
npm run typecheck
```

Expected: PASS on both commands

- [ ] **Step 5: Commit**

```bash
git add src/features/profile/components/QuestionnaireReadinessPanel.tsx src/pages/dashboard/DashboardPage.tsx src/pages/questionnaire/QuestionnairePage.tsx src/pages/gathering/GatheringPage.tsx e2e/participant-foundation.spec.ts
git commit -m "feat: add participant next-step handoffs"
```

## Task 4: Lock Participant Regression Coverage

**Files:**
- Modify: `src/pages/auth/AuthPage.tsx`
- Modify: `src/pages/auth/AuthCallbackPage.tsx`
- Modify: `e2e/participant-foundation.spec.ts`

- [ ] **Step 1: Add the failing auth regression tests**

```ts
test('unauthenticated apply preserves returnTo through sign-in', async ({ page }) => {
  await page.goto(`/events/${ENV.EVENT_ID}/apply`);
  await expect(page).toHaveURL(/\/sign-in/);
  await expect(page.getByText(/כניסה|אימות/i)).toBeVisible();
});

test('auth callback keeps a visible loading state before redirect completes', async ({ page }) => {
  await page.goto('/auth/callback');
  await expect(page.getByText(/loading|טוענים|מאמתים/i)).toBeVisible();
});
```

- [ ] **Step 2: Run the participant suite**

Run:

```bash
npx playwright test e2e/participant-foundation.spec.ts --project=chromium
```

Expected: FAIL if participant route normalization broke the existing auth-return behavior or callback loading state.

- [ ] **Step 3: Normalize auth surfaces without changing guard contracts**

```tsx
// src/pages/auth/AuthPage.tsx
import { RouteErrorState, RouteSuccessState } from '@/components/shared/RouteState';

{error ? <RouteErrorState title="לא הצלחנו לשלוח קישור כניסה" body={error} /> : null}
{infoMessage ? <RouteSuccessState title="שלחנו קישור כניסה" body={infoMessage} /> : null}
```

```tsx
// src/pages/auth/AuthCallbackPage.tsx
import { RouteLoadingState, RouteErrorState } from '@/components/shared/RouteState';

if (isLoading) {
  return <RouteLoadingState title="מאמתים את הכניסה…" />;
}

if (error) {
  return <RouteErrorState title="לא הצלחנו להשלים את הכניסה" body={error} />;
}
```

- [ ] **Step 4: Run the full participant verification pass**

Run:

```bash
npx playwright test e2e/participant-foundation.spec.ts --project=chromium
npm run typecheck
```

Expected: PASS on both commands

- [ ] **Step 5: Commit**

```bash
git add e2e/participant-foundation.spec.ts src/pages/auth/AuthPage.tsx src/pages/auth/AuthCallbackPage.tsx
git commit -m "feat: normalize participant auth surfaces"
```

## Self-Review Notes

- Spec coverage: This plan covers participant/public route normalization, canonical event-detail handoff, apply-state standardization, dashboard/questionnaire next steps, and participant verification.
- Placeholder scan: No step should rely on undefined "future behavior" without a visible placeholder or route handoff.
- Type consistency: Reuse the exact component names from this plan and the shared-foundation plan; do not rename `ApplicationStatusPanel` or `QuestionnaireReadinessPanel` mid-implementation.
