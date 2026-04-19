# F-2: Clarify `/questionnaire` guard semantics in `routeManifest.ts`

- **Status:** done
- **Resolution:** **Option A** — Introduced manifest auth tier `preview` with file-level JSDoc; `/questionnaire` and `/auth/callback` use `preview`. Runtime routing unchanged (same as `public`); guards not modified.
- **Raised by:** Developer A (participant workstream), 2026-04-20
- **Impact:** Routing correctness / spec alignment. No current user-visible bug.
- **Blocking:** No
- **Owner:** Foundation (TBD)

## Current state

`src/app/router/routeManifest.ts`:

```ts
{
  path: '/questionnaire',
  workstream: 'participant',
  auth: 'public',
  dataStatus: 'real',
  classification: 'Existing and keep',
  supportedStates: ['loading', 'error', 'success'],
  nextSteps: ['/events', '/dashboard'],
},
```

`/questionnaire` is currently marked `auth: 'public'`.

## Why this is worth clarifying

Every other route in the manifest uses `auth: 'public' | 'protected'` as a
hard gate:

- `public` ⇒ accessible to anyone, including signed-out visitors.
- `protected` ⇒ requires an authenticated session; redirected to `/landing`
  (or equivalent) if signed out.

`/questionnaire` sits in a semantic gray zone:

1. **Signed-in users** land here after auth-callback to fill in profile
   readiness fields (`birth_date`, chip preferences, etc.). For them it
   behaves as a _protected_ onboarding step.
2. **Signed-out visitors** can technically reach `/questionnaire` directly,
   but the page has nothing useful to show them — it needs a profile row to
   hydrate, so it either renders an empty state or a login prompt.

Marking it `public` is not _wrong_ today because the page itself degrades
gracefully. But the manifest loses expressive power: a reader of the manifest
cannot tell whether `/questionnaire` is "really public" (like `/landing`,
`/events`, `/events/:eventId`, `/gathering/:eventId`) or "effectively
protected" (requires a session to do its job).

The Dev A originator of this ticket flagged it during Pass-3 review when
tightening the Q1 guard on the questionnaire page — the page-level guard and
the manifest disagree in letter if not in spirit.

## Proposed change

Foundation needs to pick **one** of these three resolutions. Dev A does not
have standing to pick among them because all three are legitimate product /
architecture decisions.

### Option A — Introduce a new auth tier: `preview`

```ts
auth: 'public' | 'preview' | 'protected';
```

- `public`: truly no auth required; full functionality for anon users.
- `preview`: reachable anonymously but only "fully functional" with a session;
  page is responsible for graceful-degradation copy when anon.
- `protected`: redirect anon to `/landing`.

Mark `/questionnaire` as `auth: 'preview'`. Document the semantics in a
manifest-level JSDoc comment.

Pros: Expressive. Future-proof (more routes may fit this tier —
`/auth/callback`? `/dashboard` pre-fetch?). Encodes existing reality.
Cons: One more concept for everyone to learn. Needs updates everywhere the
manifest `auth` is consumed (guards, tests, any admin tooling that
introspects the manifest).

### Option B — Promote `/questionnaire` to `protected`

Mark `/questionnaire` as `auth: 'protected'` and route anon visitors to
`/landing` (or `/auth/login`).

Pros: Zero new concepts. Simplest manifest. Matches the page's actual
behavior for the primary flow (onboarding after auth-callback).
Cons: Changes user-visible behavior. If anyone has a link to
`/questionnaire` they can't preview the form at all. May cause a regression
in QA scripts / marketing screenshots. Needs a grep audit.

### Option C — Keep `public` and document explicitly

Add a comment right on the route entry:

```ts
{
  path: '/questionnaire',
  // Intentionally `public`: the page is reachable anonymously as a preview,
  // but requires an authenticated profile row to be functional. See
  // docs/foundation-tickets/2026-04-20-02-questionnaire-guard-semantics.md.
  auth: 'public',
  // ...
},
```

Pros: Lowest-cost. No code churn. Preserves today's behavior.
Cons: The semantic gray zone stays. Same ambiguity will bite the next
workstream touching routing. Comments rot.

## Recommendation

Option A if Foundation has bandwidth; Option C if not. Option B is the
correct spec-purist answer but has the largest blast radius and is the only
one that changes user-facing behavior.

## Non-goals

- Not rewriting `guards.tsx`. Whichever option lands, the guards change is
  mechanical.
- Not auditing every `auth: 'public'` route in the manifest for similar
  ambiguity. If Option A lands, a follow-up ticket can sweep
  `/auth/callback`, `/gathering/:eventId`, etc.
- Not changing what `/questionnaire` renders — only how it is _classified_.

## Acceptance criteria (Option A)

- [ ] `routeManifest.ts` type updated to include `'preview'` in the `auth`
      union.
- [ ] `/questionnaire` entry uses `auth: 'preview'`.
- [ ] Manifest-level JSDoc block documents each tier.
- [ ] `guards.tsx` (or equivalent) either treats `preview` the same as
      `public` (current behavior) or adds an intentional
      preview-specific hook — decision recorded in the PR description.
- [ ] `npx tsc -b --noEmit` clean.
- [ ] `npx playwright test --project=chromium` still green.

## Acceptance criteria (Option B)

- [ ] `/questionnaire` entry uses `auth: 'protected'`.
- [ ] Anon visits to `/questionnaire` redirect to `/landing` (or whatever the
      chosen destination is).
- [ ] E2E test covers anon redirect.
- [ ] QA / marketing are notified of the behavior change.

## Acceptance criteria (Option C)

- [ ] Comment added per the proposal.
- [ ] This ticket is re-marked `done`.
- [ ] No code behavior changes.

## Open questions

1. Which option wins?
2. If Option A wins, does `/auth/callback` want the same tier? (Likely yes;
   it renders a loading state and either redirects or errors based on
   session.)
3. If Option B wins, what is the anon redirect destination — `/landing` or a
   dedicated `/auth/login`?
