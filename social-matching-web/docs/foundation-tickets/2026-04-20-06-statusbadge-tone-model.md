# F-6: `StatusBadge` tone model is too narrow

- **Status:** in-progress
- **PR:** _(add merge PR link)_
- **Raised by:** Developer A (participant workstream), 2026-04-20
- **Impact:** Every "status" surface — application lifecycle list, event detail, apply page, profile readiness card, placeholder panel — renders badges in the same neutral tone regardless of semantic severity. There is no way to distinguish `confirmed` (success) from `waitlist` (warning) from `cancelled` (danger) from `pending` (default). Callers either accept the flat look or reach around the primitive with inline color classes, defeating its purpose.
- **Blocking:** No (purely cosmetic today), but blocks a consistent severity UX across all lifecycle surfaces.
- **Owner:** Foundation (TBD)

## Current state

`src/components/shared/StatusBadge.tsx`:

```tsx
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

Five call sites use only the two supported tones:

- `src/components/shared/PlaceholderPanel.tsx:19-22` — `tone={contractState === 'stubbed' ? 'muted' : 'default'}`.
- `src/features/profile/components/ProfileReadinessCard.tsx:25` — `tone={ready ? 'default' : 'muted'}`.
- `src/pages/apply/ApplyPage.tsx:624` — no `tone` prop (implicit `default`).
- `src/pages/events/EventDetailPage.tsx:169` — no `tone` prop (implicit `default`).
- `src/features/applications/components/ApplicationLifecycleList.tsx:22` — no `tone` prop (implicit `default`).

Applications pass through `formatApplicationStatusShort` (in
`src/features/applications/status.ts:52-75`), which produces distinct
Hebrew labels for `pending`, `awaiting_response`, `confirmed`, `approved`,
`waitlist`, `rejected`, `cancelled`, `attended`, `no_show` — but every one
of those labels is rendered in the same primary-tinted pill.

There is also one standalone ad-hoc badge span at
`src/pages/admin/OperatorEventDashboardPage.tsx:370-372` that does not use
`StatusBadge` at all, suggesting at least one author already felt the
primitive was insufficient.

## Why this is worth fixing

The application-lifecycle surfaces are the primary place a participant
checks "what's the state of my registration?" — and the pill is the
highest-visibility element of that surface. Flat tones wash out the
difference between states that carry different levels of urgency.

Callers have three current escape hatches, all bad:

1. Accept the flat look (current reality).
2. Wrap the badge in an inline `<span className="text-red-500">` (sometimes
   done in surrounding prose, diluting semantic clarity).
3. Render an ad-hoc pill span that bypasses `StatusBadge` entirely (see
   `OperatorEventDashboardPage.tsx:370-372`).

None of these produce consistent severity UX across the app.

## Proposed change

Extend the `tone` union and add a mapping helper.

### Widen the tone union

```tsx
export function StatusBadge({
  label,
  tone = 'default',
}: {
  label: string;
  tone?: 'default' | 'muted' | 'success' | 'warning' | 'danger';
}) {
  // token-driven className per tone
}
```

Each tone maps to a token-driven pair (border + background + text). The
specific classes should be drawn from `@/lib/design-tokens` rather than
raw Tailwind color names, so dark-mode and theme swaps "just work". Token
names to be agreed with Foundation.

### Add a status-to-tone mapping helper

```ts
// src/features/applications/presentation.ts
export function resolveApplicationBadgeTone(
  status: EventRegistrationRow['status'],
): BadgeTone { /* ... */ }
```

Call sites pass `tone={resolveApplicationBadgeTone(application.status)}`
instead of duplicating the mapping logic. The helper lives in the
applications feature module because the mapping is feature-specific (not
every `StatusBadge` consumer uses application statuses — `ProfileReadinessCard`
and `PlaceholderPanel` have their own mappings).

### Backward compatibility

The two existing tones (`default`, `muted`) retain their current class
strings. Every existing call site continues to render identically until
its author opts in to a severity tone. This is additive only.

## Non-goals

- Not changing any existing call site's current tone in this ticket.
  Migrations to severity tones are follow-ups, one call site at a time.
- Not introducing a new primitive (e.g., a `<Pill>` component). We keep
  `StatusBadge` and widen its API.
- Not relocating `StatusBadge` from `components/shared/` to
  `components/ui/` (that question is filed as F-9).
- Not building a generic `tone` mapping for every domain — each domain
  (applications, contract states, readiness) gets its own helper if and
  when it needs one.

## Acceptance criteria

- [ ] `StatusBadge`'s `tone` prop accepts `'default' | 'muted' | 'success'
      | 'warning' | 'danger'`.
- [ ] Each tone maps to a token-driven class string; no raw Tailwind
      color names in the component.
- [ ] `resolveApplicationBadgeTone(status)` (or equivalent) lives in
      `src/features/applications/presentation.ts` and covers every status
      value `formatApplicationStatusShort` handles.
- [ ] All existing call sites compile without changes and render
      identically (backward compatible).
- [ ] `npx tsc -b --noEmit` clean.
- [ ] `npx playwright test --project=chromium` still green.

## Open questions

1. Which application statuses map to which tones? A working straw-man:
   - `confirmed`, `approved`, `attended` → `success`
   - `awaiting_response`, `waitlist` → `warning`
   - `rejected`, `cancelled`, `no_show` → `danger`
   - `pending` → `default`

   Foundation/product to confirm.
2. Should `PlaceholderPanel`'s `stubbed` contract state upgrade from
   `muted` to `warning` as part of F-7, or stay `muted`?
3. Does `ProfileReadinessCard`'s "not ready" case want `warning` instead
   of `muted`?
4. Exact token names for each severity tone (e.g., do we want a new
   `tokens.status.success` surface, or compose from existing tokens)?
