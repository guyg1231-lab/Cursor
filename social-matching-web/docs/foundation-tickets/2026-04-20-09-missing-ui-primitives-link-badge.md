# F-9: Missing `Link` and `Badge` UI primitives (low priority)

- **Status:** proposed
- **Raised by:** Developer A (participant workstream), 2026-04-20
- **Impact:** Low. `src/components/ui/` currently holds only `Button` and `Card`. Two minor patterns are handled ad-hoc across the codebase: (a) essentially every `<Link>` used as a styled CTA pairs with `<Button asChild>` as a repeated idiom, and (b) there is at least one inline "pill" span that sidesteps `StatusBadge`. Filed for visibility, not urgency.
- **Blocking:** No. Existing patterns work; this is an ergonomics / organization question.
- **Owner:** Foundation (TBD)

## Current state

### `src/components/ui/` contents

```
src/components/ui/
├── button.tsx
└── card.tsx
```

Two primitives. No `link.tsx`, no `badge.tsx`.

Note: the foundation-tickets README.md already lists `Link` as a
foundation-owned primitive under `src/components/ui/*`, but no such file
exists yet. F-9 proposes to make reality match the README (or revise the
README if Foundation decides these primitives are not worth extracting).

### `<Link>` / `<Button asChild>` idiom

`src/**/*.tsx` contains 51 `<Link>` renderings (counted via `Link to=`
matches) and 50 `<Button asChild>` renderings. In practice essentially
every styled navigation element is written as:

```tsx
<Button asChild variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-foreground">
  <Link to="/some-path">label</Link>
</Button>
```

The most concentrated cluster is `src/components/shared/AppHeader.tsx`
lines 53-94, which uses this exact pattern six times in a row with the
same `variant`, `size`, and `className` combinations.

### Inline badge outside `StatusBadge`

`src/pages/admin/OperatorEventDashboardPage.tsx:370-372`:

```tsx
<span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs">
  {formatApplicationStatusShort(a.status)}
</span>
```

This is a hand-rolled `StatusBadge` with slightly different padding
(`py-0.5` vs. the primitive's `py-1`), rendered next to applicant names in
the operator dashboard. It predates or ignores `StatusBadge`.

## Why this is worth considering

The `<Button asChild><Link></Link></Button>` idiom is not broken, but it
is noise: every navigation CTA carries five or six tokens of repetition
that a wrapper would eliminate. And the one ad-hoc badge in
`OperatorEventDashboardPage.tsx` suggests at least one author either
didn't know about `StatusBadge` or found its API insufficient (possibly
resolved by F-6).

Neither pain point is urgent. Both are reasonable candidates to leave
alone if Foundation prefers the existing patterns.

## Proposed change

Two independent options that can be taken in any order (or neither).

### Option A — Extract a `RouterLinkButton` primitive

Add `src/components/ui/router-link-button.tsx` (or similar name — could
also live in `components/shared/`):

```tsx
type RouterLinkButtonProps = React.ComponentProps<typeof Button> & {
  to: string;
};

export function RouterLinkButton({ to, children, ...buttonProps }: RouterLinkButtonProps) {
  return (
    <Button asChild {...buttonProps}>
      <Link to={to}>{children}</Link>
    </Button>
  );
}
```

Call sites become:

```tsx
<RouterLinkButton to="/events" variant="ghost" size="sm" className="...">
  {t('navEvents')}
</RouterLinkButton>
```

Migration is optional — callers can adopt as they touch files, or never.

### Option B — Relocate `StatusBadge` to `ui/badge.tsx`

Move `src/components/shared/StatusBadge.tsx` to
`src/components/ui/badge.tsx`, export as `Badge`, and update imports.
Then migrate the lone inline pill in `OperatorEventDashboardPage.tsx` to
use it.

This clarifies the `components/ui` vs. `components/shared` split:

- `components/ui/` — atomic tokens-driven primitives (button, card,
  badge, …).
- `components/shared/` — composed surfaces (PageShell, RouteState,
  AppHeader, PlaceholderPanel, …).

Fits naturally with F-6 (extending `StatusBadge`'s tone union); both
could land together.

### Recommendation

Either is safe to defer. If either is picked up, Option B is the higher
signal-to-noise change because it both (a) organizes the primitive
hierarchy and (b) eliminates the one ad-hoc badge we know about. Option
A is pure ergonomics; close as WONTFIX if the existing `Button
asChild>Link` idiom is considered the house style.

## Non-goals

- Not rewriting every existing `<Button asChild><Link></Link></Button>`
  call site preemptively. Any migration is opportunistic.
- Not introducing a design-system refactor, a new tokens layer, or a
  rename of `components/ui/` vs. `components/shared/`.
- Not filing the inline pill in `OperatorEventDashboardPage.tsx` as its
  own ticket; it gets fixed (or not) alongside whichever option wins.

## Acceptance criteria (Option A)

- [ ] `RouterLinkButton` exists as a primitive and is exported from a
      sensible path.
- [ ] At least `AppHeader.tsx` (the densest cluster) is migrated as a
      demonstration / canary.
- [ ] Other call sites remain on the old idiom; no forced migration.
- [ ] `npx tsc -b --noEmit` clean.

## Acceptance criteria (Option B)

- [ ] `StatusBadge` relocated to `src/components/ui/badge.tsx` (renamed
      `Badge` if the rename is desired) with imports updated everywhere.
- [ ] Inline pill in `OperatorEventDashboardPage.tsx:370-372` replaced
      with the relocated primitive.
- [ ] No visual regression on any surface that renders the primitive.
- [ ] Coordinates with F-6 if F-6 is in flight (agree on order).
- [ ] `npx tsc -b --noEmit` clean.

## Acceptance criteria (close as WONTFIX)

- [ ] Foundation decides the existing idioms are preferred.
- [ ] Ticket is re-marked `rejected` with a note explaining the
      decision so the next person who notices the pattern doesn't
      re-file it.

## Open questions

1. Is the `<Button asChild><Link></Link></Button>` idiom considered the
   house style? If yes, close this ticket.
2. If Option B wins, keep the name `StatusBadge` or rename to `Badge`?
   `Badge` is shorter but `StatusBadge` signals intent.
3. Is there a third inline-badge pattern lurking somewhere I didn't
   find? (A codebase-wide audit was not exhaustive.)
