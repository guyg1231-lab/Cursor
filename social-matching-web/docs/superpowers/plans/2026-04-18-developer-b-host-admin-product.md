# Host and Admin Product Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the host workspace and admin surfaces after shared foundation normalization, while keeping host and admin permissions clearly separated.

**Architecture:** Reuse the shared foundation placeholder pages registered in the first plan, then deepen them into real route-linked workspaces with minimal but stable contract-first structure. Keep host work under `src/pages/host` and internal admin operations under `src/pages/admin`, using `src/features/host-events` and `src/features/admin` as the only contract layers touched by this plan.

**Scope boundary update (2026-04-20):**

- `admin` is the canonical role term in active planning.
- Existing file and component names with `Operator*` are legacy code naming and may remain until a later cleanup.
- Creator-side proposal/request flow belongs to Dev A and is not part of this plan.
- This plan owns the admin review/build side only.

**Tech Stack:** React 18, TypeScript, React Router 6, Tailwind, Supabase client, Playwright

---

## Prerequisite

Merge the shared foundation plan first. This plan assumes the following routes already exist:

- `/host/events/:eventId`
- `/host/events/:eventId/registrations`
- `/host/events/:eventId/communications`
- `/host/events/:eventId/follow-up`
- `/admin/events/:eventId/diagnostics`
- `/admin/events/:eventId/audit`

## File Map

- Modify: `src/pages/host/HostEventsPage.tsx`
- Modify: `src/pages/host/HostEventWorkspacePage.tsx`
- Modify: `src/pages/host/HostEventRegistrationsPage.tsx`
- Modify: `src/pages/host/HostEventCommunicationsPage.tsx`
- Modify: `src/pages/host/HostEventFollowUpPage.tsx`
- Modify: `src/pages/admin/OperatorEventDashboardPage.tsx`
- Modify: `src/pages/admin/AdminEventRequestsPage.tsx`
- Modify: `src/pages/admin/OperatorEventDiagnosticsPage.tsx`
- Modify: `src/pages/admin/OperatorEventAuditPage.tsx`
- Create: `src/features/host-events/components/HostMilestoneRail.tsx`
- Create: `src/features/host-events/components/HostSummaryStat.tsx`
- Create: `src/features/admin/components/OperatorDiagnosticsPanel.tsx`
- Create: `src/features/admin/components/OperatorAuditPlaceholder.tsx`
- Create: `src/features/admin/components/OperatorLifecyclePanel.tsx`
- Create: `e2e/host-admin-foundation.spec.ts`

## Task 1: Turn Host Event Cards Into Workspace Entry Points

**Files:**
- Modify: `src/pages/host/HostEventsPage.tsx`
- Modify: `src/pages/host/HostEventWorkspacePage.tsx`
- Create: `src/features/host-events/components/HostMilestoneRail.tsx`
- Create: `src/features/host-events/components/HostSummaryStat.tsx`
- Create: `e2e/host-admin-foundation.spec.ts`

- [ ] **Step 1: Write the failing host navigation test**

```ts
import { test, expect } from '@playwright/test';
import { authenticateAs } from './fixtures/auth';
import { ENV } from './fixtures/env';

test.describe('host and admin foundation', () => {
  test('host event cards lead into the host workspace route', async ({ browser }) => {
    const ctx = await browser.newContext();
    await authenticateAs(ctx, ENV.EMAILS.HOST1);
    const page = await ctx.newPage();

    await page.goto('/host/events');
    await page.getByRole('link', { name: /לסביבת האירוע|לניהול האירוע/i }).first().click();
    await expect(page).toHaveURL(/\/host\/events\/.+$/);
    await expect(page.getByRole('heading', { name: 'Host event workspace' })).toBeVisible();

    await ctx.close();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npx playwright test e2e/host-admin-foundation.spec.ts --project=chromium
```

Expected: FAIL because `HostEventsPage.tsx` does not yet link approved host events into the new workspace route.

