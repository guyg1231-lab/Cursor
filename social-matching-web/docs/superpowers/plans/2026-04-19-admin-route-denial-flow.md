# Admin Route Denial Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `AdminRoute` treat signed-out users like other protected routes and show a clear denial state to signed-in non-admin users.

**Architecture:** Keep the change centered in the shared routing layer. Extend the shared route-state primitive with a small optional action slot, update `AdminRoute` to split loading / signed-out / non-admin / admin cases, and widen the auth return-to whitelist so `/admin/*` and `/team/gathering/*` deep links survive the sign-in redirect.

**Tech Stack:** React 18, React Router 6, TypeScript, shared route-state primitives, Playwright.

---

## File map

- **Modify:** `src/components/shared/RouteState.tsx` - add a narrow optional action slot for route-state cards, used by `RouteGatedState`.
- **Modify:** `src/app/router/guards.tsx` - split `AdminRoute` into loading, signed-out, denied, and allowed branches.
- **Modify:** `src/lib/authReturnTo.ts` - allow admin deep links and `/team/gathering/:eventId` to round-trip through auth safely.
- **Modify:** `e2e/foundation-routes.spec.ts` - add negative-path coverage for signed-out and signed-in-non-admin admin-route access.
- **Modify:** `docs/foundation-tickets/2026-04-20-05-adminroute-redirect-inconsistency.md` - mark ticket progress.
- **Modify:** `docs/foundation-tickets/README.md` - keep F-5 status aligned.

## Task 1: Cover the two broken admin denial paths

**Files:**
- Modify: `e2e/foundation-routes.spec.ts`

- [ ] **Step 1: Write the failing tests**

```ts
  test('signed-out admin route preserves returnTo through sign-in', async ({ page }) => {
    await page.goto('/admin/events/future-event/diagnostics');
    await expect(page).toHaveURL(/\/(sign-in|auth)(\?|$)/);
    await expect(page).toHaveURL(/returnTo=.*admin.*events.*future-event.*diagnostics/);
    await expect(page.getByText(/כניסה|אימות/i).first()).toBeVisible();
  });

  test('signed-in non-admin sees an explicit denied state on admin routes', async ({ browser }) => {
    const ctx = await browser.newContext();
    try {
      await authenticateAs(ctx, ENV.EMAILS.P1);
      const page = await ctx.newPage();

      await page.goto('/admin/events/future-event/diagnostics');

      await expect(page).toHaveURL(/\/admin\/events\/future-event\/diagnostics$/);
      await expect(page.getByText('אין לך גישה לעמוד הזה', { exact: true })).toBeVisible();
      await expect(page.getByText('העמוד הזה זמין רק לצוות התפעול.', { exact: true })).toBeVisible();
      await expect(page.getByRole('link', { name: 'חזרה לדף הבית' })).toHaveAttribute('href', '/');
    } finally {
      await ctx.close();
    }
  });
```

- [ ] **Step 2: Run the focused test command and verify RED**

Run:

```bash
npx playwright test e2e/foundation-routes.spec.ts --project=chromium -g "admin route|denied state"
```

Expected: FAIL because signed-out `/admin/*` drops the return target and signed-in non-admin users are still redirected to `/`.

## Task 2: Add the smallest shared route-state hook needed for a CTA

**Files:**
- Modify: `src/components/shared/RouteState.tsx`

- [ ] **Step 1: Write the minimal implementation**

```tsx
import type { ReactNode } from 'react';

type RouteStateCardProps = {
  title: string;
  body: string;
  tone?: 'default' | 'danger';
  action?: ReactNode;
};

type RouteGatedStateProps = {
  title: string;
  body: string;
  action?: ReactNode;
};

function RouteStateCard({ title, body, tone = 'default', action }: RouteStateCardProps) {
  return (
    <Card className={tokens.card.surface}>
      <CardContent className={...}>
        <p className="font-medium text-foreground">{title}</p>
        <p>{body}</p>
        {action ? <div className="pt-2">{action}</div> : null}
      </CardContent>
    </Card>
  );
}

export function RouteGatedState({ title, body, action }: RouteGatedStateProps) {
  return <RouteStateCard title={title} body={body} action={action} />;
}
```

- [ ] **Step 2: Run typecheck for the shared primitive**

Run:

```bash
npm run typecheck
```

Expected: PASS.

## Task 3: Split `AdminRoute` into signed-out and denied branches

**Files:**
- Modify: `src/app/router/guards.tsx`
- Modify: `src/lib/authReturnTo.ts`

- [ ] **Step 1: Update the safe return-to whitelist**

```ts
  if (pathname === '/admin') return true;
  if (pathname === '/admin/events') return true;
  if (pathname === '/admin/event-requests') return true;
  if (pathname === '/admin/events/new') return true;

  if (pathname.startsWith('/admin/events/')) {
    const match = pathname.match(
      /^\/admin\/events\/([a-zA-Z0-9_-]+)(\/diagnostics|\/audit)?$/,
    );
    return !!match;
  }

  if (pathname.startsWith('/team/gathering/')) {
    const match = pathname.match(/^\/team\/gathering\/([a-zA-Z0-9_-]+)$/);
    return !!match;
  }
```

- [ ] **Step 2: Update `AdminRoute` with the four-case flow**

```tsx
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RouteGatedState, RouteLoadingState } from '@/components/shared/RouteState';

export function AdminRoute({ children }: PropsWithChildren) {
  const { user, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <RouteLoadingState />;
  }

  if (!user) {
    const attemptedPath = parseSafeReturnTo(`${location.pathname}${location.search}`);
    storePostAuthReturnTo(attemptedPath);
    return <Navigate to={buildAuthPath(attemptedPath)} replace />;
  }

  if (!isAdmin) {
    return (
      <RouteGatedState
        title="אין לך גישה לעמוד הזה"
        body="העמוד הזה זמין רק לצוות התפעול."
        action={
          <Button asChild variant="outline">
            <Link to="/">חזרה לדף הבית</Link>
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}
```

- [ ] **Step 3: Re-run the focused Playwright command and verify GREEN**

Run:

```bash
npx playwright test e2e/foundation-routes.spec.ts --project=chromium -g "admin route|denied state"
```

Expected: PASS.

## Task 4: Run the full verification gate and update ticket tracking

**Files:**
- Modify: `docs/foundation-tickets/2026-04-20-05-adminroute-redirect-inconsistency.md`
- Modify: `docs/foundation-tickets/README.md`

- [ ] **Step 1: Mark F-5 as in progress**

```md
- **Status:** in-progress
```

and

```md
| [F-5: AdminRoute silent redirect](2026-04-20-05-adminroute-redirect-inconsistency.md) | in-progress | Admin UX, guard testability |
```

- [ ] **Step 2: Run repo verification**

Run:

```bash
npm run typecheck
npx playwright test --project=chromium
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/RouteState.tsx src/app/router/guards.tsx src/lib/authReturnTo.ts e2e/foundation-routes.spec.ts docs/foundation-tickets/2026-04-20-05-adminroute-redirect-inconsistency.md docs/foundation-tickets/README.md
git commit -m "feat(foundation): clarify admin route denial flows"
```

---

## Self-review

- Spec coverage: covers the signed-out admin redirect, the signed-in non-admin denial UI, the required CTA, and the needed auth-return whitelist update.
- Placeholder scan: no TBDs or implicit “handle this somehow” steps remain.
- Type consistency: the plan keeps the new route-state extension narrow (`action` only) and uses the same Hebrew copy and CTA text in tests and implementation.
