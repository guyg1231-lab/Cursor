# Events Dense Browse - B2 Tighter Stack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/events` into a dense, calm browse front door using the B2 tighter stack direction, while keeping attendee circles visible and preserving continuity with `/events/:eventId` and `/events/:eventId/apply`.

**Architecture:** Collapse the current mobile/desktop browse split into one responsive card system driven by a single event summary contract. Keep the browse page shallow and scanable, reuse existing event formatting helpers, and only add density-specific surface variants where they materially reduce clutter. Do not add filter UI in this pass; the spec defines the filter contract, but this implementation slice stays focused on browse density and social proof.

**Tech Stack:** React, TypeScript, React Router, Playwright, Tailwind CSS, shared design tokens, existing Supabase-backed event query layer.

---

### Task 1: Replace the map-sheet browse split with one responsive `/events` grid

**Files:**
- Modify: `src/pages/events/EventsPage.tsx`
- Modify: `e2e/participant-foundation.spec.ts`

- [ ] **Step 1: Write the failing browse-layout assertions**

Update the existing participant foundation browse checks so mobile and desktop both target one shared container:

```ts
await page.setViewportSize({ width: 390, height: 844 });
await page.goto('/events');
await expect(page.getByTestId('events-discovery-grid')).toBeVisible();
await expect(page.getByTestId('events-discovery-grid').getByTestId('event-attendee-circles').first()).toBeVisible();
await expect(page.getByTestId('mobile-event-discovery-list')).toHaveCount(0);

await page.setViewportSize({ width: 1280, height: 900 });
await page.goto('/events');
await expect(page.getByTestId('events-discovery-grid')).toBeVisible();
await expect(page.getByTestId('desktop-event-discovery-list')).toHaveCount(0);
```

- [ ] **Step 2: Run the updated browse test and confirm the current split fails**

Run:

```bash
npx playwright test e2e/participant-foundation.spec.ts --project=chromium -g "events uses shared Hebrew loading state copy while events are loading|discovery links into canonical event detail before apply|mobile discovery uses map-sheet browse and carries attendee circles into detail/apply|desktop discovery card keeps attendee-circle signal for a published event"
```

Expected: at least the mobile/desktop browse assertions fail because `/events` still renders separate map-sheet and grid branches.

- [ ] **Step 3: Rebuild `EventsPage` around a single dense grid**

Use one browse container for all breakpoints and keep the page header compact:

```tsx
<PageShell
  title="מפגשים פתוחים"
  subtitle="יותר מפגשים באותו מסך, עם קצב רגוע ודרך ברורה להעמיק."
  heroAlign="center"
>
  <div className="flex flex-wrap gap-3">
    <Button asChild variant="outline">
      <Link to="/events/propose">להציע מפגש חדש</Link>
    </Button>
  </div>

  {isLoading ? (
    <RouteLoadingState />
  ) : error ? (
    <RouteErrorState title="שגיאת טעינה" body={error} />
  ) : events.length === 0 ? (
    <RouteEmptyState
      title="אין כרגע מפגשים פתוחים"
      body="ברגע שיתפרסמו מפגשים חדשים, הם יופיעו כאן."
    />
  ) : (
    <div
      data-testid="events-discovery-grid"
      className={cn(tokens.spacing.content, 'grid md:grid-cols-2 xl:grid-cols-3')}
    >
      {events.map((event) => (
        <EventSummaryCard key={event.id} event={event} />
      ))}
    </div>
  )}
</PageShell>
```

Remove the `MobileEventMapSheet` branch from this page entirely so there is no alternate map-first browse surface on `/events`.

- [ ] **Step 4: Re-run the browse test until the single-grid layout passes**

Run:

```bash
npx playwright test e2e/participant-foundation.spec.ts --project=chromium -g "events uses shared Hebrew loading state copy while events are loading|discovery links into canonical event detail before apply|mobile discovery uses map-sheet browse and carries attendee circles into detail/apply|desktop discovery card keeps attendee-circle signal for a published event"
```

Expected: the browse assertions now pass against `events-discovery-grid`, and the old mobile/desktop split selectors are gone.

- [ ] **Step 5: Commit the browse-shell change**

