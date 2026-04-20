# Dashboard Lifecycle Compact Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify dashboard lifecycle rows with the shared lifecycle presentation layer while keeping the dashboard compact and adding a dedicated deadline line only for `awaiting_response`.

**Architecture:** Extend `src/features/applications/presentation.ts` with a compact dashboard-facing lifecycle helper derived from the same semantics as `resolveApplicationPanelContent`. Keep `ApplicationLifecycleList.tsx` as a thin renderer that owns CTA routing but no longer owns raw lifecycle prose. Protect the visible behavior with a targeted Playwright regression for the dashboard temporary-offer row, then run the full repo verification gate.

**Tech Stack:** React 18, TypeScript, React Router, Playwright, Supabase staging fixtures

---

## File map

- Modify: `src/features/applications/presentation.ts`
  - Add `resolveApplicationLifecycleRowContent(application)` and any tiny private helpers needed to derive compact row copy from shared lifecycle semantics.
- Modify: `src/features/applications/components/ApplicationLifecycleList.tsx`
  - Replace inline per-status prose with compact row content from `presentation.ts`.
- Modify: `e2e/participant-foundation.spec.ts`
  - Add a RED/GREEN regression for dashboard `awaiting_response` rendering.

---

### Task 1: Add the dashboard-offer regression test

**Files:**
- Modify: `e2e/participant-foundation.spec.ts`

- [ ] **Step 1: Write the failing test**

Add a new test near the existing dashboard lifecycle coverage:

```ts
test('dashboard awaiting-response row shows summary, deadline line, and response CTA', async ({ browser }) => {
  const admin = createServiceRoleClient();
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id')
    .eq('email', ENV.EMAILS.P1)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile?.id) throw new Error('E2E missing P1 profile');

  const futureExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  await withFlippedRegistrationStatus(
    admin,
    { userId: profile.id, eventId: ENV.EVENT_ID },
    {
      status: 'awaiting_response',
      expires_at: futureExpires,
      offered_at: new Date().toISOString(),
    },
    async () => {
      const ctx = await browser.newContext();
      try {
        await authenticateAs(ctx, ENV.EMAILS.P1);
        const page = await ctx.newPage();

        await page.goto('/dashboard');
        const appsCard = page.getByRole('heading', { level: 3, name: 'ההגשות שלך' }).locator('..').locator('..');
        await expect(appsCard.getByText('מקום זמני ממתין לתגובה', { exact: true })).toBeVisible();
        await expect(appsCard.getByText('נשמר עבורך מקום זמני. כדי לשמור עליו צריך לאשר בזמן.', { exact: true })).toBeVisible();
        await expect(appsCard.getByText(/מועד אחרון לתגובה:/)).toBeVisible();
        await expect(appsCard.getByRole('link', { name: 'לתגובה על המקום הזמני' })).toBeVisible();
      } finally {
        await ctx.close();
      }
    },
  );
});
```

- [ ] **Step 2: Run the targeted test to verify RED**

Run:

```bash
npx playwright test e2e/participant-foundation.spec.ts --project=chromium -g "dashboard awaiting-response row shows summary, deadline line, and response CTA"
```

Expected: FAIL because the dashboard currently renders a single inline sentence and does not include the separate summary/deadline structure.

---

### Task 2: Add compact lifecycle row content to `presentation.ts`

**Files:**
- Modify: `src/features/applications/presentation.ts`

- [ ] **Step 1: Add the row content type**

Add:

```ts
export type ApplicationLifecycleRowContent = {
  summary: string;
  deadlineLine?: string;
};
```

- [ ] **Step 2: Add a shared compact helper**

Implement:

