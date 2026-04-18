# Shared Foundation Normalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the shared route, state, and placeholder foundation that lets two developers work in parallel without colliding on app-shell decisions.

**Architecture:** Add a small shared foundation layer under `src/app/router` and `src/components/shared` that defines route metadata, reusable route-state components, and minimal placeholder panels. Register placeholder routes for future host and admin/operator surfaces immediately, so follow-up work can stay inside separate product lanes.

**Tech Stack:** React 18, TypeScript, React Router 6, Tailwind, Supabase client, Playwright

---

## File Map

- Create: `src/app/router/routeManifest.ts` — app route metadata used by product workstreams and future audits
- Create: `src/components/shared/RouteState.tsx` — reusable loading, empty, error, unavailable, and not-found state blocks
- Create: `src/components/shared/SectionHeader.tsx` — standardized section header with title, support copy, and actions slot
- Create: `src/components/shared/PageActionBar.tsx` — standardized action row for page-level actions
- Create: `src/components/shared/StatusBadge.tsx` — reusable status pill primitive
- Create: `src/components/shared/PlaceholderPanel.tsx` — minimal contract-first placeholder summary panel
- Modify: `src/components/shared/PageShell.tsx` — confirm the shell prop surface supports the shared title/subtitle/action layout
- Create: `src/pages/host/HostEventWorkspacePage.tsx`
- Create: `src/pages/host/HostEventRegistrationsPage.tsx`
- Create: `src/pages/host/HostEventCommunicationsPage.tsx`
- Create: `src/pages/host/HostEventFollowUpPage.tsx`
- Create: `src/pages/admin/OperatorEventDiagnosticsPage.tsx`
- Create: `src/pages/admin/OperatorEventAuditPage.tsx`
- Modify: `src/app/router/AppRouter.tsx`
- Test: `e2e/foundation-routes.spec.ts`

## Task 1: Route Manifest and Shared Route-State Primitives

**Files:**
- Create: `src/app/router/routeManifest.ts`
- Create: `src/components/shared/RouteState.tsx`
- Create: `src/components/shared/SectionHeader.tsx`
- Create: `src/components/shared/PageActionBar.tsx`
- Create: `src/components/shared/StatusBadge.tsx`
- Create: `src/components/shared/PlaceholderPanel.tsx`
- Test: `e2e/foundation-routes.spec.ts`

- [ ] **Step 1: Write the failing smoke test for the new shared placeholder contract**

```ts
import { test, expect } from '@playwright/test';
import { authenticateAs } from './fixtures/auth';
import { ENV } from './fixtures/env';

test.describe('foundation routes', () => {
  test('host placeholder routes render a stable heading and placeholder panel', async ({ browser }) => {
    const ctx = await browser.newContext();
    await authenticateAs(ctx, ENV.EMAILS.HOST1);
    const page = await ctx.newPage();

    await page.goto('/host/events/future-workspace');
    await expect(page.getByRole('heading', { name: 'Host event workspace' })).toBeVisible();
    await expect(page.getByText('This surface is intentionally minimal for now.')).toBeVisible();

    await ctx.close();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npx playwright test e2e/foundation-routes.spec.ts --project=chromium
```

Expected: FAIL with a 404/route-missing result because `/host/events/future-workspace` is not registered yet.

- [ ] **Step 3: Write the minimal shared foundation files**