- [ ] **Step 3: Add host workspace navigation and minimal host summary components**

```tsx
// src/features/host-events/components/HostSummaryStat.tsx
export function HostSummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-4 space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl text-foreground">{value}</p>
    </div>
  );
}
```

```tsx
// src/features/host-events/components/HostMilestoneRail.tsx
export function HostMilestoneRail() {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-4 text-sm text-muted-foreground">
      <p className="font-medium text-foreground">Host milestones</p>
      <ol className="list-decimal pl-5 space-y-1">
        <li>Request created</li>
        <li>Submitted for review</li>
        <li>Approved and published</li>
        <li>Summary surfaces unlocked</li>
      </ol>
    </div>
  );
}
```

```tsx
// src/pages/host/HostEventsPage.tsx (approved-host-event action only)
<Button asChild variant="outline">
  <Link to={`/host/events/${event.id}`}>לניהול האירוע</Link>
</Button>
```

```tsx
// src/pages/host/HostEventWorkspacePage.tsx
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/shared/PageShell';
import { PageActionBar } from '@/components/shared/PageActionBar';
import { HostMilestoneRail } from '@/features/host-events/components/HostMilestoneRail';
import { HostSummaryStat } from '@/features/host-events/components/HostSummaryStat';

export function HostEventWorkspacePage() {
  const { eventId } = useParams();

  return (
    <PageShell title="Host event workspace" subtitle={`Event ${eventId ?? 'unknown'}`}>
      <PageActionBar>
        <Button asChild variant="outline">
          <Link to="/host/events">חזרה לכל האירועים</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to={`/host/events/${eventId}/registrations`}>לתמונת ההרשמות</Link>
        </Button>
      </PageActionBar>
      <div className="grid gap-4 md:grid-cols-3">
        <HostSummaryStat label="הגשות פעילות" value={0} />
        <HostSummaryStat label="ממתינים לתגובה" value={0} />
        <HostSummaryStat label="מקומות שמורים" value={0} />
      </div>
      <HostMilestoneRail />
    </PageShell>
  );
}
```

- [ ] **Step 4: Run the host/admin test and typecheck**

Run:

```bash
npx playwright test e2e/host-admin-foundation.spec.ts --project=chromium
npm run typecheck
```

Expected: PASS on both commands

- [ ] **Step 5: Commit**

```bash
git add src/pages/host/HostEventsPage.tsx src/pages/host/HostEventWorkspacePage.tsx src/features/host-events/components/HostMilestoneRail.tsx src/features/host-events/components/HostSummaryStat.tsx e2e/host-admin-foundation.spec.ts
git commit -m "feat: connect host events to workspace routes"
```

## Task 2: Fill Out Host Sub-Surfaces Without Granting Admin Powers

**Files:**
- Modify: `src/pages/host/HostEventsPage.tsx`
- Modify: `src/pages/host/HostEventRegistrationsPage.tsx`
- Modify: `src/pages/host/HostEventCommunicationsPage.tsx`
- Modify: `src/pages/host/HostEventFollowUpPage.tsx`
- Create: `src/features/host-events/components/HostMilestoneRail.tsx`
- Modify: `e2e/host-admin-foundation.spec.ts`

- [ ] **Step 1: Write the failing host workspace navigation test**

```ts
test('host workspace links to registrations, communications, and follow-up placeholders', async ({ browser }) => {
  const ctx = await browser.newContext();
  await authenticateAs(ctx, ENV.EMAILS.HOST1);
  const page = await ctx.newPage();

  await page.goto('/host/events/future-workspace');
  await page.getByRole('link', { name: 'לתמונת ההרשמות' }).click();
  await expect(page).toHaveURL('/host/events/future-workspace/registrations');
  await expect(page.getByText(/אין כאן שמות משתתפים או שליטה בבחירה/i)).toBeVisible();

  await ctx.close();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npx playwright test e2e/host-admin-foundation.spec.ts --project=chromium
```

