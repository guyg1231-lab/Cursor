# Participant Visual System Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply one warm, dense, calm participant visual language across `/events`, `/events/:eventId`, and `/events/:eventId/apply` without losing the B2 browse direction or the existing social-proof contract.

**Architecture:** Lock the shared participant primitives first so buttons, shells, route states, and panel rhythm all speak the same language. Then restyle the browse shelf and the detail/apply depth pages on top of those primitives, preserving the current route boundaries and existing Hebrew-first copy. Finish with interaction and continuity verification rather than one-off visual tweaks.

**Tech Stack:** React, TypeScript, React Router, Tailwind CSS, shared design tokens, Playwright, existing Supabase-backed participant data flows.

---

## File Map

**Shared primitives and visual language**

- Modify: `src/lib/design-tokens.ts`
  - Add participant-specific shell, panel, and action-rail tokens so the visual language is defined once.
- Modify: `src/components/ui/button.tsx`
  - Tighten the button motion, shape, and hierarchy so primary and secondary actions feel deliberate rather than default.
- Modify: `src/components/ui/card.tsx`
  - Keep the base primitive aligned with the softer participant surfaces.
- Modify: `src/components/shared/PageShell.tsx`
  - Turn the participant page frame into a reusable, testable shell with clear hero rhythm and backdrop treatment.
- Modify: `src/components/shared/PageActionBar.tsx`
  - Make the action row feel like one calm rail instead of a loose row of controls.
- Modify: `src/components/shared/RouteState.tsx`
  - Bring loading, empty, error, and gated states into the same participant language.
- Modify: `src/components/shared/AppHeader.tsx`
  - Only adjust the participant-facing chrome if needed to match the new shell and button rhythm; do not redesign host/admin navigation.

**Participant route surfaces**

- Modify: `src/pages/events/EventsPage.tsx`
  - Keep the B2 dense shelf, but bring it under the new shell/action rhythm.
- Modify: `src/features/events/components/EventSummaryCard.tsx`
  - Make the browse card feel like the same family as detail/apply, not a separate object.
- Modify: `src/features/events/components/EventAttendeeCircles.tsx`
  - Preserve visible social proof while aligning compact/default variants with the new surface language.
- Modify: `src/features/events/components/EventIdentityHero.tsx`
  - Make the shared event identity surface the visual bridge between browse, detail, and apply.
- Modify: `src/pages/events/EventDetailPage.tsx`
  - Reshape the detail page around the shared hero, participant action rail, and calmer panel rhythm.
- Modify: `src/pages/apply/ApplyPage.tsx`
  - Align the threshold/commitment page with the same shell, panels, and actions without losing state clarity.

**Verification**

- Create: `e2e/participant-visual-system.spec.ts`
  - Add focused participant-journey assertions for the shared shell, action rail, and surface continuity.
- Modify: `e2e/participant-foundation.spec.ts`
  - Keep existing browse/detail/apply continuity coverage honest while adapting selectors to the new shared semantics.
- Modify: `e2e/slice-admin-review.spec.ts`
  - Keep the published-event browse preview assertion valid after the card polish.

## Non-goals

- Do not add new filters, search, ranking, or map-first browse behavior.
- Do not redesign host/admin surfaces in this pass.
- Do not rewrite event/application business logic unless a real UI regression is exposed.
- Do not revert existing in-progress participant WIP in `EventDetailPage`, `ApplyPage`, or `EventIdentityHero`; integrate with it carefully.

---

### Task 1: Lock the shared participant visual primitives

**Files:**
- Modify: `src/lib/design-tokens.ts`
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/card.tsx`
- Modify: `src/components/shared/PageShell.tsx`
- Modify: `src/components/shared/PageActionBar.tsx`
- Modify: `src/components/shared/RouteState.tsx`
- Modify: `src/components/shared/AppHeader.tsx`
- Create: `e2e/participant-visual-system.spec.ts`

- [ ] **Step 1: Write the failing shared-shell and action-rail assertions**

Create `e2e/participant-visual-system.spec.ts` with a focused participant-shell check:

```ts
import { test, expect } from '@playwright/test';