```ts
// src/app/router/routeManifest.ts
export type Workstream = 'shared' | 'participant' | 'host' | 'admin';
export type RouteDataStatus = 'real' | 'mixed' | 'stubbed';
export type RouteClassification =
  | 'Existing and keep'
  | 'Existing but normalize'
  | 'Existing but expand'
  | 'Add placeholder now'
  | 'Later, no route yet';

export type RouteManifestEntry = {
  path: string;
  workstream: Workstream;
  auth: 'public' | 'protected' | 'admin';
  dataStatus: RouteDataStatus;
  classification: RouteClassification;
  supportedStates: Array<'loading' | 'empty' | 'error' | 'not_found' | 'gated' | 'unavailable' | 'success'>;
  nextSteps: string[];
};

export const routeManifest: RouteManifestEntry[] = [
  { path: '/', workstream: 'participant', auth: 'public', dataStatus: 'real', classification: 'Existing and keep', supportedStates: ['success'], nextSteps: ['/events', '/questionnaire'] },
  { path: '/auth', workstream: 'participant', auth: 'public', dataStatus: 'real', classification: 'Existing and keep', supportedStates: ['loading', 'error', 'success'], nextSteps: ['/auth/callback'] },
  { path: '/sign-in', workstream: 'participant', auth: 'public', dataStatus: 'real', classification: 'Existing and keep', supportedStates: ['loading', 'error', 'success'], nextSteps: ['/auth/callback'] },
  { path: '/auth/callback', workstream: 'participant', auth: 'public', dataStatus: 'real', classification: 'Existing and keep', supportedStates: ['loading', 'error', 'success'], nextSteps: ['/dashboard'] },
  { path: '/events', workstream: 'participant', auth: 'public', dataStatus: 'real', classification: 'Existing but normalize', supportedStates: ['loading', 'empty', 'error', 'success'], nextSteps: ['/events/:eventId'] },
  { path: '/events/:eventId', workstream: 'participant', auth: 'public', dataStatus: 'real', classification: 'Existing but expand', supportedStates: ['loading', 'error', 'not_found', 'success'], nextSteps: ['/events/:eventId/apply', '/events'] },
  { path: '/events/:eventId/apply', workstream: 'participant', auth: 'protected', dataStatus: 'real', classification: 'Existing but expand', supportedStates: ['loading', 'error', 'gated', 'unavailable', 'success'], nextSteps: ['/dashboard', '/questionnaire'] },
  { path: '/questionnaire', workstream: 'participant', auth: 'public', dataStatus: 'real', classification: 'Existing and keep', supportedStates: ['loading', 'error', 'success'], nextSteps: ['/events', '/dashboard'] },
  { path: '/dashboard', workstream: 'participant', auth: 'protected', dataStatus: 'real', classification: 'Existing but expand', supportedStates: ['loading', 'empty', 'error', 'success'], nextSteps: ['/questionnaire', '/events'] },
  { path: '/gathering/:eventId', workstream: 'participant', auth: 'public', dataStatus: 'real', classification: 'Existing but normalize', supportedStates: ['loading', 'error', 'not_found', 'success'], nextSteps: ['/events/:eventId', '/dashboard'] },
  { path: '/host/events', workstream: 'host', auth: 'protected', dataStatus: 'real', classification: 'Existing but expand', supportedStates: ['loading', 'empty', 'error', 'success'], nextSteps: ['/host/events/:eventId'] },
  { path: '/host/events/:eventId', workstream: 'host', auth: 'protected', dataStatus: 'stubbed', classification: 'Add placeholder now', supportedStates: ['loading', 'error', 'unavailable', 'success'], nextSteps: ['/host/events/:eventId/registrations', '/host/events/:eventId/communications', '/host/events/:eventId/follow-up'] },
  { path: '/host/events/:eventId/registrations', workstream: 'host', auth: 'protected', dataStatus: 'stubbed', classification: 'Add placeholder now', supportedStates: ['loading', 'empty', 'error', 'unavailable', 'success'], nextSteps: ['/host/events/:eventId'] },
  { path: '/host/events/:eventId/communications', workstream: 'host', auth: 'protected', dataStatus: 'stubbed', classification: 'Add placeholder now', supportedStates: ['loading', 'empty', 'error', 'unavailable', 'success'], nextSteps: ['/host/events/:eventId'] },
  { path: '/host/events/:eventId/follow-up', workstream: 'host', auth: 'protected', dataStatus: 'stubbed', classification: 'Add placeholder now', supportedStates: ['loading', 'empty', 'error', 'unavailable', 'success'], nextSteps: ['/host/events/:eventId'] },
  { path: '/admin', workstream: 'admin', auth: 'admin', dataStatus: 'real', classification: 'Existing and keep', supportedStates: ['loading', 'gated', 'success'], nextSteps: ['/admin/events'] },
  { path: '/admin/events', workstream: 'admin', auth: 'admin', dataStatus: 'real', classification: 'Existing and keep', supportedStates: ['loading', 'empty', 'error', 'success'], nextSteps: ['/admin/events/new', '/admin/events/:eventId'] },
  { path: '/admin/event-requests', workstream: 'admin', auth: 'admin', dataStatus: 'real', classification: 'Existing but expand', supportedStates: ['loading', 'empty', 'error', 'success'], nextSteps: ['/admin/events/:eventId', '/admin/events'] },
  { path: '/admin/events/new', workstream: 'admin', auth: 'admin', dataStatus: 'real', classification: 'Existing and keep', supportedStates: ['loading', 'error', 'success'], nextSteps: ['/admin/events/:eventId'] },
  { path: '/admin/events/:eventId', workstream: 'admin', auth: 'admin', dataStatus: 'real', classification: 'Existing but expand', supportedStates: ['loading', 'error', 'not_found', 'success'], nextSteps: ['/admin/events/:eventId/diagnostics', '/admin/events/:eventId/audit', '/team/gathering/:eventId'] },
  { path: '/team/gathering/:eventId', workstream: 'admin', auth: 'admin', dataStatus: 'real', classification: 'Existing and keep', supportedStates: ['loading', 'error', 'not_found', 'success'], nextSteps: ['/admin/events/:eventId'] },
  { path: '/admin/events/:eventId/diagnostics', workstream: 'admin', auth: 'admin', dataStatus: 'stubbed', classification: 'Add placeholder now', supportedStates: ['loading', 'error', 'unavailable', 'success'], nextSteps: ['/admin/events/:eventId'] },
  { path: '/admin/events/:eventId/audit', workstream: 'admin', auth: 'admin', dataStatus: 'stubbed', classification: 'Add placeholder now', supportedStates: ['loading', 'error', 'unavailable', 'success'], nextSteps: ['/admin/events/:eventId'] },
  { path: '/host/settings', workstream: 'host', auth: 'protected', dataStatus: 'stubbed', classification: 'Later, no route yet', supportedStates: ['unavailable'], nextSteps: ['/host/events'] },
];
```

