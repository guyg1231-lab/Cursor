# F-3: Phantom `/host/settings` entry in `routeManifest.ts`

- **Status:** in-progress
- **Raised by:** Developer A (participant workstream), 2026-04-20
- **Impact:** Routing documentation is misleading; anyone reading `routeManifest.ts` as the source of truth for which routes exist will believe `/host/settings` is a live URL. Blocks Dev B's ability to use the manifest as an accurate roadmap view.
- **Blocking:** No (no user-visible bug — the route is simply unreachable).
- **Owner:** Foundation (TBD)

## Current state

`src/app/router/routeManifest.ts` (lines 245-253):

```ts
{
  path: '/host/settings',
  workstream: 'host',
  auth: 'protected',
  dataStatus: 'stubbed',
  classification: 'Later, no route yet',
  supportedStates: ['unavailable'],
  nextSteps: ['/host/events'],
},
```

`src/app/router/AppRouter.tsx:53-92` — host routes (no `/host/settings` defined):

```tsx
      <Route
        path="/host/events"
        element={
          <ProtectedRoute>
            <HostEventsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/host/events/:eventId/registrations"
        element={
          <ProtectedRoute>
            <HostEventRegistrationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/host/events/:eventId/communications"
        element={
          <ProtectedRoute>
            <HostEventCommunicationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/host/events/:eventId/follow-up"
        element={
          <ProtectedRoute>
            <HostEventFollowUpPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/host/events/:eventId"
        element={
          <ProtectedRoute>
            <HostEventWorkspacePage />
          </ProtectedRoute>
        }
      />
```

There is no `<Route path="/host/settings" ... />` anywhere in `AppRouter.tsx`.
The manifest entry exists; the route does not. Any navigation to
`/host/settings` falls through to the catch-all
`<Route path="*" element={<Navigate to="/" replace />} />` on line 157.

## Why this is worth fixing

The manifest is the one file a new contributor (or Dev B, opening the host
workstream) reads to understand what pages exist. When the manifest describes
a route that the router does not serve, that trust breaks:

- Dev B's roadmap view — "what host pages exist today vs. what's planned" —
  becomes wrong in both directions (`/host/settings` appears to exist but
  doesn't).
- Automated tooling that introspects the manifest (e.g., a future "walk every
  registered route" E2E smoke test, a sitemap generator) will try to visit a
  nonexistent URL and get silently redirected to `/`.
- The `classification: 'Later, no route yet'` comment inside the manifest
  acknowledges the entry is aspirational, but there is no type-level or
  runtime signal separating aspirational entries from registered ones.

## Proposed change

Foundation needs to pick **one** of these two resolutions.

### Option A — Delete the entry

Remove the `/host/settings` entry from `routeManifest.ts`. When the route is
actually built, add it back alongside the `AppRouter.tsx` change in the same
PR.

Pros: Simplest. Matches the invariant "every manifest entry corresponds to a
registered route." No new concepts.
Cons: Loses the roadmap signal — someone skimming the manifest no longer sees
that a settings page is planned.

### Option B — Add a `registered` (or `plannedOnly`) flag

Extend `RouteManifestEntry` with an optional boolean, e.g.:

```ts
export type RouteManifestEntry = {
  // ...existing fields...
  /** True when AppRouter serves this path; false for roadmap-only entries. */
  registered?: boolean;
};
```

Mark `/host/settings` as `registered: false`. Consumers that want "only live
routes" filter accordingly; consumers that want the full roadmap read the raw
array.

Pros: Preserves roadmap intent. Future-proof for additional planned routes.
Cons: One more field for every consumer to think about. Needs updates to any
code that treats the manifest as the set of live routes (e.g., nav renderers,
E2E helpers).

## Recommendation

Option A for simplicity unless Foundation explicitly wants the manifest to
track roadmap routes. Today there is exactly one phantom entry, so the
roadmap-tracking feature would be over-engineered for a single data point.

## Non-goals

- Not creating the `/host/settings` route itself.
- Not updating or rewriting any host page.
- Not auditing the manifest for other phantom entries — a quick grep against
  `AppRouter.tsx` confirmed this is the only one today.

## Acceptance criteria (Option A)

- [ ] `/host/settings` entry removed from `routeManifest.ts`.
- [ ] No behavior change in `AppRouter.tsx` (there was never a route to
      remove).
- [ ] `npx tsc -b --noEmit` clean.
- [ ] `npx playwright test --project=chromium` still green.

## Acceptance criteria (Option B)

- [ ] `RouteManifestEntry` gains an optional `registered` (or
      `plannedOnly`) field, documented in a type-level JSDoc.
- [ ] `/host/settings` entry sets that field to `false` (or `true` for
      "planned only", whichever semantics wins).
- [ ] Every existing manifest entry is either explicitly `registered: true`
      or defaults to `true` (decision recorded in the PR description).
- [ ] Any manifest consumer that needs only live routes filters
      accordingly.
- [ ] `npx tsc -b --noEmit` clean.

## Open questions

1. Should the manifest track planned routes at all, or is it strictly the
   set of currently-registered routes?
2. If Option B wins, is the field named `registered` (route exists today) or
   `plannedOnly` (route does not exist today) — which polarity is easier to
   read at call sites?
