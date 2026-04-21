# Mobile Discovery Map/Sheet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the approved mobile `map + sheet` discovery direction for participant-facing event browse/detail/apply surfaces, including anonymized attendee-circle social signals and typography/alignment that stay faithful to the Circles design system.

**Architecture:** Add a small public social-signal data contract for published events, then layer new mobile-first discovery components on top of the existing event API without replacing desktop behavior. Keep the map layer sparse and atmospheric, use the bottom sheet as the decision surface, and reuse the same social-signal primitive across `/events`, `/events/:eventId`, and the top of `/events/:eventId/apply`.

**Tech Stack:** React 18 + TypeScript + Vite, Tailwind CSS, Supabase client + SQL migrations, Playwright E2E, existing Circles design tokens in `src/index.css` and `src/lib/design-tokens.ts`.

---

### Task 1: Public Social Signal Data Contract

**Files:**
- Create: `supabase/migrations/018_public_event_social_signals.sql`
- Modify: `src/integrations/supabase/types.ts`
- Modify: `src/features/events/types.ts`
- Test: `e2e/participant-foundation.spec.ts`

- [ ] **Step 1: Write the failing contract test expectation for public attendee signals**

Add a focused browser-route-backed expectation in `e2e/participant-foundation.spec.ts` that makes the intended UI contract concrete before implementation:

```ts
test('mobile discovery sheet can show attendee-circle count for a published event', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.route('**/rest/v1/rpc/get_public_event_social_signals', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          event_id: 'playwright-map-event',
          attendee_count: 4,
        },
      ]),
    });
  });

  await page.route('**/rest/v1/events*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'playwright-map-event',
          title: 'ארוחת ערב קטנה עם שיחה שנפתחת לאט',
          description: 'מפגש אינטימי וחם לערב קטן בעיר.',
          city: 'תל אביב',
          starts_at: '2026-05-08T17:30:00.000Z',
          registration_deadline: '2026-05-05T17:30:00.000Z',
          venue_hint: 'נווה צדק',
          max_capacity: 8,
          status: 'active',
          is_published: true,
          created_at: '2026-04-01T10:00:00.000Z',
          updated_at: '2026-04-01T10:00:00.000Z',
          created_by_user_id: null,
          host_user_id: null,
          payment_required: false,
          price_cents: 0,
          currency: 'ILS',
        },
      ]),
    });
  });

  await page.goto('/events');
  await expect(page.getByText('4 כבר בפנים', { exact: true })).toBeVisible();
});
```

- [ ] **Step 2: Run the focused test to verify the social-signal contract does not exist yet**

Run:

```bash
cd /Users/guygarfinkel/Documents/Cursor/social-matching-web
npx playwright test e2e/participant-foundation.spec.ts --project=chromium --grep "mobile discovery sheet can show attendee-circle count for a published event"
```

Expected: FAIL because the current `/events` surface does not fetch or render public attendee counts.

- [ ] **Step 3: Add a public, privacy-safe SQL function for attendee counts**

Create `supabase/migrations/018_public_event_social_signals.sql`:

```sql
create or replace function public.get_public_event_social_signals(event_ids uuid[])
returns table (
  event_id uuid,
  attendee_count integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.id as event_id,
    coalesce(
      count(er.*) filter (
        where er.status in ('approved', 'confirmed', 'attended')
      ),
      0
    )::integer as attendee_count
  from public.events e
  left join public.event_registrations er
    on er.event_id = e.id
  where e.is_published = true
    and e.id = any(event_ids)
  group by e.id;
$$;

revoke all on function public.get_public_event_social_signals(uuid[]) from public;
grant execute on function public.get_public_event_social_signals(uuid[]) to anon, authenticated;
```

- [ ] **Step 4: Update generated types and the event view model**

Extend `src/features/events/types.ts` so the UI can carry the social signal:

```ts
export interface EventSocialSignal {
  attendee_count: number;
}

export interface VisibleEvent extends EventRow {
  is_registration_open: boolean;
  social_signal?: EventSocialSignal;
}
```

Add the RPC return type in `src/integrations/supabase/types.ts` under `Functions`:

```ts
get_public_event_social_signals: {
  Args: {
    event_ids: string[]
  }
  Returns: {
    event_id: string
    attendee_count: number
  }[]
}
```

- [ ] **Step 5: Run the focused test again**

Run:

```bash
cd /Users/guygarfinkel/Documents/Cursor/social-matching-web
npx playwright test e2e/participant-foundation.spec.ts --project=chromium --grep "mobile discovery sheet can show attendee-circle count for a published event"
```

Expected: still FAIL, but now only because the UI/API layer does not consume the new RPC yet.

- [ ] **Step 6: Commit the contract layer**

```bash
cd /Users/guygarfinkel/Documents/Cursor
git add social-matching-web/supabase/migrations/018_public_event_social_signals.sql social-matching-web/src/integrations/supabase/types.ts social-matching-web/src/features/events/types.ts social-matching-web/e2e/participant-foundation.spec.ts
git commit -m "feat(events): add public event social signal contract"
```

### Task 2: Event API and Shared Mobile Discovery Primitives

**Files:**
- Create: `src/features/events/components/EventAttendeeCircles.tsx`
- Create: `src/features/events/components/MobileEventMapSheet.tsx`
- Modify: `src/features/events/api.ts`
- Modify: `src/features/events/formatters.ts`
- Test: `e2e/participant-foundation.spec.ts`

- [ ] **Step 1: Add the failing shared UI expectation**

Add a small assertion to the same test block so the component contract is explicit:

```ts
await expect(page.getByTestId('event-attendee-circles')).toBeVisible();
await expect(page.getByText('4 כבר בפנים', { exact: true })).toBeVisible();
```

- [ ] **Step 2: Run the focused test to confirm the shared primitive does not exist**

Run:

```bash
cd /Users/guygarfinkel/Documents/Cursor/social-matching-web
npx playwright test e2e/participant-foundation.spec.ts --project=chromium --grep "mobile discovery sheet can show attendee-circle count for a published event"
```

Expected: FAIL because `data-testid="event-attendee-circles"` is not rendered anywhere.

- [ ] **Step 3: Implement API enrichment for social signals**

Update `src/features/events/api.ts` so the visible-events fetch enriches rows with the RPC payload:

```ts
async function fetchEventSocialSignals(eventIds: string[]) {
  if (eventIds.length === 0) return new Map<string, { attendee_count: number }>();

  const { data, error } = await supabase.rpc('get_public_event_social_signals', {
    event_ids: eventIds,
  });

  if (error || !data) return new Map<string, { attendee_count: number }>();

  return new Map(
    data.map((row) => [
      row.event_id,
      {
        attendee_count: row.attendee_count,
      },
    ]),
  );
}

async function withSocialSignals(events: EventRow[]): Promise<VisibleEvent[]> {
  const signals = await fetchEventSocialSignals(events.map((event) => event.id));
  return events.map((event) => ({
    ...event,
    is_registration_open: isRegistrationOpen(event),
    social_signal: signals.get(event.id),
  }));
}
```

Then switch both `listVisibleEvents()` and `getVisibleEventById()` to return `withSocialSignals(...)` instead of only `toVisibleEvents(...)`.

- [ ] **Step 4: Add the attendee-circle primitive**

Create `src/features/events/components/EventAttendeeCircles.tsx`:

```tsx
import { cn } from '@/lib/utils';

const CIRCLE_SWATCHES = [
  'from-[#efb4b0] to-[#d98f88]',
  'from-[#cad5fc] to-[#7f94e0]',
  'from-[#d7e3c5] to-[#8ea273]',
  'from-[#f2d7b5] to-[#d5a36a]',
  'from-[#efc6dc] to-[#c58ab0]',
] as const;

export function EventAttendeeCircles({
  count,
  label,
  className,
}: {
  count: number;
  label?: string;
  className?: string;
}) {
  const visibleCount = Math.max(0, Math.min(count, 5));
  if (visibleCount === 0) return null;

  return (
    <div
      data-testid="event-attendee-circles"
      className={cn('flex items-center gap-3 rounded-2xl border border-primary/10 bg-primary/5 px-3 py-2', className)}
    >
      <div className="flex items-center">
        {Array.from({ length: visibleCount }).map((_, index) => (
          <span
            key={index}
            aria-hidden="true"
            className={cn(
              '-ms-2 first:ms-0 h-7 w-7 rounded-full border-2 border-background bg-gradient-to-br shadow-sm',
              CIRCLE_SWATCHES[index],
            )}
          />
        ))}
      </div>
      <span className="text-xs text-foreground/80">{label ?? `${count} כבר בפנים`}</span>
    </div>
  );
}
```

