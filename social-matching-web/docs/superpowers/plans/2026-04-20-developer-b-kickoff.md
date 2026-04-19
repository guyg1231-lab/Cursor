# Developer B Kickoff — Host + Admin Workstream

**Created:** 2026-04-20
**Author:** Developer A (outgoing)
**Audience:** Developer B (incoming) and any orchestrator dispatching subagents against the Dev B plan
**Status:** Kickoff (ready to execute once Pass-3 Dev A PRs are merged to `main`)

---

## Purpose

This document is the handoff from Developer A's Pass-3 closure to Developer B's host + admin workstream. It captures:

1. What state `main` will be in after the Dev A Pass-3 stack merges.
2. Which files and patterns Dev B should reuse (not rewrite).
3. Which files are off-limits (foundation-owned or Dev A-owned) and why.
4. Known open issues / deferred follow-ups that Dev B might hit.
5. The pre-existing plan that Dev B executes against.

Dev B's actual implementation plan is already written:

- `docs/superpowers/plans/2026-04-18-developer-b-host-admin-product.md`

This kickoff does not replace that plan — it wraps it with the context a new agent needs to start cleanly.

---

## Current state of `main` (after Dev A Pass-3 stack merges)

The Dev A stack lands the full participant surface per spec §10.1:

- `/`, `/events`, `/events/:eventId`, `/events/:eventId/apply`, `/questionnaire`, `/dashboard`, `/gathering/:eventId`, `/auth`, `/sign-in`, `/auth/callback`.
- All participant pages use the shared foundation primitives: `PageShell`, `Card`, `Button`, `Link`, `StatusBadge`, `RouteEmptyState`, `RouteErrorState`, `RouteNotFoundState`, `RouteUnavailableState`, `RouteLoadingState`, `RouteGatedState`, `RouteSuccessState`.
- Application lifecycle rendering is unified via `src/features/applications/presentation.ts` (`resolveApplicationPanelContent`) and the `ApplicationStatusPanel` component.
- E2E coverage for participant routes: `e2e/participant-foundation.spec.ts` + `e2e/slice-*.spec.ts`.
- Reusable E2E helper for flipping registration state: `e2e/fixtures/registrations.ts` (`withFlippedRegistrationStatus`).

Dev B inherits a green Playwright suite on `chromium` (**35** passing, 0 skipped — includes foundation-route coverage and SP-B/C/D hygiene). Verify with `npx playwright test --list`. Dev A / Foundation maintenance context: `docs/superpowers/plans/2026-04-21-dev-a-remaining-work-audit-and-plan.md`.

---

## Files Dev B owns (from the Dev B plan)

Per `2026-04-18-developer-b-host-admin-product.md`:

- `src/pages/host/*` — all host pages
- `src/pages/admin/*` — all admin/operator pages
- `src/features/host-events/*` — host contract layer
- `src/features/admin/*` — admin contract layer
- `e2e/host-admin-foundation.spec.ts` — Dev B's dedicated spec file

Nothing else is Dev B's to edit.

---

## Files Dev B MUST NOT modify (frozen / cross-workstream)

These are owned by Foundation or by Dev A. Changing them from the Dev B workstream will almost certainly break the participant surface or re-open closed debt.

**Foundation-owned (any change must go through a foundation ticket):**

- `src/components/shared/*` — especially `RouteState.tsx`, `PageShell.tsx`, `StatusBadge.tsx`.
- `src/components/ui/*` — `Card`, `Button`, `RouterLinkButton`, primitives.
- `src/app/router/*` — `AppRouter.tsx`, `routeManifest.ts`, `guards.tsx`.
- `src/lib/design-tokens.ts`.

**Dev A-owned (participant surface):**

- `src/pages/landing/*`, `src/pages/events/*`, `src/pages/apply/*`, `src/pages/questionnaire/*`, `src/pages/dashboard/*`, `src/pages/gathering/*`, `src/pages/auth/*`.
- `src/features/applications/*` — lifecycle presentation + status helpers.
- `src/features/events/components/EventSummaryCard.tsx`.
- `e2e/participant-foundation.spec.ts`, `e2e/slice-*.spec.ts`.
- `e2e/fixtures/registrations.ts` (shared helper — read-only from Dev B's perspective; extensions OK if additive and reviewed).

If Dev B genuinely needs something changed in a frozen file, open a foundation ticket under `docs/foundation-tickets/` following the existing template, or ping Dev A for a participant-surface change. Do not patch it directly.

---

## Patterns Dev B should reuse

### UI state primitives

Use the shared `RouteState.tsx` components for empty / error / unavailable / loading / not-found / success state cards. Do not roll new inline `Card` blocks for these states — the participant surface has been normalized onto them and Dev B should match.

```tsx
import { RouteEmptyState, RouteErrorState } from '@/components/shared/RouteState';
```

**Note:** `RouteLoadingState` defaults to **Hebrew** title/body (foundation ticket F-1 — done). Prefer `RouteLoadingState` for host/admin loading surfaces; pass explicit `title`/`body` when copy must differ.

### Page shell

All routes go through `<PageShell title subtitle>`. Do not build custom page chromes. See `src/pages/events/EventsPage.tsx` for a canonical reference.

### Application / lifecycle status rendering

If any host or admin surface needs to render an application's status (e.g., a host viewing a participant's application), reuse:

