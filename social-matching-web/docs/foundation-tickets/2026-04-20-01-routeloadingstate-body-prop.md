# F-1: `RouteLoadingState` should accept a Hebrew body (or a `body` prop)

- **Status:** done
- **Raised by:** Developer A (participant workstream), 2026-04-20
- **Impact:** Dev A (deferred `EventsPage.tsx` loading-state normalization); Dev B (upcoming host/admin loading states in Hebrew)
- **Blocking:** No (workaround: inline `Card` with Hebrew copy)
- **Owner:** Foundation (TBD)
- **PR:** [#20](https://github.com/guyg1231-lab/Cursor/pull/20)

## Current state

`src/components/shared/RouteState.tsx`:

```tsx
export function RouteLoadingState({ title = 'Loading…' }: { title?: string } = {}) {
  return <RouteStateCard title={title} body="Please wait while this page loads." />;
}
```

`RouteLoadingState` is the only route-state primitive whose `body` is hardcoded
(and in English). All the other primitives (`RouteEmptyState`, `RouteErrorState`,
`RouteUnavailableState`, `RouteNotFoundState`, `RouteGatedState`,
`RouteSuccessState`) accept both `title` and `body` as props, consistent with
`RouteStateProps`.

## Why this matters

The participant surface is Hebrew-only. Dev A normalized empty and error
states on `/events` to the shared primitives in PR #9 but had to leave the
loading state as an inline bespoke `Card`:

```tsx
// src/pages/events/EventsPage.tsx
{isLoading ? (
  <Card className={tokens.card.surface}>
    <CardContent className="py-10 text-sm text-muted-foreground">טוענים מפגשים...</CardContent>
  </Card>
) : error ? (
  <RouteErrorState title="שגיאת טעינה" body={error} />
) : ...}
```

`EventsPage` hand-rolls an inline `Card` specifically for the loading state (its error and empty states already use `RouteErrorState` and `RouteEmptyState`); it cannot yet adopt `RouteLoadingState` because the primitive does not accept a Hebrew body paragraph. Other participant pages (`ApplyPage`, `GatheringPage`, `EventDetailPage`) still hand-roll inline Cards for various non-success states and will migrate once `RouteLoadingState` ships with a `body` prop and a broader Dev A sweep extracts the shared patterns.

Dev B will hit the same issue on every host/admin page that needs a
Hebrew-facing loading state.

## Proposed change

Align `RouteLoadingState`'s signature with the other primitives:

```tsx
type RouteLoadingProps = {
  title?: string;
  body?: string;
};

export function RouteLoadingState({
  title = 'טוענים…',
  body = 'המערכת טוענת את הדף, רק רגע.',
}: RouteLoadingProps = {}) {
  return <RouteStateCard title={title} body={body} />;
}
```

Key decisions baked into this proposal:

1. **Default copy is Hebrew**, matching the rest of the user-facing surface.
   Admin-internal English usages (if any) will pass explicit English props.
2. **Both `title` and `body` are optional**, preserving the zero-argument
   call-site ergonomics (`<RouteLoadingState />`).
3. **No new callers required** — existing `<RouteLoadingState />` and
   `<RouteLoadingState title="…" />` both remain valid.

## Non-goals

- Not changing the visual shell (`RouteStateCard` class tokens, spacing).
- Not introducing a spinner / animation — this is a copy fix, not a design
  change.
- Not refactoring the other `RouteState*` primitives — they already match the
  target shape.
- Not requiring all consumers to migrate at once; `EventsPage.tsx` (and any
  later Dev B consumers) can adopt it at their own pace.

## Acceptance criteria

- [ ] `RouteLoadingState` accepts `body` as an optional prop.
- [ ] Default title and body are Hebrew.
- [ ] Existing callers (zero-arg or `title`-only) still compile and render
      something sensible.
- [ ] `EventsPage.tsx` is migrated off its inline `Card` to
      `<RouteLoadingState />` as part of the same PR (or an immediate
      follow-up).
- [ ] `npx tsc -b --noEmit` clean.
- [ ] `npx playwright test --project=chromium` still green (25/25 + 2 skipped
      baseline).
- [ ] No English strings reintroduced to the participant surface (spot-check
      `EventsPage`, `ApplyPage`, `DashboardPage`, `EventDetailPage`,
      `GatheringPage`, `LandingPage`, `QuestionnairePage`).

## Open questions

1. **Default body wording.** The proposal above uses `המערכת טוענת את הדף, רק רגע.`
   Alternatives: `עוד רגע ואנחנו שם.`, `טוענים את הדף…`. Foundation or
   product should pick one.
2. **Do we also want a loading `Card` without a body line at all** (just the
   title line)? Some pages use the loading card as a minimal skeleton. If so,
   allow `body={null}` or a `variant: 'terse'` flag. Current proposal does
   NOT include this; it can be a follow-up if anyone asks.
3. **Should all `RouteState*` primitives accept a default Hebrew title/body**
   for consistency, rather than only `RouteLoadingState`? Current proposal says
   no — defaults only make sense for loading, since every other state requires
   caller-supplied context (what's empty, what errored, etc.).

## Notes

Originally noted in Dev A's 2026-04-19 handoff under "Phase 2 / foundation
follow-ups". Deferred until Dev A's Pass-3 stack lands because:

- It does not block any participant-surface functionality.
- The workaround (inline `Card`) is 6 lines and perfectly readable.
- Re-normalizing after the ticket lands is a trivial migration.