- [ ] **Step 5: Add the mobile map/sheet primitive**

Create `src/features/events/components/MobileEventMapSheet.tsx`:

```tsx
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EventAttendeeCircles } from '@/features/events/components/EventAttendeeCircles';
import { formatEventDate, formatMobileEventWindowLabel } from '@/features/events/formatters';
import type { VisibleEvent } from '@/features/events/types';

export function MobileEventMapSheet({ event }: { event: VisibleEvent }) {
  return (
    <section className="md:hidden space-y-3">
      <div className="relative overflow-hidden rounded-[28px] border border-border/60 bg-[linear-gradient(135deg,#efe2d3,#e5d8ca)] p-4 shadow-soft-lg">
        <div className="absolute inset-x-0 top-8 mx-auto h-4 w-56 rotate-[24deg] rounded-full bg-white/60" />
        <div className="absolute start-20 top-28 h-4 w-48 -rotate-[12deg] rounded-full bg-white/60" />
        <span className="absolute end-12 top-10 h-4 w-4 rounded-[50%_50%_50%_0] rotate-[-45deg] bg-primary shadow-md" />
      </div>

      <div className="-mt-12 rounded-[28px] border border-border/60 bg-card/90 p-4 shadow-soft-lg backdrop-blur-md">
        <p className="text-center text-xs tracking-[0.02em] text-muted-foreground">{event.venue_hint ?? event.city}</p>
        <h2 className="mt-2 text-center text-[24px] leading-[34px] font-semibold tracking-[-0.015em] text-foreground">
          {event.title}
        </h2>
        <p className="mt-1 text-center text-sm leading-6 text-muted-foreground">
          {formatMobileEventWindowLabel(event)}
        </p>
        {event.social_signal?.attendee_count ? (
          <EventAttendeeCircles
            count={event.social_signal.attendee_count}
            className="mt-3 justify-center"
          />
        ) : null}
        <Button asChild variant="primary" className="mt-4 w-full">
          <Link to={`/events/${event.id}`}>לפרטי המפגש</Link>
        </Button>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Add formatter support for the mobile sheet copy**

Update `src/features/events/formatters.ts`:

```ts
export function formatMobileEventWindowLabel(event: VisibleEvent) {
  const areaHint = event.venue_hint?.trim() ?? event.city;
  const dateLabel = formatEventDate(event.starts_at);

  if (event.is_registration_open) {
    return `${dateLabel} · ${areaHint}`;
  }

  return `${dateLabel} · ${areaHint} · ההגשה סגורה כרגע`;
}
```

- [ ] **Step 7: Run the focused test and verify it passes**

Run:

```bash
cd /Users/guygarfinkel/Documents/Cursor/social-matching-web
npx playwright test e2e/participant-foundation.spec.ts --project=chromium --grep "mobile discovery sheet can show attendee-circle count for a published event"
```

Expected: PASS.

- [ ] **Step 8: Commit the shared API/UI layer**

```bash
cd /Users/guygarfinkel/Documents/Cursor
git add social-matching-web/src/features/events/api.ts social-matching-web/src/features/events/formatters.ts social-matching-web/src/features/events/components/EventAttendeeCircles.tsx social-matching-web/src/features/events/components/MobileEventMapSheet.tsx social-matching-web/e2e/participant-foundation.spec.ts
git commit -m "feat(events): add mobile map sheet primitives"
```

### Task 3: Implement the Mobile Discovery Surfaces

**Files:**
- Modify: `src/pages/events/EventsPage.tsx`
- Modify: `src/features/events/components/EventSummaryCard.tsx`
- Modify: `src/pages/events/EventDetailPage.tsx`
- Modify: `src/pages/apply/ApplyPage.tsx`
- Modify: `src/components/shared/PageShell.tsx`
- Test: `e2e/participant-foundation.spec.ts`

- [ ] **Step 1: Add failing UI expectations for the mobile browse/detail/apply flow**

Extend `e2e/participant-foundation.spec.ts` with a mobile flow test:

```ts
test('mobile discovery uses map-sheet browse and carries attendee circles into detail/apply', async ({ browser }) => {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });

  try {
    const page = await ctx.newPage();
    await page.goto('/events');

    await expect(page.getByText('4 כבר בפנים', { exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'לפרטי המפגש' }).first().click();

    await expect(page.getByTestId('event-attendee-circles')).toBeVisible();
    await expect(page.getByRole('link', { name: 'להגשה למפגש' })).toBeVisible();

    await page.getByRole('link', { name: 'להגשה למפגש' }).click();
    await expect(page.getByTestId('event-attendee-circles')).toBeVisible();
  } finally {
    await ctx.close();
  }
});
```

- [ ] **Step 2: Run the mobile flow test to confirm the real pages still need the new layout**

Run:

```bash
cd /Users/guygarfinkel/Documents/Cursor/social-matching-web
npx playwright test e2e/participant-foundation.spec.ts --project=chromium --grep "mobile discovery uses map-sheet browse and carries attendee circles into detail/apply"
```

Expected: FAIL because the live pages do not yet use the new browse/detail/apply mobile composition.

- [ ] **Step 3: Implement the mobile-first `/events` layout**

Update `src/pages/events/EventsPage.tsx` so mobile renders the map/sheet surface before the desktop card list:

```tsx
import { MobileEventMapSheet } from '@/features/events/components/MobileEventMapSheet';