```tsx
// src/components/shared/RouteState.tsx
import { Card, CardContent } from '@/components/ui/card';
import { tokens } from '@/lib/design-tokens';

type RouteStateProps = {
  title: string;
  body: string;
  tone?: 'default' | 'danger';
};

function RouteStateCard({ title, body, tone = 'default' }: RouteStateProps) {
  return (
    <Card className={tokens.card.surface}>
      <CardContent className={`space-y-2 py-8 text-sm ${tone === 'danger' ? 'text-destructive' : 'text-muted-foreground'}`}>
        <p className="font-medium text-foreground">{title}</p>
        <p>{body}</p>
      </CardContent>
    </Card>
  );
}

export function RouteLoadingState({ title = 'Loading…' }: { title?: string }) {
  return <RouteStateCard title={title} body="Please wait while this page loads." />;
}

export function RouteEmptyState({ title, body }: RouteStateProps) {
  return <RouteStateCard title={title} body={body} />;
}

export function RouteUnavailableState({ title, body }: RouteStateProps) {
  return <RouteStateCard title={title} body={body} />;
}

export function RouteErrorState({ title, body }: RouteStateProps) {
  return <RouteStateCard title={title} body={body} tone="danger" />;
}

export function RouteNotFoundState({ title, body }: RouteStateProps) {
  return <RouteStateCard title={title} body={body} />;
}

export function RouteGatedState({ title, body }: RouteStateProps) {
  return <RouteStateCard title={title} body={body} />;
}

export function RouteSuccessState({ title, body }: RouteStateProps) {
  return <RouteStateCard title={title} body={body} />;
}
```

```tsx
// src/components/shared/PlaceholderPanel.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { tokens } from '@/lib/design-tokens';

export function PlaceholderPanel({
  title,
  body,
  contractState,
}: {
  title: string;
  body: string;
  contractState: 'real' | 'mixed' | 'stubbed';
}) {
  return (
    <Card className={tokens.card.surface}>
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-xl">{title}</CardTitle>
          <StatusBadge label={contractState} tone={contractState === 'stubbed' ? 'muted' : 'default'} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>This surface is intentionally minimal for now.</p>
        <p>{body}</p>
      </CardContent>
    </Card>
  );
}
```

