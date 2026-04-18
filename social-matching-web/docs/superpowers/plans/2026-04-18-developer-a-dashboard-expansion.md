# Dashboard Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand `/dashboard` from the current handoff grid (static profile card + ad-hoc applications list) into the canonical participant home: profile readiness with a clear next-step CTA driven by the same readiness rule as apply, and an application lifecycle list that surfaces per-event status (pending / awaiting_response / confirmed / attended) with `StatusBadge` plus time-sensitive cues for `awaiting_response` (deadline vs expired), using shared empty/error primitives. Reuse `listDashboardApplications` and `getQuestionnaireReadyState` only—no new queries, RPCs, or Supabase shapes.

**Architecture:** Keep routing and guards untouched. Compose new local participant components under `src/features/profile/components/` and `src/features/applications/components/`, wire them from `DashboardPage.tsx`, and reuse `QuestionnaireReadinessPanel`, `ApplicationStatusPanel`, and `StatusBadge` where they reduce duplication without renaming. Align with spec §9.3 (shared loading/empty/error patterns—here empty/error use `RouteEmptyState` / `RouteErrorState`) and §12.1 lifecycle examples. Do not use `RouteLoadingState` (English defaults) or `PlaceholderPanel` (English sentinel copy) on this participant-facing screen; keep loading copy inline in Hebrew or reuse existing Hebrew strings from the current dashboard.

**Tech Stack:** React 18, TypeScript, React Router 6, Tailwind, Supabase client, Playwright

---

## Non-negotiable scope rules

- Reuse `listDashboardApplications` (`src/features/events/query.ts`) and `getQuestionnaireReadyState` (`src/features/applications/api.ts`) **unchanged**—no edits to those functions, no new data layer.
- Do **not** modify `routeManifest.ts`, `AppRouter.tsx`, `guards.tsx`, any file under `src/components/shared/*`, host/admin pages, `e2e/foundation-routes.spec.ts`, or `e2e/slice-happy-path.spec.ts`.
- Reuse **existing** participant components by name: `QuestionnaireReadinessPanel`, `ApplicationStatusPanel`, `StatusBadge`. Do not rename them.
- New local UI pieces live under `src/features/profile/components/` or `src/features/applications/components/`.
- All **user-visible** strings on `/dashboard` must be Hebrew (including badges, headings, empty/error bodies, loading).
- Extend **`e2e/participant-foundation.spec.ts`** only (no new spec file). Use **relative** imports in `e2e/` (`./fixtures/env`, `./fixtures/auth`). Staging fixtures: `ENV.EMAILS.P1` … `P4`, `ENV.EVENT_ID`, `authenticateAs(ctx, email)`.
- Playwright: `PageShell` renders `<h1>`; `CardTitle` renders `<h3>`. Scope locators with `{ level: 1 }` vs `{ level: 3 }` to avoid strict-mode collisions.

---

## Prerequisite

Merge `dev-a/participant-normalization` first. This plan assumes the Pass-1 participant normalization is on `main` (`ApplicationStatusPanel`, `QuestionnaireReadinessPanel`, normalized dashboard grid, etc.).

---

## File Map

- Create: `src/features/profile/components/ProfileReadinessCard.tsx`
- Create: `src/features/applications/components/ApplicationLifecycleList.tsx` (and optionally `ApplicationLifecycleRow.tsx` in the same folder if the list file would otherwise exceed ~200 lines)
- Modify: `src/pages/dashboard/DashboardPage.tsx`
- Test: `e2e/participant-foundation.spec.ts`

---

## Task 1: Profile readiness card + failing E2E (ready path)

**Files:**
- Create: `src/features/profile/components/ProfileReadinessCard.tsx`
- Modify: `src/pages/dashboard/DashboardPage.tsx`
- Test: `e2e/participant-foundation.spec.ts`

- [ ] **Step 1: Write the failing test (P1 ready — questionnaire complete)**

```ts
import { test, expect } from '@playwright/test';
import { ENV } from './fixtures/env';
import { authenticateAs } from './fixtures/auth';

test.describe('participant foundation', () => {
  test('dashboard shows profile readiness as ready when P1 can apply', async ({ browser }) => {
    const ctx = await browser.newContext();
    await authenticateAs(ctx, ENV.EMAILS.P1);
    const page = await ctx.newPage();

    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { level: 1, name: 'האזור האישי שלך' })).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 3, name: 'מוכנות להגשה' }),
    ).toBeVisible();
    await expect(page.getByText('מוכנים להגיש למפגשים', { exact: true })).toBeVisible();
    await expect(page.getByText('מוכן להגשה', { exact: true })).toBeVisible();

    await ctx.close();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npx playwright test e2e/participant-foundation.spec.ts --project=chromium
```

