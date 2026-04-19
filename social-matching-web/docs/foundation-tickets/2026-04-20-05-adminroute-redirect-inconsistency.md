# F-5: `AdminRoute` silent redirect vs. `ProtectedRoute` auth-with-return

- **Status:** in-progress
- **Raised by:** Developer A (participant workstream), 2026-04-20
- **Impact:** Non-admin users (and signed-out visitors) hitting any `/admin/*` URL get dumped to the landing page silently, with zero feedback about why. UX failure for anyone who mistypes an admin URL, follows a stale link, or loses admin privileges mid-session. Also makes negative-case guard testing impossible without an observable denial state — an E2E test cannot distinguish "admin route denied" from "admin home briefly rendered then redirected" from "user was never signed in".
- **Blocking:** Blocks a complete foundation-routes E2E suite that exercises the guard denial path.
- **Owner:** Foundation (TBD)

## Current state

`src/app/router/guards.tsx:6-21` (ProtectedRoute):

```tsx
export function ProtectedRoute({ children }: PropsWithChildren) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="container py-10 text-sm text-muted-foreground">Loading...</div>;
  }

  if (!user) {
    const attemptedPath = parseSafeReturnTo(`${location.pathname}${location.search}`);
    storePostAuthReturnTo(attemptedPath);
    return <Navigate to={buildAuthPath(attemptedPath)} replace />;
  }

  return <>{children}</>;
}
```

`src/app/router/guards.tsx:23-35` (AdminRoute):

```tsx
export function AdminRoute({ children }: PropsWithChildren) {
  const { user, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <div className="container py-10 text-sm text-muted-foreground">Loading...</div>;
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
```

Contrast the two denial paths:

- `ProtectedRoute` (lines 14-17): stores the attempted URL via
  `storePostAuthReturnTo`, then redirects to `buildAuthPath(attemptedPath)`
  so the user returns to where they wanted to go after signing in.
- `AdminRoute` (lines 30-32): collapses two distinct denial cases (`!user`
  and `user && !isAdmin`) into a single silent redirect to `/`. No stored
  return-to, no message, no way for the UI to differentiate "you need to
  sign in" from "you are signed in but not an admin".

## Why this is worth fixing

Three concrete failure modes today:

1. **Signed-out user follows an `/admin/...` deep link.** Expected: same
   auth-with-return experience as `ProtectedRoute` gives for `/dashboard`.
   Actual: dumped on the landing page, no sign-in prompt, no return-to
   memory.
2. **Signed-in non-admin user follows an `/admin/...` deep link (stale
   share from an admin colleague).** Expected: an explicit "you do not
   have access" state. Actual: silent redirect to `/`, leaving the user to
   guess whether the URL was wrong, the page crashed, or they were logged
   out.
3. **E2E coverage.** A guard-denial test for `AdminRoute` has no DOM
   signal to assert on — the user just finds themselves back on the
   landing page, which is indistinguishable from any other landing-page
   visit.

## Proposed change

Foundation needs to pick **one** of these two options.

### Option A — Split `AdminRoute`'s two cases

Treat `!user` identically to `ProtectedRoute` (auth-with-return), and give
`user && !isAdmin` its own explicit denial UI.

```tsx
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
        title="אין גישה"
        body="הדף הזה זמין רק לצוות התפעול."
        // plus a CTA back to `/`
      />
    );
  }

  return <>{children}</>;
}
```

Exact Hebrew copy to be agreed with product — the strings above are
placeholders so the shape is clear.

Pros: Distinct, testable denial states. Signed-out users get the
return-to flow they get everywhere else. Uses primitives already in the
codebase (`RouteGatedState`).
Cons: Requires agreeing on Hebrew copy for the access-denied state.
Slightly more surface area for the admin guard.

### Option B — Keep the redirect, surface a toast

Always redirect to `/` but dispatch a toast ("אין לך גישה לדף הזה") so the
user gets feedback without a new page state. Requires a toast primitive,
which does not currently exist in the codebase — would need a dependent
ticket to introduce one.

Pros: No new denied-state UI. Keeps the guard small.
Cons: Toasts are the wrong affordance for "you followed a link that won't
work"; they vanish. Signed-out users still lose the auth-with-return
behavior. Also requires new infrastructure (a toast library / provider).

## Recommendation

Option A. The signed-out branch is a pure copy of `ProtectedRoute`'s
already-working logic; the denied branch reuses an existing route-state
primitive (`RouteGatedState`). Option B requires net-new infrastructure
for a weaker UX.

## Non-goals

- Not changing admin authorization rules (who is considered an admin,
  how `isAdmin` is computed, what scopes map to what routes).
- Not introducing a toast library.
- Not consolidating `ProtectedRoute` and `AdminRoute` into one component
  — they serve different audiences and the duplication is small.

## Acceptance criteria (Option A)

- [ ] `AdminRoute` handles `isLoading`, `!user`, and `user && !isAdmin`
      as three distinct cases.
- [ ] `!user` branch matches `ProtectedRoute`'s auth-with-return flow
      (stores attempted path, redirects to `buildAuthPath`).
- [ ] `user && !isAdmin` branch renders an explicit Hebrew denial state
      (likely `RouteGatedState`) with a CTA back to `/`.
- [ ] At least one Playwright test visits an `/admin/*` URL as a
      signed-in non-admin user and asserts the denial copy is visible.
- [ ] At least one Playwright test visits an `/admin/*` URL as a
      signed-out user and asserts the auth redirect preserves the
      return-to.
- [ ] `npx tsc -b --noEmit` clean.

## Open questions

1. Option A or Option B?
2. If Option A, what's the exact Hebrew copy for the access-denied
   title and body? (Placeholder above: `אין גישה` / `הדף הזה זמין רק
   לצוות התפעול.`)
3. If Option A, should the denied branch render inside the app shell
   (so the header stays visible) or replace the whole page?