// inside the success branch
<>
  <div className="space-y-4 md:hidden">
    {events.map((event) => (
      <MobileEventMapSheet key={event.id} event={event} />
    ))}
  </div>

  <div className={cn(tokens.spacing.content, 'hidden md:block')}>
    {events.map((event) => (
      <EventSummaryCard key={event.id} event={event} />
    ))}
  </div>
</>
```

Also tighten the shell copy so the mobile page title/subtitle stay calmer and more Circles-like:

```tsx
<PageShell
  title="מפגשים פתוחים"
  subtitle="ערבים קטנים, בקצב רגוע, עם דרך ברורה להבין אם זה מתאים."
>
```

- [ ] **Step 4: Update the event summary/detail surfaces to preserve the same social signal**

In `src/features/events/components/EventSummaryCard.tsx`, place attendee circles under the header metadata:

```tsx
{event.social_signal?.attendee_count ? (
  <EventAttendeeCircles count={event.social_signal.attendee_count} />
) : null}
```

In `src/pages/events/EventDetailPage.tsx`, place attendee circles below the hero/status badges and keep centered text only in the hero/title block:

```tsx
{event.social_signal?.attendee_count ? (
  <EventAttendeeCircles
    count={event.social_signal.attendee_count}
    className="justify-center sm:justify-start"
  />
) : null}
```

Use these alignment changes:

```tsx
<CardTitle className="text-center sm:text-start ...">{event.title}</CardTitle>
<p className="text-center sm:text-start text-foreground/80">{detailSubtitle}</p>
<div className="space-y-4 text-sm text-foreground/85 leading-7 text-start">...</div>
```

- [ ] **Step 5: Carry the same event identity into apply without turning it into a social feed**

Update `src/pages/apply/ApplyPage.tsx` near the event header/status area:

```tsx
import { EventAttendeeCircles } from '@/features/events/components/EventAttendeeCircles';

// in the top event summary block
{event.social_signal?.attendee_count ? (
  <EventAttendeeCircles
    count={event.social_signal.attendee_count}
    label={`${event.social_signal.attendee_count} כבר מתחילים ליצור את החדר הזה`}
  />
) : null}
```

Keep form labels and body copy reading-aligned:

```tsx
<div className="space-y-2 text-start">
  <label className="text-sm font-medium text-foreground">למה זה מתאים לך עכשיו?</label>
  ...
</div>
```

- [ ] **Step 6: Add small shell-level guardrails for typography and centered copy**

Update `src/components/shared/PageShell.tsx` so title/subtitle wrappers stay centered only when explicitly requested later, not by accident in dense content. Add a new optional prop and keep the default reading alignment:

```tsx
interface PageShellProps {
  ...
  heroAlign?: 'start' | 'center';
}

const heroAlignClassName = heroAlign === 'center' ? 'text-center mx-auto' : 'text-start';

<div className={cn('space-y-2 max-w-3xl', heroAlignClassName)}>
  ...