Expected: **FAIL** — dashboard has no `h3` "מוכנות להגשה", no `StatusBadge`-backed "מוכן להגשה", and/or `getQuestionnaireReadyState` is not loaded on the dashboard yet.

- [ ] **Step 3: Implement `ProfileReadinessCard` and mount it**

Call `getQuestionnaireReadyState(user.id)` in `DashboardPage` (or inside the card with a passed `userId`) in parallel with existing applications load—same pattern as `ApplyPage`. Map `ready` to a `StatusBadge` label (e.g. `מוכן להגשה` vs `חסר שאלון`) and primary CTA (`Link` to `/questionnaire` when not ready). Optionally embed or sit beside `QuestionnaireReadinessPanel` for the explanatory body so copy stays consistent with Pass-1.

```tsx
// src/features/profile/components/ProfileReadinessCard.tsx (shape)
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { tokens } from '@/lib/design-tokens';

export function ProfileReadinessCard(props: { ready: boolean; isLoading: boolean }) {
  return (
    <Card className={tokens.card.surface}>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-xl">מוכנות להגשה</CardTitle>
        {!props.isLoading ? <StatusBadge label={props.ready ? 'מוכן להגשה' : 'לא מוכן להגשה'} /> : null}
      </CardHeader>
      <CardContent>{/* Hebrew body + Button asChild Link */}</CardContent>
    </Card>
  );
}
```

```tsx
// src/pages/dashboard/DashboardPage.tsx (slot — grid first column)
<ProfileReadinessCard ready={readiness.ready} isLoading={readinessLoading} />
```

- [ ] **Step 4: Run verification**

Run:

```bash
npm run typecheck
npx playwright test e2e/participant-foundation.spec.ts e2e/foundation-routes.spec.ts --project=chromium
```

Expected: **PASS**

- [ ] **Step 5: Commit**

```bash
git add src/features/profile/components/ProfileReadinessCard.tsx src/pages/dashboard/DashboardPage.tsx e2e/participant-foundation.spec.ts
git commit -m "feat: dashboard profile readiness card with Hebrew status"
```

---

## Task 2: Application lifecycle list + confirmed status E2E

**Files:**
- Create: `src/features/applications/components/ApplicationLifecycleList.tsx`
- Modify: `src/pages/dashboard/DashboardPage.tsx`
- Test: `e2e/participant-foundation.spec.ts`

- [ ] **Step 1: Write the failing test (P1 + confirmed — event title + chip)**

Assume staging has `ENV.EMAILS.P1` with a registration on `ENV.EVENT_ID` in `confirmed` or `approved` (both map to reserved copy in `formatApplicationStatusShort`). Scope the event title to the applications card.

```ts
test('dashboard lifecycle list shows event title and reserved status for confirmed application', async ({ browser }) => {
  const ctx = await browser.newContext();
  await authenticateAs(ctx, ENV.EMAILS.P1);
  const page = await ctx.newPage();

  await page.goto('/dashboard');
  const appsCard = page.getByRole('heading', { level: 3, name: 'ההגשות שלך' }).locator('..').locator('..');
  await expect(appsCard.getByText('המקום שלך שמור', { exact: true })).toBeVisible();

  await ctx.close();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npx playwright test e2e/participant-foundation.spec.ts --project=chromium
```

Expected: **FAIL** — status is still plain paragraph text / no `StatusBadge`, or locator cannot find the chip text inside the card.

- [ ] **Step 3: Replace inline map with `ApplicationLifecycleList`**

Move row rendering into a list component; each row uses `StatusBadge` with `formatApplicationStatusShort(application.status)` (already Hebrew). Preserve `isAwaitingParticipantResponse` / `isOfferExpired` / `formatLifecycleDateTime` cues and CTAs; reuse `ApplicationStatusPanel` for dense explanatory copy if it fits a row without English bleed-through.

```tsx
// src/pages/dashboard/DashboardPage.tsx (applications branch)
<ApplicationLifecycleList applications={applications} />
```

- [ ] **Step 4: Run verification**

Run:

```bash
npm run typecheck
npx playwright test e2e/participant-foundation.spec.ts e2e/foundation-routes.spec.ts --project=chromium
```

Expected: **PASS**

- [ ] **Step 5: Commit**

```bash
git add src/features/applications/components/ApplicationLifecycleList.tsx src/pages/dashboard/DashboardPage.tsx e2e/participant-foundation.spec.ts
git commit -m "feat: dashboard application lifecycle list with status badges"
```

---

## Task 3: Empty and error states (`RouteEmptyState` / `RouteErrorState`)

**Files:**
- Modify: `src/features/applications/components/ApplicationLifecycleList.tsx` (or `DashboardPage.tsx` if list stays thin)
- Modify: `src/pages/dashboard/DashboardPage.tsx`
- Test: `e2e/participant-foundation.spec.ts`