- `src/features/applications/presentation.ts` (`resolveApplicationPanelContent`)
- `src/features/applications/components/ApplicationStatusPanel.tsx`

Do not re-implement status copy. If host-specific copy diverges from participant copy, extend `presentation.ts` with a `viewer: 'host' | 'participant'` parameter rather than forking.

### E2E test helpers

- **Auth:** `e2e/fixtures/auth.ts` — `authenticateAs`. Keep using this.
- **Env:** `e2e/fixtures/env.ts` — `ENV`. Pull all user IDs / emails from here.
- **DB state flipping:** `e2e/fixtures/registrations.ts` — `withFlippedRegistrationStatus`. Use this whenever a test needs to temporarily mutate `event_registrations` and restore it. Do NOT write inline `admin.from(...).update()` + `finally` blocks — this pattern is deprecated across the suite.

### i18n

All user-facing strings (participant, host, admin) are Hebrew. Admin-internal strings (e.g., diagnostics panels that only operators see) may be English where Hebrew would be awkward, but default to Hebrew. When in doubt: Hebrew.

---

## Known open issues Dev B may encounter

### 1. Typecheck (`npm run typecheck`)

Root `package.json` defines `typecheck` as `tsc -b --noEmit`, which respects project references (same intent as `npx tsc -b --noEmit`). Prefer:

```bash
npm run typecheck
```

Either command should exit `0` before you push substantive changes.

### 2. `example.com` email blocklist

`validateEmailAddress` rejects `*@example.com`. When adding fixture users to `e2e/fixtures/env.ts`, use a real-looking address under a domain you control (e.g., `questionnaire.e2e@gmail.com` pattern already in use).

### 3. ~~Foundation F-1 / F-2~~ (resolved on `main`)

F-1 (`RouteLoadingState` Hebrew defaults) and F-2 (manifest `preview` tier for `/questionnaire`) are **done** — see `docs/foundation-tickets/README.md`. Dev B should still add new routes to `routeManifest.ts` via foundation process.

### 4. Questionnaire-workflow tests run via route interception (PR #13)

The two previously skipped questionnaire-workflow tests in `e2e/participant-foundation.spec.ts` were unblocked in PR #13 by stubbing the relevant Supabase REST endpoints (`**/rest/v1/matching_responses**`, `**/rest/v1/profiles**`) via `page.route(...)` rather than provisioning disposable fixture users. If Dev B writes new host/admin E2E tests that need a user in a specific lifecycle state without real DB mutation, mirror that pattern rather than reviving the disposable-user approach.

### 5. Playwright trace artifact flakiness

Occasionally the full suite emits `ENOENT` on a trace artifact during cleanup. Workaround: `rm -rf test-results/` and re-run. Not deterministic. Not caused by test logic.

---

## Recommended Dev B sequencing

The Dev B plan has its own task-by-task structure; follow it as written. The only kickoff-level recommendation is:

1. **Rebase** the Dev B workstream onto `main` AFTER Dev A PRs #1 and #3–#10 (and this kickoff's PR) are merged. Do not start against a pre-Pass-3 base.
2. **Run the suite green** before your first commit: `npx playwright test --project=chromium` should pass at **35/35**. If it doesn't, do not start layering Dev B changes on top.
3. **Open one stacked PR per Dev B task** (mirroring the Dev A cadence). Keep PRs small and reviewable.
4. **Cut a docs-only PR** under `docs/superpowers/plans/` for each task you execute (the same pattern Dev A used across PR #7–#10).

---

## Coordination points with Dev A

These are the places the two workstreams touch:

- **`ApplicationStatusPanel` / `presentation.ts`:** If Dev B needs host-viewer variants, extend rather than fork. Dev A is the owner; coordinate on PR review.
- **`src/features/events/*`:** If Dev B surfaces host-owned event data that overlaps with what `EventSummaryCard` displays to participants, prefer separate host components over shared ones (different audiences, different permissions).
- **Router manifest:** Any new host/admin route must be added to `src/app/router/routeManifest.ts`. That file is foundation-owned; add via a foundation ticket or coordinate with whoever currently owns the manifest.

---

## Done criteria for Dev B's first task

To prove the kickoff is clean, Dev B's first PR should:

- Touch only files listed under "Files Dev B owns".
- Pass `npx tsc -b --noEmit` and `npx playwright test --project=chromium`.
- Use `PageShell` + shared state primitives (or document a conscious divergence).
- Import `withFlippedRegistrationStatus` if the test does any `event_registrations` mutation.

---

## Contact / escalation

If the orchestrator gets stuck on a frozen file or an ambiguous pattern choice:

1. Check this document.
2. Check the Dev B plan doc (`2026-04-18-developer-b-host-admin-product.md`).
3. Check the existing foundation tickets in `docs/foundation-tickets/`.
4. Open a new foundation ticket rather than cross the boundary.

Good luck. The participant surface is in good shape — the host + admin surfaces are the last big lift before Pass-4 (whatever product decides that is).