</div>
```

Then use `heroAlign="center"` only on the mobile-first discovery surfaces that need centered hero copy.

- [ ] **Step 7: Run the mobile flow test again**

Run:

```bash
cd /Users/guygarfinkel/Documents/Cursor/social-matching-web
npx playwright test e2e/participant-foundation.spec.ts --project=chromium --grep "mobile discovery uses map-sheet browse and carries attendee circles into detail/apply"
```

Expected: PASS.

- [ ] **Step 8: Commit the mobile surface implementation**

```bash
cd /Users/guygarfinkel/Documents/Cursor
git add social-matching-web/src/pages/events/EventsPage.tsx social-matching-web/src/features/events/components/EventSummaryCard.tsx social-matching-web/src/pages/events/EventDetailPage.tsx social-matching-web/src/pages/apply/ApplyPage.tsx social-matching-web/src/components/shared/PageShell.tsx social-matching-web/e2e/participant-foundation.spec.ts
git commit -m "feat(events): implement mobile map sheet discovery surfaces"
```

### Task 4: Polish, Regression Coverage, and Verification

**Files:**
- Modify: `e2e/participant-foundation.spec.ts`
- Modify: `docs/ops/public-readiness-smoke-checklist.md`
- Test: `npm run typecheck`

- [ ] **Step 1: Add one final mobile regression for closed-event dignity**

Add to `e2e/participant-foundation.spec.ts`:

```ts
test('mobile event detail keeps published closed events visible without a dead-end feel', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.route('**/rest/v1/events*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'playwright-closed-mobile-event',
          title: 'הליכת בוקר ושיחת קפה',
          description: 'מפגש קטן ופתוח לשיחה בדרך אחרת.',
          city: 'תל אביב',
          starts_at: '2026-05-10T07:00:00.000Z',
          registration_deadline: '2026-05-01T07:00:00.000Z',
          venue_hint: 'פארק הירקון',
          max_capacity: 6,
          status: 'closed',
          is_published: true,
          created_at: '2026-04-01T10:00:00.000Z',
          updated_at: '2026-04-01T10:00:00.000Z',
          created_by_user_id: null,
          host_user_id: null,
          payment_required: false,
          price_cents: 0,
          currency: 'ILS',
        },
      ]),
    });
  });

  await page.goto('/events/playwright-closed-mobile-event');
  await expect(page.getByText('העמוד נשאר פתוח', { exact: false })).toBeVisible();
});
```

- [ ] **Step 2: Run the focused participant regressions**

Run:

```bash
cd /Users/guygarfinkel/Documents/Cursor/social-matching-web
npx playwright test e2e/participant-foundation.spec.ts --project=chromium --grep "mobile discovery|closed events visible"
```

Expected: PASS.

- [ ] **Step 3: Run typecheck**

Run:

```bash
cd /Users/guygarfinkel/Documents/Cursor/social-matching-web
npm run typecheck
```

Expected:

```text
> social-matching-web@0.1.0 typecheck
> tsc -b --noEmit
```

with exit code `0`.

- [ ] **Step 4: Run the full participant foundation suite**

Run:

```bash
cd /Users/guygarfinkel/Documents/Cursor/social-matching-web
npx playwright test e2e/participant-foundation.spec.ts --project=chromium
```

Expected: PASS for the participant foundation suite, including the new mobile discovery assertions.

- [ ] **Step 5: Update the smoke/readiness checklist**

Add a note to `docs/ops/public-readiness-smoke-checklist.md` similar to:

```md
- [ ] Mobile discovery smoke: verified `/events` map/sheet browse on narrow viewport, attendee-circle social signal, event detail continuity, and closed-event dignity.
```

- [ ] **Step 6: Commit verification and checklist updates**

```bash
cd /Users/guygarfinkel/Documents/Cursor
git add social-matching-web/e2e/participant-foundation.spec.ts social-matching-web/docs/ops/public-readiness-smoke-checklist.md
git commit -m "test(events): cover mobile map sheet discovery flow"
```

---

## Self-Review

### Spec coverage

- Map-first mobile discovery: covered in Tasks 2 and 3
- Attendee circles: covered in Tasks 1, 2, and 3
- Text alignment and typography discipline: covered in Task 3
- Circles-first / social-energy-second balance: covered in Task 3 component and shell constraints
- Closed-event dignity: covered in Task 4

### Placeholder scan

- No `TODO` / `TBD` placeholders remain
- Each task contains explicit file paths, code, commands, and expected outcomes

### Type consistency

- `VisibleEvent.social_signal` is introduced in Task 1 and consumed consistently in Tasks 2 and 3
- RPC name `get_public_event_social_signals` is used consistently across migration, types, and API

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-21-mobile-discovery-map-sheet-implementation.md`.

Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
