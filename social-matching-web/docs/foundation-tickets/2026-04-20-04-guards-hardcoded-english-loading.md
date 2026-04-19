# F-4: Hardcoded English `Loading...` in `guards.tsx`

- **Status:** in-progress
- **Raised by:** Developer A (participant workstream), 2026-04-20
- **Impact:** Every protected and admin page shows English `Loading...` to Hebrew users on first render while auth resolves. This is the most visible English leak on the participant surface — any Hebrew-speaking visitor who lands on `/dashboard` (or any other protected URL) while the session is still loading sees the literal ASCII word.
- **Blocking:** Does not block any feature. Depends on F-1 (Hebrew `body` prop on `RouteLoadingState`) for the clean fix; a stopgap Hebrew literal can ship independently.
- **Owner:** Foundation (TBD)

## Current state

`src/app/router/guards.tsx`:

```tsx
export function ProtectedRoute({ children }: PropsWithChildren) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="container py-10 text-sm text-muted-foreground">Loading...</div>;
  }
  // ...
}

export function AdminRoute({ children }: PropsWithChildren) {
  const { user, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <div className="container py-10 text-sm text-muted-foreground">Loading...</div>;
  }
  // ...
}
```

Both guards (lines 10-12 and 26-28) render the same inline English `<div>`
with no translation function call and no fallback through the shared route
primitives.

## Why this is worth fixing

The rest of the participant surface is Hebrew-only; `EventsPage`,
`ApplyPage`, `DashboardPage`, `QuestionnairePage`, `GatheringPage`,
`LandingPage`, etc. all render Hebrew copy (or route primitives that default
to Hebrew). The guards are the _only_ reason a Hebrew user will see any
English string on the happy path: every navigation into a protected route
flashes `Loading...` between the React tree mounting and `useAuth` settling.

On a slow connection, or when the auth context is rebuilding after a token
refresh, that flash can linger long enough to be jarring.

## Proposed change

Replace both inline `<div>`s with `RouteLoadingState` from
`src/components/shared/RouteState.tsx`:

```tsx
import { RouteLoadingState } from '@/components/shared/RouteState';

if (isLoading) {
  return <RouteLoadingState />;
}
```

This depends on F-1 landing first so that `RouteLoadingState` has a Hebrew
default body. Once F-1 is in, guards inherit Hebrew copy with zero extra
wiring.

### Alternative (immediate stopgap)

If F-1 has not landed, hardcode the Hebrew literal inside the guard
renderers as an interim fix:

```tsx
if (isLoading) {
  return <div className="container py-10 text-sm text-muted-foreground">טוען…</div>;
}
```

The stopgap is ugly (another hardcoded literal) but removes the English leak
on participant pages immediately. When F-1 lands, the stopgap is replaced
with `<RouteLoadingState />`.

## Non-goals

- Not introducing a new i18n library or translation system.
- Not changing guard logic (who gets redirected, where, or with what side
  effects). This ticket is a pure rendering change.
- Not touching any other loading UI on any other page.

## Acceptance criteria (preferred, post F-1)

- [ ] `ProtectedRoute` renders `<RouteLoadingState />` when `isLoading`.
- [ ] `AdminRoute` renders `<RouteLoadingState />` when `isLoading`.
- [ ] No English strings remain in `guards.tsx`.
- [ ] `npx tsc -b --noEmit` clean.
- [ ] `npx playwright test --project=chromium` still green.

## Acceptance criteria (stopgap)

- [ ] Both guards render the chosen Hebrew literal (e.g., `טוען…`) during
      `isLoading`.
- [ ] Ticket is re-opened or linked from F-1 so the cleanup happens once
      the primitive is ready.

## Open questions

1. Stopgap Hebrew literal now, or wait for F-1?
2. If stopgap, what's the exact word — `טוען…`, `טוענים…`, or something
   else? (F-1's default body proposal uses `טוענים…`.)