Expected: FAIL because the host sub-pages still use bare placeholder copy without host-specific navigation or guardrails.

- [ ] **Step 3: Add contract-first host placeholders with explicit limits**

```tsx
// src/features/host-events/components/HostMilestoneRail.tsx
export function HostMilestoneRail() {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-4 text-sm text-muted-foreground">
      <p className="font-medium text-foreground">Host milestones</p>
      <ol className="list-decimal pl-5 space-y-1">
        <li>Request created</li>
        <li>Submitted for review</li>
        <li>Approved and published</li>
        <li>Registrations summarized</li>
      </ol>
    </div>
  );
}
```

```tsx
// src/pages/host/HostEventRegistrationsPage.tsx
<PlaceholderPanel
  title="Host registrations summary"
  contractState="stubbed"
  body="אין כאן שמות משתתפים או שליטה בבחירה. המסך הזה שמור לסיכום ספירות ומצב כללי בלבד."
/>
```

```tsx
// src/pages/host/HostEventsPage.tsx (request-status summary block)
<Card className={tokens.card.surface}>
  <CardHeader>
    <CardTitle className="text-xl">סטטוס בקשות האירוע</CardTitle>
  </CardHeader>
  <CardContent className="space-y-2 text-sm text-muted-foreground">
    <p>טיוטות פרטיות נשארות ניתנות לעריכה.</p>
    <p>בקשות שנשלחו לבדיקה נשארות לקריאה בלבד עד החלטה מנהלית.</p>
    <p>אירועים מאושרים מקבלים קישור כניסה לסביבת האירוע.</p>
  </CardContent>
</Card>
```

```tsx
// src/pages/host/HostEventCommunicationsPage.tsx
<PlaceholderPanel
  title="Host communications"
  contractState="stubbed"
  body="המסך הזה שומר מקום לעדכונים עתידיים מהמארח/ת בלי לרמוז שיש כרגע מערכת הודעות פעילה."
/>
```

```tsx
// src/pages/host/HostEventFollowUpPage.tsx
<PlaceholderPanel
  title="Host follow-up"
  contractState="stubbed"
  body="המסך הזה שומר מקום לסיכום ופולואפ אחרי האירוע, אבל עדיין לא מבצע פעולות כתיבה."
/>
```

- [ ] **Step 4: Run host verification**

Run:

```bash
npx playwright test e2e/host-admin-foundation.spec.ts --project=chromium
npm run typecheck
```

Expected: PASS on both commands

- [ ] **Step 5: Commit**

```bash
git add src/pages/host/HostEventRegistrationsPage.tsx src/pages/host/HostEventCommunicationsPage.tsx src/pages/host/HostEventFollowUpPage.tsx src/features/host-events/components/HostMilestoneRail.tsx e2e/host-admin-foundation.spec.ts
git commit -m "feat: add host workspace sub-surface placeholders"
```

## Task 3: Preserve Admin Review Queue and Lifecycle Action Visibility

**Files:**
- Modify: `src/pages/admin/AdminEventRequestsPage.tsx`
- Modify: `src/pages/admin/OperatorEventDashboardPage.tsx`
- Create: `src/features/admin/components/OperatorLifecyclePanel.tsx`
- Modify: `e2e/host-admin-foundation.spec.ts`

- [ ] **Step 1: Write the failing admin lifecycle test**

```ts
test('admin review queue and admin dashboard expose lifecycle actions', async ({ browser }) => {
  const ctx = await browser.newContext();
  await authenticateAs(ctx, ENV.EMAILS.ADMIN1);
  const page = await ctx.newPage();

  await page.goto('/admin/event-requests');
  await expect(page.getByText(/Approve & publish|Reject/i)).toBeVisible();

  await page.goto(`/admin/events/${ENV.EVENT_ID}`);
  await expect(page.getByText(/Selection batch recorded|Live counts/i)).toBeVisible();
  await expect(page.getByText(/Lifecycle actions|Orchestrated selection/i)).toBeVisible();

  await ctx.close();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npx playwright test e2e/host-admin-foundation.spec.ts --project=chromium
```