```tsx
// src/components/shared/SectionHeader.tsx
import type { ReactNode } from 'react';

export function SectionHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-1">
        <h2 className="text-xl text-foreground">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
```

```tsx
// src/components/shared/PageActionBar.tsx
import type { PropsWithChildren } from 'react';

export function PageActionBar({ children }: PropsWithChildren) {
  return <div className="mb-4 flex flex-wrap gap-3">{children}</div>;
}
```

```tsx
// src/components/shared/StatusBadge.tsx
export function StatusBadge({
  label,
  tone = 'default',
}: {
  label: string;
  tone?: 'default' | 'muted';
}) {
  const className =
    tone === 'muted'
      ? 'rounded-full border border-border px-2 py-1 text-xs text-muted-foreground'
      : 'rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-xs text-foreground';

  return <span className={className}>{label}</span>;
}
```

- [ ] **Step 4: Run typecheck to verify the new shared files compile**

Run:

```bash
npm run typecheck
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/router/routeManifest.ts src/components/shared/RouteState.tsx src/components/shared/SectionHeader.tsx src/components/shared/PageActionBar.tsx src/components/shared/StatusBadge.tsx src/components/shared/PlaceholderPanel.tsx
git commit -m "feat: add shared route foundation primitives"
```

## Task 2: Register Host and Admin Placeholder Routes

**Files:**
- Modify: `src/app/router/AppRouter.tsx`
- Create: `src/pages/host/HostEventWorkspacePage.tsx`
- Create: `src/pages/host/HostEventRegistrationsPage.tsx`
- Create: `src/pages/host/HostEventCommunicationsPage.tsx`
- Create: `src/pages/host/HostEventFollowUpPage.tsx`
- Create: `src/pages/admin/OperatorEventDiagnosticsPage.tsx`
- Create: `src/pages/admin/OperatorEventAuditPage.tsx`
- Test: `e2e/foundation-routes.spec.ts`

- [ ] **Step 1: Extend the failing test to cover admin placeholder routes too**

```ts
test('admin placeholder routes render behind admin guard', async ({ browser }) => {
  const ctx = await browser.newContext();
  await authenticateAs(ctx, ENV.EMAILS.ADMIN1);
  const page = await ctx.newPage();

  await page.goto('/admin/events/future-event/diagnostics');
  await expect(page.getByRole('heading', { name: 'Operator diagnostics' })).toBeVisible();
  await expect(page.getByText('This surface is intentionally minimal for now.')).toBeVisible();

  await ctx.close();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npx playwright test e2e/foundation-routes.spec.ts --project=chromium
```

Expected: FAIL because the new host/admin placeholder routes are still missing from `AppRouter.tsx`.

- [ ] **Step 3: Write the minimal placeholder pages and register them**

```tsx
// src/pages/host/HostEventWorkspacePage.tsx
import { useParams } from 'react-router-dom';
import { PageShell } from '@/components/shared/PageShell';
import { PlaceholderPanel } from '@/components/shared/PlaceholderPanel';

export function HostEventWorkspacePage() {
  const { eventId } = useParams();

  return (
    <PageShell title="Host event workspace" subtitle={`Event ${eventId ?? 'unknown'}`}>
      <PlaceholderPanel
        title="Host event workspace"
        contractState="stubbed"
        body="This route is reserved for host-only event overview, milestones, and next-step navigation."
      />
    </PageShell>
  );
}
```

```tsx
// src/pages/admin/OperatorEventDiagnosticsPage.tsx
import { useParams } from 'react-router-dom';
import { PageShell } from '@/components/shared/PageShell';
import { PlaceholderPanel } from '@/components/shared/PlaceholderPanel';

export function OperatorEventDiagnosticsPage() {
  const { eventId } = useParams();

  return (
    <PageShell variant="minimal" title="Operator diagnostics" subtitle={`Event ${eventId ?? 'unknown'}`}>
      <PlaceholderPanel
        title="Operator diagnostics"
        contractState="stubbed"
        body="This route is reserved for internal logs, state checks, and operator-only diagnostics."
      />
    </PageShell>
  );
}
```