- [ ] **Step 1: Write the failing test (participant with zero applications)**

Use a mailbox that has no registrations in staging (e.g. `ENV.EMAILS.P4` if that is the empty fixture; if not, document the chosen mailbox in the commit and align with team staging data).

```ts
test('dashboard shows empty applications state with CTA to events', async ({ browser }) => {
  const ctx = await browser.newContext();
  await authenticateAs(ctx, ENV.EMAILS.P4);
  const page = await ctx.newPage();

  await page.goto('/dashboard');
  await expect(page.getByText('אין עדיין הגשות', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'למפגשים פתוחים' })).toBeVisible();

  await ctx.close();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npx playwright test e2e/participant-foundation.spec.ts --project=chromium
```

Expected: **FAIL** — empty branch still uses raw `<p>` copy or strings do not match; `RouteEmptyState` not used.

- [ ] **Step 3: Wire `RouteEmptyState` and `RouteErrorState`**

Replace the error `<p className="text-destructive">` and the zero-apps block with `RouteErrorState` / `RouteEmptyState` (Hebrew `title` + `body`). Keep the primary CTA as a `Button asChild` + `Link to="/events"` immediately after the empty state card content so behavior matches today’s handoff.

- [ ] **Step 4: Run verification**

Run:

```bash
npm run typecheck
npx playwright test e2e/participant-foundation.spec.ts e2e/foundation-routes.spec.ts --project=chromium
```

Expected: **PASS**

- [ ] **Step 5: Commit**

```bash
git add src/features/applications/components/ApplicationLifecycleList.tsx src/pages/dashboard/DashboardPage.tsx e2e/participant-foundation.spec.ts
git commit -m "feat: dashboard applications empty and error states"
```

---

## Task 4: Regression — readiness + lifecycle on one page

**Files:**
- Modify: `e2e/participant-foundation.spec.ts`

- [ ] **Step 1: Add one combined assertion test**

Single test on `ENV.EMAILS.P1`: after `page.goto('/dashboard')`, assert both (a) readiness `h3` / badge copy from Task 1 and (b) applications card heading `ההגשות שלך` plus at least one row or the appropriate empty state—pick whichever matches true staging data for P1 and adjust assertion in the PR if staging differs (call this out in PR description).

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npx playwright test e2e/participant-foundation.spec.ts --project=chromium
```

Expected: **FAIL** if either surface regresses or locators need the same `level` scoping fix.

- [ ] **Step 3: No production code unless the test exposes a real gap**

Fix only dashboard composition if the test is correct and the app is wrong.

- [ ] **Step 4: Run verification**

Run:

```bash
npm run typecheck
npx playwright test e2e/participant-foundation.spec.ts e2e/foundation-routes.spec.ts --project=chromium
```

Expected: **PASS**

- [ ] **Step 5: Commit**

```bash
git add e2e/participant-foundation.spec.ts
git commit -m "test: dashboard readiness and applications regression"
```

---

## Developer B coordination — files to leave untouched

Developer B should **not** edit the following so Developer A can land dashboard expansion cleanly: `src/pages/dashboard/DashboardPage.tsx`, `src/features/profile/components/ProfileReadinessCard.tsx`, `src/features/applications/components/ApplicationLifecycleList.tsx`, `e2e/participant-foundation.spec.ts`, `src/features/events/query.ts`, `src/features/applications/api.ts`, and the same global exclusions already reserved for this stream (`routeManifest.ts`, `AppRouter.tsx`, `guards.tsx`, `src/components/shared/*`, `e2e/foundation-routes.spec.ts`, `e2e/slice-happy-path.spec.ts`, host/admin route trees). Coordinate if either side needs a shared type tweak—prefer a short sync or a follow-up ticket over widening this diff.

---

## Self-Review Notes

- Spec anchors: `/dashboard` expansion (participant home, readiness + lifecycle summary), §9.3 shared state blocks, §12.1 participant lifecycle examples (questionnaire incomplete, awaiting response, confirmed, attended, etc.).
- **Ambiguity — staging fixtures:** Confirm which email (`P1`–`P4`) has zero applications for Task 3 and which has `confirmed`/`approved` on `ENV.EVENT_ID`; update the plan’s test comments in-repo if staging seed differs.
- **Ambiguity — `participant-foundation.spec.ts`:** This file is created/expanded on the prerequisite branch; if it is missing locally, merge prerequisite before starting Task 1.
- **Ambiguity — copy contract:** Exact Hebrew strings in Task 1 (`מוכנות להגשה`, `מוכנים להגיש למפגשים`, `מוכן להגשה`) are implementation choices—keep them consistent between UI and tests, or change both together.
- **Ambiguity — loading UI:** Without `RouteLoadingState`, align loading UX with product (spinner vs text) using only Hebrew strings and existing design tokens.