```bash
git add src/pages/events/EventsPage.tsx e2e/participant-foundation.spec.ts
git commit -m "feat(events): collapse browse into a single dense grid"
```

---

### Task 2: Rebuild `EventSummaryCard` into the B2 tighter stack card

**Files:**
- Modify: `src/features/events/components/EventSummaryCard.tsx`
- Modify: `src/features/events/components/EventAttendeeCircles.tsx`
- Modify: `e2e/slice-admin-review.spec.ts`

- [ ] **Step 1: Write the failing card-density and truncation assertions**

Update the card-related Playwright checks so they expect a tighter stack, a short preview, and the attendee-circles block inside the unified browse grid:

```ts
const discoveryGrid = page.getByTestId('events-discovery-grid');
await expect(discoveryGrid.getByRole('heading', { name: 'מפגש בדיקת טעינה' })).toBeVisible();
await expect(discoveryGrid.getByText(previewPrefix, { exact: false })).toBeVisible();
await expect(discoveryGrid.getByText(longDescription, { exact: true })).toHaveCount(0);
await expect(discoveryGrid.getByTestId('event-attendee-circles').first()).toBeVisible();
```

- [ ] **Step 2: Run the card-focused tests and confirm the current card is still too loose**

Run:

```bash
npx playwright test e2e/slice-admin-review.spec.ts --project=chromium
```

Expected: the existing selectors around `desktop-event-discovery-list` need to move to the new unified grid, and the card should still be rendering with more vertical space than the new B2 target.

- [ ] **Step 3: Tighten `EventAttendeeCircles` for browse density**

Add a compact density option so browse cards can keep the social proof visible without carrying the full taller footer treatment:

```tsx
type EventAttendeeCirclesProps = {
  count: number;
  label?: string;
  detail?: string;
  energyLabel?: string;
  density?: 'default' | 'compact';
  className?: string;
};
```

Then branch the wrapper and footer treatment:

```tsx
const isCompact = density === 'compact';

return (
  <div
    data-testid="event-attendee-circles"
    className={cn(
      isCompact
        ? 'rounded-[20px] border border-primary/10 bg-primary/5 px-3 py-2 shadow-sm'
        : 'rounded-[24px] border border-primary/10 bg-primary/5 px-3 py-3 shadow-sm',
      className,
    )}
  >
    ...
    {isCompact ? null : (
      <div className="mt-2 flex items-center justify-end border-t border-primary/10 pt-2">
        <span className="rounded-full border border-primary/15 bg-background/80 px-2.5 py-1 text-[11px] font-medium text-foreground/75">
          {energyLabel}
        </span>
      </div>
    )}
  </div>
);
```

Keep the default behavior unchanged for detail and apply surfaces so the shared component can serve both dense browse and richer context pages.

- [ ] **Step 4: Rebuild `EventSummaryCard` around one outer card and one inner utility zone**

Use the existing formatter helpers, but keep the card visually tighter:

```tsx
<Card className={tokens.card.accent}>
  <CardHeader className="space-y-3 pb-4">
    <div className="flex flex-wrap gap-2">
      <StatusBadge label={registrationState.label} tone={registrationState.tone} />
      <StatusBadge label={capacityLabel} tone="muted" />
    </div>
    <CardTitle className="text-xl leading-tight">{event.title}</CardTitle>
    {description ? (
      <p className="text-sm leading-6 text-foreground/80">
        {formatEventAtmosphereSnippet(description, 96)}
      </p>
    ) : null}
  </CardHeader>
  <CardContent className="space-y-4 text-sm text-foreground/85">
    <div className="grid gap-3 md:grid-cols-[minmax(0,1.15fr)_minmax(220px,0.85fr)]">
      <div className={tokens.card.inner + ' space-y-3 p-4'}>
        <div className="space-y-1">
          <p className={tokens.typography.eyebrow}>מתי?</p>
          <p className="text-foreground">{formatEventDate(event.starts_at)}</p>
        </div>
        <div className="space-y-1">
          <p className={tokens.typography.eyebrow}>איפה בערך?</p>
          <p className="text-foreground">{areaHint}</p>
        </div>
      </div>
      <div className="space-y-3">
        {hasAttendeeSignal ? (
          <EventAttendeeCircles
            count={event.social_signal!.attendee_count}
            detail="החדר נבנה בקצב רגוע"
            density="compact"
          />
        ) : (
          <div className={tokens.card.inner + ' space-y-2 p-4'}>
            <p className={tokens.typography.eyebrow}>Social energy</p>
            <p className="text-foreground">קבוצה קטנה ומאוצרת</p>
          </div>
        )}
        <Button asChild variant="primary" className="w-full">
          <Link to={`/events/${event.id}`}>לפרטי המפגש</Link>
        </Button>
      </div>
    </div>
  </CardContent>
</Card>
```