```tsx
// src/app/router/AppRouter.tsx (additions only)
<Route
  path="/host/events/:eventId"
  element={
    <ProtectedRoute>
      <HostEventWorkspacePage />
    </ProtectedRoute>
  }
/>
<Route
  path="/host/events/:eventId/registrations"
  element={
    <ProtectedRoute>
      <HostEventRegistrationsPage />
    </ProtectedRoute>
  }
/>
<Route
  path="/host/events/:eventId/communications"
  element={
    <ProtectedRoute>
      <HostEventCommunicationsPage />
    </ProtectedRoute>
  }
/>
<Route
  path="/host/events/:eventId/follow-up"
  element={
    <ProtectedRoute>
      <HostEventFollowUpPage />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/events/:eventId/diagnostics"
  element={
    <AdminRoute>
      <OperatorEventDiagnosticsPage />
    </AdminRoute>
  }
/>
<Route
  path="/admin/events/:eventId/audit"
  element={
    <AdminRoute>
      <OperatorEventAuditPage />
    </AdminRoute>
  }
/>
```

```tsx
// src/components/shared/PageShell.tsx (only if needed)
type PageShellProps = {
  title: string;
  subtitle?: string;
  variant?: 'default' | 'minimal';
  headerTransparent?: boolean;
};
```

- [ ] **Step 4: Run the foundation smoke test again**

Run:

```bash
npx playwright test e2e/foundation-routes.spec.ts --project=chromium
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/router/AppRouter.tsx src/pages/host/HostEventWorkspacePage.tsx src/pages/host/HostEventRegistrationsPage.tsx src/pages/host/HostEventCommunicationsPage.tsx src/pages/host/HostEventFollowUpPage.tsx src/pages/admin/OperatorEventDiagnosticsPage.tsx src/pages/admin/OperatorEventAuditPage.tsx e2e/foundation-routes.spec.ts
git commit -m "feat: register host and operator placeholder routes"
```

## Task 3: Normalize Shared Layout Usage for Placeholder Surfaces

**Files:**
- Modify: `src/pages/host/HostEventWorkspacePage.tsx`
- Modify: `src/pages/host/HostEventRegistrationsPage.tsx`
- Modify: `src/pages/host/HostEventCommunicationsPage.tsx`
- Modify: `src/pages/host/HostEventFollowUpPage.tsx`
- Modify: `src/pages/admin/OperatorEventDiagnosticsPage.tsx`
- Modify: `src/pages/admin/OperatorEventAuditPage.tsx`
- Test: `e2e/foundation-routes.spec.ts`

- [ ] **Step 1: Write the failing assertion for standard actions and secondary copy**

```ts
test('placeholder routes expose a consistent back-link and purpose copy', async ({ browser }) => {
  const ctx = await browser.newContext();
  await authenticateAs(ctx, ENV.EMAILS.ADMIN1);
  const page = await ctx.newPage();

  await page.goto('/admin/events/future-event/audit');
  await expect(page.getByRole('link', { name: 'Back to event dashboard' })).toBeVisible();
  await expect(page.getByText('Reserved for a later implementation pass.')).toBeVisible();

  await ctx.close();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npx playwright test e2e/foundation-routes.spec.ts --project=chromium
```

Expected: FAIL because the placeholder pages do not yet share the standard action row and support copy.

- [ ] **Step 3: Add shared layout usage to each placeholder page**

```tsx
// example pattern for each placeholder page
import { Link } from 'react-router-dom';
import { PageActionBar } from '@/components/shared/PageActionBar';
import { SectionHeader } from '@/components/shared/SectionHeader';

<PageActionBar>
  <Button asChild variant="outline" size="sm">
    <Link to="/admin/events">Back to event dashboard</Link>
  </Button>
</PageActionBar>

<SectionHeader
  title="Operator audit"
  description="Reserved for a later implementation pass."
/>
```

- [ ] **Step 4: Run the smoke test and typecheck**

Run:

```bash
npx playwright test e2e/foundation-routes.spec.ts --project=chromium
npm run typecheck
```

Expected: PASS on both commands

- [ ] **Step 5: Commit**

```bash
git add src/pages/host/HostEventWorkspacePage.tsx src/pages/host/HostEventRegistrationsPage.tsx src/pages/host/HostEventCommunicationsPage.tsx src/pages/host/HostEventFollowUpPage.tsx src/pages/admin/OperatorEventDiagnosticsPage.tsx src/pages/admin/OperatorEventAuditPage.tsx e2e/foundation-routes.spec.ts
git commit -m "refactor: normalize placeholder route layout"
```

## Task 4: Lock the Shared Foundation for Parallel Work

**Files:**
- Modify: `e2e/foundation-routes.spec.ts`
- Modify: `src/app/router/routeManifest.ts`

- [ ] **Step 1: Add the final failing test for route ownership metadata**

```ts
import { routeManifest } from '@/app/router/routeManifest';

test('route manifest tracks host and admin placeholder ownership', async () => {
  expect(routeManifest).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ path: '/auth', workstream: 'participant', auth: 'public' }),
      expect.objectContaining({ path: '/events/:eventId/apply', workstream: 'participant', auth: 'protected' }),
      expect.objectContaining({ path: '/host/events', workstream: 'host', auth: 'protected' }),
      expect.objectContaining({ path: '/host/events/:eventId', workstream: 'host', auth: 'protected' }),
      expect.objectContaining({ path: '/admin/event-requests', workstream: 'admin', auth: 'admin' }),
      expect.objectContaining({ path: '/admin/events/:eventId/diagnostics', workstream: 'admin', auth: 'admin' }),
    ]),
  );
});
```

- [ ] **Step 2: Run the test to verify it fails if the manifest is incomplete**

Run:

```bash
npx playwright test e2e/foundation-routes.spec.ts --project=chromium
```

Expected: FAIL if the manifest still omits any of the placeholder route entries.

- [ ] **Step 3: Fill out the route manifest with all shared-foundation routes**

```ts
// src/app/router/routeManifest.ts (additions only)
{ path: '/host/events/:eventId/registrations', workstream: 'host', auth: 'protected', dataStatus: 'stubbed', classification: 'Add placeholder now', supportedStates: ['loading', 'empty', 'error', 'unavailable', 'success'], nextSteps: ['/host/events/:eventId'] },
{ path: '/host/events/:eventId/communications', workstream: 'host', auth: 'protected', dataStatus: 'stubbed', classification: 'Add placeholder now', supportedStates: ['loading', 'empty', 'error', 'unavailable', 'success'], nextSteps: ['/host/events/:eventId'] },
{ path: '/host/events/:eventId/follow-up', workstream: 'host', auth: 'protected', dataStatus: 'stubbed', classification: 'Add placeholder now', supportedStates: ['loading', 'empty', 'error', 'unavailable', 'success'], nextSteps: ['/host/events/:eventId'] },
{ path: '/admin/events/:eventId/audit', workstream: 'admin', auth: 'admin', dataStatus: 'stubbed', classification: 'Add placeholder now', supportedStates: ['loading', 'error', 'unavailable', 'success'], nextSteps: ['/admin/events/:eventId'] },
```

- [ ] **Step 4: Run the final foundation verification pass**

Run:

```bash
npx playwright test e2e/foundation-routes.spec.ts --project=chromium
npm run typecheck
```

Expected: PASS on both commands

- [ ] **Step 5: Commit**

```bash
git add src/app/router/routeManifest.ts e2e/foundation-routes.spec.ts
git commit -m "test: lock route foundation for parallel work"
```

## Self-Review Notes

- Spec coverage: This plan covers shared foundation requirements, route inventory, placeholder standards, core placeholder routes, and foundation verification.
- Placeholder scan: No TBD/TODO markers should remain in the plan or the implemented files.
- Type consistency: Follow the exact exported names in this plan: `routeManifest`, `RouteLoadingState`, `RouteUnavailableState`, `PageActionBar`, `SectionHeader`, `StatusBadge`, and `PlaceholderPanel`.