Expected: FAIL because the admin surfaces do not yet expose a normalized lifecycle panel or stable headings around those controls.

- [ ] **Step 3: Add the lifecycle panel and wire it into admin pages**

```tsx
// src/features/admin/components/OperatorLifecyclePanel.tsx
export function OperatorLifecyclePanel() {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-4 text-sm text-muted-foreground">
      <p className="font-medium text-foreground">Lifecycle actions</p>
      <p>Selection, offering, refill, and attendance actions stay grouped here.</p>
    </div>
  );
}
```

```tsx
// src/pages/admin/AdminEventRequestsPage.tsx
<SectionHeader
  title="Submitted for review"
  description="Approve a submitted request to publish the gathering, or reject it."
/>
```

```tsx
// src/pages/admin/OperatorEventDashboardPage.tsx
import { OperatorLifecyclePanel } from '@/features/admin/components/OperatorLifecyclePanel';

<OperatorLifecyclePanel />
```

- [ ] **Step 4: Run admin verification and typecheck**

Run:

```bash
npx playwright test e2e/host-admin-foundation.spec.ts --project=chromium
npm run typecheck
```

Expected: PASS on both commands

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/AdminEventRequestsPage.tsx src/pages/admin/OperatorEventDashboardPage.tsx src/features/admin/components/OperatorLifecyclePanel.tsx e2e/host-admin-foundation.spec.ts
git commit -m "feat: normalize admin lifecycle action surfaces"
```

## Task 4: Add Admin Diagnostics and Audit Placeholders to the Admin Dashboard

**Files:**
- Modify: `src/pages/admin/OperatorEventDashboardPage.tsx`
- Modify: `src/pages/admin/OperatorEventDiagnosticsPage.tsx`
- Modify: `src/pages/admin/OperatorEventAuditPage.tsx`
- Create: `src/features/admin/components/OperatorDiagnosticsPanel.tsx`
- Create: `src/features/admin/components/OperatorAuditPlaceholder.tsx`
- Modify: `e2e/host-admin-foundation.spec.ts`

- [ ] **Step 1: Write the failing admin navigation test**

```ts
test('admin dashboard links to diagnostics and audit surfaces', async ({ browser }) => {
  const ctx = await browser.newContext();
  await authenticateAs(ctx, ENV.EMAILS.ADMIN1);
  const page = await ctx.newPage();

  await page.goto(`/admin/events/${ENV.EVENT_ID}`);
  await page.getByRole('link', { name: 'Diagnostics' }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/events/${ENV.EVENT_ID}/diagnostics`));
  await expect(page.getByRole('heading', { name: 'Operator diagnostics' })).toBeVisible();

  await ctx.close();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npx playwright test e2e/host-admin-foundation.spec.ts --project=chromium
```

Expected: FAIL because `OperatorEventDashboardPage.tsx` does not yet expose links into the new internal routes.

- [ ] **Step 3: Add admin dashboard links and internal placeholder components**

```tsx
// src/features/admin/components/OperatorDiagnosticsPanel.tsx
export function OperatorDiagnosticsPanel() {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-4 text-sm text-muted-foreground">
      <p className="font-medium text-foreground">Diagnostics placeholder</p>
      <p>Reserved for internal logs, RPC visibility, and state checks.</p>
    </div>
  );
}
```

```tsx
// src/features/admin/components/OperatorAuditPlaceholder.tsx
export function OperatorAuditPlaceholder() {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-4 text-sm text-muted-foreground">
      <p className="font-medium text-foreground">Audit placeholder</p>
      <p>Reserved for lifecycle history, operator notes, and future traceability data.</p>
    </div>
  );
}
```

```tsx
// src/pages/admin/OperatorEventDashboardPage.tsx (add action bar links)
<div className="mb-4 flex flex-wrap gap-3">
  <Button asChild variant="outline" size="sm">
    <Link to={`/admin/events/${eventId}/diagnostics`}>Diagnostics</Link>
  </Button>
  <Button asChild variant="outline" size="sm">
    <Link to={`/admin/events/${eventId}/audit`}>Audit</Link>
  </Button>
</div>
```

```tsx
// src/pages/admin/OperatorEventAuditPage.tsx
import { OperatorAuditPlaceholder } from '@/features/admin/components/OperatorAuditPlaceholder';

<OperatorAuditPlaceholder />
```

- [ ] **Step 4: Run host/admin verification and typecheck**

Run:

```bash
npx playwright test e2e/host-admin-foundation.spec.ts --project=chromium
npm run typecheck
```

Expected: PASS on both commands

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/OperatorEventDashboardPage.tsx src/pages/admin/OperatorEventDiagnosticsPage.tsx src/pages/admin/OperatorEventAuditPage.tsx src/features/admin/components/OperatorDiagnosticsPanel.tsx src/features/admin/components/OperatorAuditPlaceholder.tsx e2e/host-admin-foundation.spec.ts
git commit -m "feat: add operator diagnostics and audit routes"
```

## Task 5: Lock Host/Admin Guardrails With Regression Coverage

**Files:**
- Modify: `e2e/host-admin-foundation.spec.ts`

- [ ] **Step 1: Add the final failing guardrail tests**

```ts
test('non-admin users cannot open admin diagnostics', async ({ browser }) => {
  const ctx = await browser.newContext();
  await authenticateAs(ctx, ENV.EMAILS.HOST1);
  const page = await ctx.newPage();

  await page.goto('/admin/events/future-event/diagnostics');
  await expect(page).toHaveURL('/');

  await ctx.close();
});

test('host registrations summary does not claim admin powers', async ({ browser }) => {
  const ctx = await browser.newContext();
  await authenticateAs(ctx, ENV.EMAILS.HOST1);
  const page = await ctx.newPage();

  await page.goto('/host/events/future-event/registrations');
  await expect(page.getByText(/אין כאן שמות משתתפים או שליטה בבחירה/i)).toBeVisible();

  await ctx.close();
});
```

- [ ] **Step 2: Run the host/admin suite**

Run:

```bash
npx playwright test e2e/host-admin-foundation.spec.ts --project=chromium
```

Expected: FAIL if the host/admin split got blurred or if admin guards regress.

- [ ] **Step 3: Fix any permission or copy regressions without changing `AdminRoute` semantics**

```tsx
// src/app/router/guards.tsx (leave this behavior intact)
if (!user || !isAdmin) {
  return <Navigate to="/" replace />;
}
```

```tsx
// host placeholder copy should stay explicit
<PlaceholderPanel
  title="Host registrations summary"
  contractState="stubbed"
  body="אין כאן שמות משתתפים או שליטה בבחירה. המסך הזה נשאר ברמת סיכום בלבד."
/>
```

- [ ] **Step 4: Run the final host/admin verification pass**

Run:

```bash
npx playwright test e2e/host-admin-foundation.spec.ts --project=chromium
npm run typecheck
```

Expected: PASS on both commands

- [ ] **Step 5: Commit**

```bash
git add e2e/host-admin-foundation.spec.ts src/app/router/guards.tsx src/pages/host/HostEventRegistrationsPage.tsx
git commit -m "test: lock host and admin guardrails"
```

## Self-Review Notes

- Spec coverage: This plan covers host workspace routes, host sub-surfaces, admin diagnostics/audit placeholders, and the host/admin permission boundary.
- Placeholder scan: Every placeholder surface in this plan has concrete copy and an explicit contract stance; no vague "implement later" markers should remain.
- Type consistency: Reuse the exact names `HostSummaryStat`, `HostMilestoneRail`, `OperatorDiagnosticsPanel`, and `OperatorAuditPlaceholder` throughout the implementation.