test.describe('participant visual system', () => {
  test('events uses the shared participant shell and action rail', async ({ page }) => {
    await page.goto('/events');

    await expect(page.getByTestId('participant-page-shell')).toBeVisible();
    await expect(page.getByTestId('participant-page-hero')).toBeVisible();
    await expect(page.getByTestId('participant-page-actions')).toBeVisible();
    await expect(page.getByRole('link', { name: 'להציע מפגש חדש' })).toBeVisible();
  });

  test('route states use the shared participant state card', async ({ page }) => {
    await page.route('**/rest/v1/events*', async (route) => {
      await route.abort('failed');
    });

    await page.goto('/events');

    await expect(page.getByTestId('participant-route-state')).toBeVisible();
    await expect(page.getByText('שגיאת טעינה')).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the new spec and confirm the shared test ids do not exist yet**

Run:

```bash
npx playwright test e2e/participant-visual-system.spec.ts --project=chromium
```

Expected: FAIL because `participant-page-shell`, `participant-page-hero`, `participant-page-actions`, and `participant-route-state` are not yet rendered.

- [ ] **Step 3: Implement the shared participant shell, tokens, and action primitives**

Update `src/lib/design-tokens.ts` so the participant language is defined once:

```ts
export const tokens = {
  spacing: {
    // keep existing spacing tokens
  },
  participant: {
    shell: {
      hero: 'max-w-4xl space-y-3 md:space-y-4',
      content: 'space-y-5 md:space-y-6',
      chrome: 'relative z-10',
    },
    actionRail:
      'flex flex-wrap items-center gap-3 rounded-[28px] border border-border/60 bg-background/72 px-4 py-3 shadow-soft backdrop-blur-md',
    routeState:
      'rounded-[30px] border border-border/60 bg-card/88 px-1 shadow-soft-lg backdrop-blur-md',
    panel:
      'rounded-[28px] border border-border/60 bg-card/88 shadow-soft backdrop-blur-md',
    panelInner:
      'rounded-[24px] border border-primary/10 bg-background/45 backdrop-blur-sm',
  },
};
```

Update `src/components/shared/PageShell.tsx` to expose stable participant semantics:

```tsx
<div
  data-testid="participant-page-shell"
  className={cn('min-h-screen relative overflow-x-hidden', className)}
  dir={isRTL ? 'rtl' : 'ltr'}
>
  <FloatingCircles />
  <div
    className="absolute inset-0 pointer-events-none"
    style={{
      background:
        'radial-gradient(ellipse 60% 50% at 50% 30%, hsl(var(--primary) / 0.08), transparent 70%)',
    }}
  />
  <div className={tokens.participant.shell.chrome}>
    <AppHeader transparent={headerTransparent} actions={headerActions} />
    <main id="main-content" className="container py-10 md:py-14">
      {title || subtitle ? (
        <div data-testid="participant-page-hero" className={cn(tokens.participant.shell.hero, heroAlignClassName)}>
          {title ? <h1 className={tokens.typography.hero}>{title}</h1> : null}
          {subtitle ? <p className="text-base md:text-lg leading-8 text-foreground/80">{subtitle}</p> : null}
        </div>
      ) : null}
      <div className={tokens.participant.shell.content}>{children}</div>
    </main>
  </div>
</div>
```

Update `src/components/shared/PageActionBar.tsx` and `src/components/shared/RouteState.tsx`:

```tsx
export function PageActionBar({ children }: PropsWithChildren) {
  return (
    <div data-testid="participant-page-actions" className={tokens.participant.actionRail}>
      {children}
    </div>
  );
}
```

```tsx
function RouteStateCard({ title, body, tone = 'default', action }: RouteStateCardProps) {
  return (
    <Card data-testid="participant-route-state" className={tokens.participant.routeState}>
      <CardContent className={`space-y-3 py-8 text-sm ${tone === 'danger' ? 'text-destructive' : 'text-muted-foreground'}`}>
        <p className="font-medium text-foreground">{title}</p>
        <p>{body}</p>
        {action ? <div className="pt-2">{action}</div> : null}
      </CardContent>
    </Card>
  );
}
```

Update `src/components/ui/button.tsx` and `src/components/ui/card.tsx` so the shared primitives feel softer and calmer:

```ts
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.985]',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground shadow-soft hover:-translate-y-0.5 hover:bg-primary/94',
        default: 'bg-foreground text-background shadow-soft hover:-translate-y-0.5 hover:bg-foreground/92',
        destructive: 'bg-destructive text-destructive-foreground shadow-soft hover:-translate-y-0.5 hover:bg-destructive/92',
        outline: 'border border-border/70 bg-background/72 text-foreground shadow-sm backdrop-blur-sm hover:-translate-y-0.5 hover:bg-background/92',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:-translate-y-0.5 hover:bg-secondary/85',
        ghost: 'text-muted-foreground hover:bg-background/60 hover:text-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
    },
  },
);
```

- [ ] **Step 4: Re-run the focused shared-primitives spec and typecheck**

Run:

```bash
npx playwright test e2e/participant-visual-system.spec.ts --project=chromium
npm run typecheck
```

Expected: PASS for the new shell/state semantics, and `typecheck` stays green.

- [ ] **Step 5: Commit the shared visual-language primitives**

```bash
git add src/lib/design-tokens.ts src/components/ui/button.tsx src/components/ui/card.tsx src/components/shared/PageShell.tsx src/components/shared/PageActionBar.tsx src/components/shared/RouteState.tsx src/components/shared/AppHeader.tsx e2e/participant-visual-system.spec.ts
git commit -m "feat(participant): lock shared visual language primitives"
```

---

### Task 2: Bring `/events` fully under the participant visual system

**Files:**
- Modify: `src/pages/events/EventsPage.tsx`
- Modify: `src/features/events/components/EventSummaryCard.tsx`
- Modify: `src/features/events/components/EventAttendeeCircles.tsx`
- Modify: `e2e/participant-foundation.spec.ts`
- Modify: `e2e/participant-visual-system.spec.ts`
- Modify: `e2e/slice-admin-review.spec.ts`

- [ ] **Step 1: Write the failing browse-card and browse-action assertions**

Extend the browse coverage so it asserts the new participant card semantics:

```ts
test('events browse cards use the shared participant card language', async ({ page }) => {
  await page.goto('/events');

  const firstCard = page.getByTestId('event-summary-card').first();
  await expect(firstCard).toBeVisible();
  await expect(firstCard.getByTestId('event-attendee-circles')).toBeVisible();
  await expect(firstCard.getByTestId('event-summary-card-action')).toBeVisible();
  await expect(page.getByTestId('participant-page-actions')).toContainText('להציע מפגש חדש');
});
```

Update the existing browse continuity assertions in `e2e/participant-foundation.spec.ts` so they target `event-summary-card` rather than loose text-only structure:

```ts
const discoveryGrid = page.getByTestId('events-discovery-grid');
await expect(discoveryGrid.getByTestId('event-summary-card').first()).toBeVisible();
await expect(discoveryGrid.getByTestId('event-summary-card').first().getByTestId('event-attendee-circles')).toBeVisible();
```

- [ ] **Step 2: Run the browse-focused specs and confirm the new semantics are missing**

Run:

```bash
npx playwright test e2e/participant-visual-system.spec.ts e2e/participant-foundation.spec.ts e2e/slice-admin-review.spec.ts --project=chromium -g "participant visual system|events browse cards use the shared participant card language|desktop discovery card keeps attendee-circle signal for a published event|mobile discovery uses the shared dense grid and carries attendee circles into detail/apply|host submits a draft, admin approves, event becomes active+published"
```

Expected: FAIL because `event-summary-card` / `event-summary-card-action` test ids and the refined browse shell are not yet present.

- [ ] **Step 3: Rebuild the browse shelf on top of the new surface language**

Update `src/pages/events/EventsPage.tsx` to use the shared action rail rather than a loose top row:

```tsx
<PageShell
  title="מפגשים פתוחים"
  subtitle="יותר מפגשים באותו מסך, בקצב רגוע ועם דרך ברורה להבין אם זה מתאים."
  heroAlign="center"
>
  <PageActionBar>
    <Button asChild variant="outline">
      <Link to="/events/propose">להציע מפגש חדש</Link>
    </Button>
  </PageActionBar>

  {isLoading ? (
    <RouteLoadingState />
  ) : error ? (
    <RouteErrorState title="שגיאת טעינה" body={error} />
  ) : events.length === 0 ? (
    <RouteEmptyState title="אין כרגע מפגשים פתוחים" body="ברגע שיתפרסמו מפגשים חדשים, הם יופיעו כאן." />
  ) : (
    <div data-testid="events-discovery-grid" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {events.map((event) => (
        <EventSummaryCard key={event.id} event={event} />
      ))}
    </div>
  )}
</PageShell>
```

Update `src/features/events/components/EventSummaryCard.tsx` so each card is a stable participant surface:

```tsx
<Card data-testid="event-summary-card" className={tokens.card.accent}>
  <CardHeader className="space-y-3 pb-4">
    <div className="flex flex-wrap gap-2">
      <StatusBadge label={registrationState.label} tone={registrationState.tone} />
      <StatusBadge label={capacityLabel} tone="muted" />
    </div>
    <CardTitle className="text-xl leading-tight">{event.title}</CardTitle>
    {description ? <p className="text-sm leading-6 text-foreground/80">{formatEventAtmosphereSnippet(description, 88)}</p> : null}
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="grid gap-3">
      <div className={cn(tokens.participant.panelInner, 'space-y-3 p-4')}>
        <div className="space-y-1">
          <p className={tokens.typography.eyebrow}>מתי</p>
          <p className="text-foreground">{formatEventDate(event.starts_at)}</p>
        </div>
        <div className="space-y-1">
          <p className={tokens.typography.eyebrow}>איפה בערך</p>
          <p className="text-foreground">{areaHint}</p>
        </div>
      </div>
      {hasAttendeeSignal ? (
        <EventAttendeeCircles count={event.social_signal!.attendee_count} detail="החדר נבנה בקצב רגוע" density="compact" />
      ) : (
        <div className={cn(tokens.participant.panelInner, 'space-y-2 p-4')}>
          <p className={tokens.typography.eyebrow}>אנרגיה חברתית</p>
          <p className="text-foreground">קבוצה קטנה ומאוצרת</p>
        </div>
      )}
      <Button asChild variant="primary" className="w-full" data-testid="event-summary-card-action">
        <Link to={`/events/${event.id}`}>לפרטי המפגש</Link>
      </Button>
    </div>
  </CardContent>
</Card>
```

Keep `src/features/events/components/EventAttendeeCircles.tsx` aligned with the new participant shells:

```tsx
const wrapperClassName = isCompact
  ? 'rounded-[22px] border border-primary/10 bg-primary/5 px-3 py-2 shadow-sm'
  : 'rounded-[26px] border border-primary/10 bg-primary/5 px-4 py-3 shadow-soft';
```

- [ ] **Step 4: Re-run browse verification until the shelf passes with the new semantics**

Run:

```bash
npx playwright test e2e/participant-visual-system.spec.ts e2e/participant-foundation.spec.ts e2e/slice-admin-review.spec.ts --project=chromium -g "participant visual system|events browse cards use the shared participant card language|desktop discovery card keeps attendee-circle signal for a published event|mobile discovery uses the shared dense grid and carries attendee circles into detail/apply|host submits a draft, admin approves, event becomes active+published"
```

Expected: PASS. The shelf still shows attendee circles, published previews remain truncated, and the action rail/card shell semantics are now stable.

- [ ] **Step 5: Commit the browse-system polish**

```bash
git add src/pages/events/EventsPage.tsx src/features/events/components/EventSummaryCard.tsx src/features/events/components/EventAttendeeCircles.tsx e2e/participant-foundation.spec.ts e2e/participant-visual-system.spec.ts e2e/slice-admin-review.spec.ts
git commit -m "feat(events): align browse shelf with participant visual system"
```

---

### Task 3: Unify detail and apply into the same participant family

**Files:**
- Modify: `src/features/events/components/EventIdentityHero.tsx`
- Modify: `src/pages/events/EventDetailPage.tsx`
- Modify: `src/pages/apply/ApplyPage.tsx`
- Modify: `e2e/participant-visual-system.spec.ts`
- Modify: `e2e/participant-foundation.spec.ts`

- [ ] **Step 1: Write the failing detail/apply continuity assertions**

Extend `e2e/participant-visual-system.spec.ts` with a focused continuity test:

```ts
import { authenticateAs } from './fixtures/auth';
import { ENV } from './fixtures/env';

test('detail and apply share the participant hero and action rail language', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  try {
    await authenticateAs(ctx, ENV.EMAILS.P1);
    const page = await ctx.newPage();

    await page.goto('/events');
    await page.getByRole('link', { name: 'לפרטי המפגש' }).first().click();

    await expect(page.getByTestId('event-identity-hero')).toBeVisible();
    await expect(page.getByTestId('participant-page-actions')).toBeVisible();

    await page.getByRole('link', {
      name: /להגשה למפגש|להגיש שוב|להגשה ולסטטוס|למקום הזמני ולתגובה|לצפייה בסטטוס ההרשמה/i,
    }).first().click();

    await expect(page.getByTestId('event-identity-hero')).toBeVisible();
    await expect(page.getByTestId('participant-page-actions')).toBeVisible();
    await expect(page.getByTestId('participant-surface-panel').first()).toBeVisible();
  } finally {
    await ctx.close();
  }
});
```

- [ ] **Step 2: Run the detail/apply-focused spec and confirm the new shared semantics are missing**

Run:

```bash
npx playwright test e2e/participant-visual-system.spec.ts e2e/participant-foundation.spec.ts --project=chromium -g "detail and apply share the participant hero and action rail language|discovery links into canonical event detail before apply"
```

Expected: FAIL because `event-identity-hero` and `participant-surface-panel` are not yet exposed consistently across both routes.

- [ ] **Step 3: Rework the shared identity hero and participant panels**

Update `src/features/events/components/EventIdentityHero.tsx` so it becomes the visual bridge between routes:

```tsx
export function EventIdentityHero({ event, eyebrow, subtitle, badges, socialLabel, socialDetail, className }: EventIdentityHeroProps) {
  return (
    <Card data-testid="event-identity-hero" className={cn(tokens.card.accent, className)}>
      <div className="relative overflow-hidden rounded-[28px] px-4 pb-16 pt-5 sm:px-6 sm:pb-20 sm:pt-6">
        <div className="absolute inset-0 bg-[linear-gradient(160deg,#f2e5d7_0%,#ecefff_52%,#fffdfa_100%)]" />
        <div className="absolute inset-x-6 top-8 h-4 rounded-full bg-white/60 blur-sm" />
        <div className="absolute end-8 top-10 h-20 w-20 rounded-full bg-primary/12 blur-2xl" />
        <div className="relative space-y-5">
          {badges ? <div className="flex flex-wrap justify-center gap-2 sm:justify-start">{badges}</div> : null}
          <div className="space-y-3 text-center sm:text-start">
            <p className={cn(tokens.typography.eyebrow, 'text-foreground/65')}>{eyebrow}</p>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold leading-[2.125rem] tracking-[-0.015em] text-foreground sm:text-3xl sm:leading-[2.5rem]">
                {event.title}
              </h2>
              <p className="text-sm leading-6 text-foreground/80 sm:text-base sm:leading-7">{subtitle}</p>
            </div>
          </div>
        </div>
      </div>

      <CardContent className="relative -mt-10 space-y-4 px-4 pb-4 sm:px-6 sm:pb-6">
        <div className={cn(tokens.participant.panel, 'space-y-4 p-4')}>
          <EventAttendeeCircles
            count={event.social_signal?.attendee_count ?? 0}
            label={socialLabel}
            detail={socialDetail}
            className="justify-center sm:justify-start"
          />
          <div className="grid grid-cols-2 gap-3">{facts.map((fact) => <div key={fact.label}>{fact.value}</div>)}</div>
          {atmosphere ? <p className="text-sm leading-7 text-foreground/85">{atmosphere}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
```

Update `src/pages/events/EventDetailPage.tsx` so the right-column info cards become participant panels rather than generic cards:

```tsx
<PageShell title="פרטי המפגש" subtitle={shellSubtitle}>
  <PageActionBar>
    <Button asChild variant="outline">
      <Link to="/events">חזרה לכל המפגשים</Link>
    </Button>
    {event.is_registration_open ? (
      <Button asChild variant="primary">
        <Link to={`/events/${event.id}/apply`}>{application ? 'להגיש שוב' : 'להגשה למפגש'}</Link>
      </Button>
    ) : null}
  </PageActionBar>

  <div className="grid gap-4 md:grid-cols-[1.12fr_0.88fr]">
    <div className="space-y-4">
      <EventIdentityHero event={event} eyebrow="המפגש שפתוח לפניך" subtitle={detailSubtitle} badges={badges} socialDetail="הערב מתחיל לקבל צורה" />
      <Card data-testid="participant-surface-panel" className={tokens.participant.panel}>
        <CardHeader>
          <CardTitle className="text-xl font-semibold tracking-[-0.015em]">איך הערב הזה מרגיש?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
          <div className={cn(tokens.participant.panelInner, 'space-y-2 p-4')}>{event.description}</div>
        </CardContent>
      </Card>
    </div>
    <div className="space-y-4">
      <Card data-testid="participant-surface-panel" className={tokens.participant.panel}>
        <CardHeader>
          <CardTitle className="text-xl font-semibold tracking-[-0.015em]">מה חשוב לדעת?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
          <div className={cn(tokens.participant.panelInner, 'space-y-2 p-4')}>{event.is_registration_open ? 'ההגשה פתוחה כרגע.' : 'ההגשה סגורה כרגע.'}</div>
        </CardContent>
      </Card>
    </div>
  </div>
</PageShell>
```

Update `src/pages/apply/ApplyPage.tsx` so the threshold page follows the same shell and panel grammar:

```tsx
<PageShell title="הגשה למפגש" subtitle={shellSubtitle}>
  <PageActionBar>
    <Button asChild variant="outline">
      <Link to={`/events/${event.id}`}>חזרה לפרטי המפגש</Link>
    </Button>
    <Button type="submit" form="event-application-form" variant="primary">
      שליחת ההגשה
    </Button>
  </PageActionBar>

  <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
    <div className="space-y-4">
      <ApplyEventIdentityCard event={event} subtitle={subtitle} />
      <Card data-testid="participant-surface-panel" className={tokens.participant.panel}>
        <CardContent className="space-y-4">
          {existingApplication ? (
            <SubmittedAnswersSummary answers={answers} title="מה כבר שלחת" />
          ) : (
            <form id="event-application-form" className="space-y-4">
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">למה דווקא המפגש הזה?</span>
                <textarea className="min-h-28 w-full rounded-[24px] border border-border/70 bg-background/70 px-4 py-3" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">מה רצית לקבל מהמפגש?</span>
                <select className="h-12 w-full rounded-full border border-border/70 bg-background/70 px-4" />
              </label>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
    <div className="space-y-4">
      <Card data-testid="participant-surface-panel" className={tokens.participant.panel}>
        <CardContent className="space-y-4">
          {existingApplication && applicationPanelContent ? (
            <ApplicationStatusPanel title={applicationPanelContent.title} body={applicationPanelContent.body} />
          ) : (
            <div className={cn(tokens.participant.panelInner, 'space-y-2 p-4')}>הגשה רגועה, תהליך אנושי, וסטטוס ברור בהמשך הדרך.</div>
          )}
        </CardContent>
      </Card>
    </div>
  </div>
</PageShell>
```

- [ ] **Step 4: Re-run detail/apply continuity and participant foundation checks**

Run:

```bash
npx playwright test e2e/participant-visual-system.spec.ts e2e/participant-foundation.spec.ts --project=chromium -g "detail and apply share the participant hero and action rail language|discovery links into canonical event detail before apply|mobile discovery uses the shared dense grid and carries attendee circles into detail/apply"
npm run typecheck
```

Expected: PASS. Detail and apply now expose the same hero/action/panel family, and route continuity still holds.

- [ ] **Step 5: Commit the detail/apply visual unification**

```bash
git add src/features/events/components/EventIdentityHero.tsx src/pages/events/EventDetailPage.tsx src/pages/apply/ApplyPage.tsx e2e/participant-visual-system.spec.ts e2e/participant-foundation.spec.ts
git commit -m "feat(participant): unify detail and apply visual language"
```

---

### Task 4: Polish interaction semantics and finish verification

**Files:**
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/shared/PageShell.tsx`
- Modify: `src/features/events/components/EventSummaryCard.tsx`
- Modify: `src/features/events/components/EventIdentityHero.tsx`
- Modify: `e2e/participant-visual-system.spec.ts`
- Review only: `src/components/shared/AppHeader.tsx`

- [ ] **Step 1: Write the failing interaction and responsiveness assertions**

Add one focused keyboard/responsive check to `e2e/participant-visual-system.spec.ts`:

```ts
test('participant actions stay visible and usable on mobile and desktop', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/events');
  await expect(page.getByTestId('participant-page-actions')).toBeVisible();
  await expect(page.getByRole('link', { name: 'להציע מפגש חדש' })).toBeVisible();

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/events');
  await expect(page.getByTestId('participant-page-actions')).toBeVisible();

  await page.keyboard.press('Tab');
  await expect(page.locator(':focus-visible').first()).toBeVisible();
});
```

- [ ] **Step 2: Run the full participant visual slice and confirm the remaining polish gaps**

Run:

```bash
npx playwright test e2e/participant-visual-system.spec.ts e2e/participant-foundation.spec.ts e2e/slice-admin-review.spec.ts --project=chromium
```

Expected: any remaining failures should now point only to polish gaps in shared buttons, action rails, or responsive shell behavior.

- [ ] **Step 3: Tighten the remaining motion and responsive details**

Use the shared primitives rather than route-specific hacks:

```ts
// src/components/ui/button.tsx
primary: 'bg-primary text-primary-foreground shadow-soft hover:-translate-y-0.5 hover:shadow-soft-lg hover:bg-primary/94 active:translate-y-[1px]'
outline: 'border border-border/70 bg-background/72 text-foreground shadow-sm backdrop-blur-sm hover:-translate-y-0.5 hover:shadow-soft'
```

```tsx
// src/components/shared/PageShell.tsx
<main id="main-content" className="container py-8 md:py-14">
  <div className="space-y-5 md:space-y-6">{children}</div>
</main>
```

```tsx
// src/features/events/components/EventSummaryCard.tsx
<Card className={cn(tokens.card.accent, 'hover:-translate-y-0.5 hover:shadow-soft-lg')}>
```

```tsx
// src/features/events/components/EventIdentityHero.tsx
<Card className={cn(tokens.card.accent, 'overflow-hidden')}>
```

The rule for this step: fix the feel in primitives first, and only touch route components if the primitive cannot express the right behavior.

- [ ] **Step 4: Run the verification gate**

Run:

```bash
npm run typecheck
npx playwright test e2e/participant-visual-system.spec.ts e2e/participant-foundation.spec.ts e2e/slice-admin-review.spec.ts --project=chromium
npx playwright test --project=chromium
```

Expected: all targeted participant visual-system checks pass, the published-event slice still passes, and the full Chromium suite stays green.

- [ ] **Step 5: Commit the final participant visual-system pass**

```bash
git add src/components/ui/button.tsx src/components/shared/PageShell.tsx src/features/events/components/EventSummaryCard.tsx src/features/events/components/EventIdentityHero.tsx e2e/participant-visual-system.spec.ts
git commit -m "feat(participant): polish visual system interactions"
```

---

## Acceptance Criteria

This plan is done when:

1. `/events`, `/events/:eventId`, and `/events/:eventId/apply` all render inside the same participant shell language.
2. Primary and secondary actions feel consistent across the participant journey.
3. Browse cards, identity hero, and detail/apply panels feel like one family rather than separate UI systems.
4. Attendee circles remain visible on the browse shelf and in the identity hero where data exists.
5. Shared route states use the same participant surface language.
6. `npm run typecheck` passes.
7. `npx playwright test --project=chromium` passes.