```ts
export function resolveApplicationLifecycleRowContent(
  application: EventRegistrationRow,
): ApplicationLifecycleRowContent {
  if (isAwaitingParticipantResponse(application.status)) {
    if (isOfferExpired(application)) {
      return {
        summary: 'חלון התגובה למקום הזמני נסגר.',
        deadlineLine: application.expires_at
          ? `המועד שעבר: ${formatLifecycleDateTime(application.expires_at)}`
          : 'המועד לתגובה כבר עבר.',
      };
    }

    return {
      summary: 'נשמר עבורך מקום זמני. כדי לשמור עליו צריך לאשר בזמן.',
      deadlineLine: application.expires_at
        ? `מועד אחרון לתגובה: ${formatLifecycleDateTime(application.expires_at)}`
        : 'מועד אחרון לתגובה: לא צוין',
    };
  }

  if (isConfirmedParticipation(application.status)) {
    return { summary: 'המקום שלך למפגש הזה כבר שמור.' };
  }

  if (canReapplyToEvent(application.status)) {
    return { summary: `${formatApplicationStatusDetailed(application.status)} אפשר להגיש שוב אם המפגש עדיין פתוח.` };
  }

  if (application.status === 'attended' || application.status === 'no_show') {
    return { summary: formatApplicationStatusDetailed(application.status) };
  }

  if (application.status === 'waitlist') {
    return { summary: formatApplicationStatusDetailed(application.status) };
  }

  if (application.status === 'pending') {
    return { summary: 'ההגשה שלך נשמרה ונמצאת כרגע בבדיקה.' };
  }

  return { summary: formatApplicationStatusDetailed(application.status) };
}
```

- [ ] **Step 3: Keep panel content unchanged in behavior**

Do not change the public contract of:

```ts
export function resolveApplicationPanelContent(
  application: EventRegistrationRow,
): ApplicationPanelContent
```

If cleanup is helpful, extract small private helpers, but preserve the visible copy already used by apply/event detail tests.

---

### Task 3: Rewire `ApplicationLifecycleList` to use the compact helper

**Files:**
- Modify: `src/features/applications/components/ApplicationLifecycleList.tsx`

- [ ] **Step 1: Replace inline prose logic**

Update imports so the component consumes:

```ts
import {
  resolveApplicationBadgeTone,
  resolveApplicationLifecycleRowContent,
} from '@/features/applications/presentation';
```

and remove direct copy-building imports that are no longer needed.

- [ ] **Step 2: Render compact summary + optional deadline line**

Inside the row map, compute:

```ts
const rowContent = resolveApplicationLifecycleRowContent(application);
```

and render:

```tsx
<p className="mt-2 text-sm text-muted-foreground">{rowContent.summary}</p>
{rowContent.deadlineLine ? (
  <p className="mt-1 text-xs text-muted-foreground">{rowContent.deadlineLine}</p>
) : null}
```

Keep the badge, event title, and CTA structure intact.

- [ ] **Step 3: Preserve CTA behavior**

Retain:

```tsx
{isAwaitingParticipantResponse(application.status) ? (
  <Button asChild size="sm" variant={isOfferExpired(application) ? 'outline' : 'primary'}>
    <Link to={`/events/${application.event.id}/apply`}>
      {isOfferExpired(application) ? 'לצפייה בסטטוס' : 'לתגובה על המקום הזמני'}
    </Link>
  </Button>
) : (
  <Button asChild size="sm" variant="outline">
    <Link to={`/events/${application.event.id}`}>לפרטי המפגש</Link>
  </Button>
)}
```

The list should become thinner, not behaviorally broader.

---

### Task 4: Run green verification in layers

**Files:**
- Verify only

- [ ] **Step 1: Re-run the targeted Playwright test**

Run:

```bash
npx playwright test e2e/participant-foundation.spec.ts --project=chromium -g "dashboard awaiting-response row shows summary, deadline line, and response CTA"
```

Expected: PASS

- [ ] **Step 2: Re-run the existing confirmed-row dashboard regression**

Run:

```bash
npx playwright test e2e/participant-foundation.spec.ts --project=chromium -g "dashboard lifecycle list shows reserved status chip for confirmed application"
```

Expected: PASS

- [ ] **Step 3: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: exit `0`

- [ ] **Step 4: Run the full Chromium suite**

Run:

```bash
npx playwright test --project=chromium
```

Expected: all tests pass on the current baseline.

---

## Self-review

- **Spec coverage:** Task 2 covers compact presentation wiring, Task 3 covers list rendering, Task 1 + Task 4 cover dashboard-offer regression and repo verification.
- **Placeholder scan:** No `TBD` / `TODO` / “write tests later” placeholders remain.
- **Type consistency:** Helper name is fixed as `resolveApplicationLifecycleRowContent`, with return shape `ApplicationLifecycleRowContent`.