Keep `formatEventAtmosphereSnippet` as the browse preview helper so the card truncation stays deterministic and the full description does not leak into the DOM.

- [ ] **Step 5: Update the slice review test to target the new unified browse grid**

Switch `e2e/slice-admin-review.spec.ts` from `desktop-event-discovery-list` to `events-discovery-grid` so the truncated preview assertion remains valid after the browse shell changes.

- [ ] **Step 6: Re-run the card and slice tests until the new card passes**

Run:

```bash
npx playwright test e2e/slice-admin-review.spec.ts --project=chromium
npx playwright test e2e/participant-foundation.spec.ts --project=chromium -g "desktop discovery card keeps attendee-circle signal for a published event|mobile discovery uses map-sheet browse and carries attendee circles into detail/apply"
```

Expected: attendee circles remain visible, the preview is truncated, and the unified browse grid still links cleanly into detail.

- [ ] **Step 7: Commit the dense card change**

```bash
git add src/features/events/components/EventSummaryCard.tsx src/features/events/components/EventAttendeeCircles.tsx e2e/slice-admin-review.spec.ts
git commit -m "feat(events): tighten summary cards for dense browse"
```

---

### Task 3: Verify browse/detail continuity and finish the branch cleanly

**Files:**
- Modify: `e2e/participant-foundation.spec.ts`
- Review only: `src/pages/events/EventDetailPage.tsx`
- Review only: `src/pages/apply/ApplyPage.tsx`

- [ ] **Step 1: Update the participant browse tests to assert the new story end-to-end**

Make sure the browse flow still reaches canonical detail, and that the dense grid still supports the proposal CTA:

```ts
await page.goto('/events');
await expect(page.getByTestId('events-discovery-grid')).toBeVisible();
await page.getByRole('link', { name: /לפרטי המפגש/ }).first().click();
await expect(page).toHaveURL(new RegExp(`/events/${ENV.EVENT_ID}`));
await expect(page.getByRole('link', { name: 'להציע מפגש חדש' })).toHaveAttribute('href', '/events/propose');
```

- [ ] **Step 2: Run the full participant and slice passes together**

Run:

```bash
npx playwright test e2e/participant-foundation.spec.ts e2e/slice-admin-review.spec.ts --project=chromium
```

Expected: all participant browse, detail, and slice-check assertions are green on Chromium.

- [ ] **Step 3: Run typecheck and the full Chromium suite**

Run:

```bash
npm run typecheck
npx playwright test --project=chromium
```

Expected: typecheck passes and the full Chromium suite stays green.

- [ ] **Step 4: Commit the verification pass**

```bash
git add e2e/participant-foundation.spec.ts
git commit -m "test(events): cover dense browse continuity"
```

---

## Non-goals for this implementation slice

- Do not add a filter UI yet.
- Do not reintroduce the map-sheet browse model as a default surface.
- Do not add a second browse mode for mobile.
- Do not touch host/admin routing or behavior.
- Do not change `/events/:eventId` or `/events/:eventId/apply` unless a real regression appears during verification.

## Acceptance criteria

This plan is done when:

1. `/events` renders as a single dense browse grid on all breakpoints.
2. attendee circles remain visible on browse cards.
3. browse cards are tighter without losing the Circles tone.
4. truncated preview text stays in the card and the full description does not.
5. detail/apply continuity remains green in participant tests.
6. `npm run typecheck` passes.
7. `npx playwright test --project=chromium` passes.

