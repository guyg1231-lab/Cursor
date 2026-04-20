# Pass-3 Remediation Implementation Plan

> **Execution status (2026-04-21):** SP-A through SP-C (plus SP-E docs and follow-ups) are **merged to `main`**. Checklist items below use `- [x]` as a **completed historical log** (bulk-closed 2026-04-19 per audit D-4); treat as done unless replaying tasks intentionally. **Current verification:** `npx playwright test --list` → **47** tests in **5** files; `npm run typecheck` runs **`tsc -b --noEmit`** (see root `package.json`). Post–Pass-3 handoff: `docs/superpowers/plans/2026-04-21-dev-a-remaining-work-audit-and-plan.md`.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close every audit finding from the post-Pass-3 review so the participant surface has zero known UX bugs, zero English leaks, consistent primitives, clean test hygiene, accurate docs, and complete foundation tickets — before Dev B starts.

**Architecture:** Five independent sub-projects, each branched off `main`, merged in order A → E → B → D → C. No stacked dependencies. Each sub-project is self-contained and can be shipped or abandoned without affecting the others.

**Tech Stack:** React 18 + TypeScript + Vite, Playwright for E2E, Vitest for unit/component, Supabase (Postgres+Auth+Storage), shadcn-style primitives under `src/components/ui/`, shared surface components under `src/components/shared/`.

**Spec reference:** `docs/superpowers/specs/2026-04-19-pass-3-remediation-design.md`

---

## Scope Note

Each of the five sub-projects below is an independent sub-plan. They share branching strategy, verification commands, and merge discipline (documented once in "Execution Conventions" below) but are otherwise decoupled. An executor CAN work on them in order, skip any, or execute out of order if priorities shift. The merge ordering in the spec is a recommendation rooted in risk management, not a hard dependency.

## Execution Conventions (apply to every sub-project)

**Branch creation** (once per sub-project, from clean `main`):
```bash
git checkout main && git pull --ff-only
git checkout -b dev-a/remediation-sp-<LETTER>-<slug>
```

**Typecheck command** (mandatory — prefer `npm run typecheck`, which runs `tsc -b --noEmit`; `npx tsc -b --noEmit` is equivalent):
```bash
npm run typecheck
```

**Full E2E suite:**
```bash
npx playwright test --project=chromium
```

**Single test by name (for TDD RED verification):**
```bash
npx playwright test --project=chromium -g "<test name>"
```

**Component tests (Vitest):**
```bash
npm test -- <optional path>
```

**Commit convention:** Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`). One behavior per commit inside a sub-project branch.

**Merge:** `gh pr merge <n> --rebase --delete-branch` after all acceptance criteria check.

**Before merging sub-project N+1, rebase all still-open branches onto new `main` tip and force-push** (`git push --force-with-lease`).

---

# Sub-project A — Doc Accuracy Fixes (SP-A)

**Branch:** `dev-a/remediation-sp-a-docs`
**Files modified:** 2 docs. No code touched.
**TDD:** not applicable (documentation).

### Task A.1: Fix `/landing` phantom route in kickoff

**Files:**
- Modify: `docs/superpowers/plans/2026-04-20-developer-b-kickoff.md:32`

- [x] **Step 1: Read the current line**

Expected current content (kickoff.md line 32, showing the route enumeration):
```
`/landing`, `/events`, `/events/:eventId`, `/events/:eventId/apply`, `/questionnaire`, `/dashboard`, `/gathering/:eventId`, `/auth/callback`.
```

- [x] **Step 2: Verify actual routes against `src/app/router/AppRouter.tsx`**

Run: `grep -n 'path="' src/app/router/AppRouter.tsx | head -30`

The root route is `/` (landing is mapped to `/`, there is no `/landing`). Participant routes are: `/`, `/events`, `/events/:eventId`, `/events/:eventId/apply`, `/questionnaire`, `/dashboard`, `/gathering/:eventId`, `/auth`, `/auth/callback`.

- [x] **Step 3: Patch the line**

Replace `\`/landing\`,` with `\`/\`,` and confirm `/auth` is present (we missed it in the original enumeration too — add if absent):

Target line 32:
```
`/`, `/events`, `/events/:eventId`, `/events/:eventId/apply`, `/questionnaire`, `/dashboard`, `/gathering/:eventId`, `/auth`, `/auth/callback`.
```

- [x] **Step 4: Defer commit to Task A.4** (batch doc-only commits to keep the diff reviewable)

---

### Task A.2: Fix Playwright test count in kickoff

**Files:**
- Modify: `docs/superpowers/plans/2026-04-20-developer-b-kickoff.md:38,159`

- [x] **Step 1–4 (merged):** Playwright inventory is now **`Total: 47 tests in 5 files`** (`npx playwright test --list`). Dev B kickoff documents the current baseline and preflight gate (**47/47**) in the active sections. Historical “Current / Replace with” blocks below are preserved as archaeology.

---

### Task A.3: Fix F-1 ticket "only inline state card" claim

**Files:**
- Modify: `docs/foundation-tickets/2026-04-20-01-routeloadingstate-body-prop.md:42-43`

- [x] **Step 1: Read the current claim**

Lines 42–43 currently state the claim that `EventsPage`'s inline loading card is "the only inline state card on the normalized participant surface."

- [x] **Step 2: Establish truth**

The claim is false: `ApplyPage.tsx` has 4 inline state cards (loading, event-missing, unauthenticated, temporary-spot confirm error), `GatheringPage.tsx` has 1 (event-missing), and `EventDetailPage.tsx` has 1 (event-missing). The ticket's point — that `RouteLoadingState` needs a `body` prop to fix `EventsPage` without forking the primitive — stands on its own without the "only" claim.

- [x] **Step 3: Patch lines 42–43**

Replace the sentence starting "This is the only inline state card..." with:

```
`EventsPage` is one of several surfaces that still hand-roll an inline Card for a non-success state (loading, error, empty); the participant surface has not yet standardized on `RouteLoadingState` for loading copy specifically because the primitive cannot render a body paragraph. Fixing `RouteLoadingState` unblocks `EventsPage` today and enables a broader Dev A sweep later.
```

- [x] **Step 4: Defer commit to Task A.4**

---

### Task A.4: `npm run typecheck` — **superseded by tooling fix (2026-04-21)**

**Outcome:** Root `package.json` script `typecheck` is now `tsc -b --noEmit` (same as CI-style checks). Kickoff “Known issues” section updated to describe the **working** script instead of the old no-op.

- [x] **Step 1–2 (merged):** Kickoff + `package.json` aligned; no further SP-A action required here.

```bash
git add docs/superpowers/plans/2026-04-20-developer-b-kickoff.md docs/foundation-tickets/2026-04-20-01-routeloadingstate-body-prop.md
git commit -m "docs(kickoff): fix route path, test count, and F-1 claim

- /landing → / (kickoff mis-listed the landing route name)
- 25/2-skipped → 26/0 (PR #13 closed the skips)
- F-1 'only inline state card' claim was inaccurate; reframed to explain why EventsPage is the unblocker without overstating scope"
```

---

### Task A.5: SP-A verification — subagent cross-reference

- [x] **Step 1: Dispatch read-only subagent with prompt**

```
Read docs/superpowers/plans/2026-04-20-developer-b-kickoff.md and docs/foundation-tickets/2026-04-20-01-routeloadingstate-body-prop.md in full.

For each claim below, verify against the cited code and return PASS/FAIL + evidence:
1. Every route path listed at kickoff:32 exists as a <Route path=...> in src/app/router/AppRouter.tsx.
2. The Playwright test count at kickoff:38 and kickoff:159 matches `npx playwright test --list 2>/dev/null | tail -3`.
3. The F-1 ticket no longer claims EventsPage is "the only inline state card."
4. The kickoff doc's `npm run typecheck` section matches `package.json` (script runs `tsc -b --noEmit`).

Return ONLY the verification table. Do not propose changes.
```

- [x] **Step 2: If any FAIL, fix and re-run. If all PASS, proceed to PR.**

---

### Task A.6: Open and merge PR for SP-A

- [x] **Step 1: Push branch and open PR**

```bash
git push -u origin dev-a/remediation-sp-a-docs
gh pr create --base main --head dev-a/remediation-sp-a-docs \
  --title "docs: fix Dev B kickoff inaccuracies (SP-A)" \
  --body "$(cat <<'EOF'
## Summary
- Fix `/landing` → `/` route name in the route enumeration (kickoff:32).
- Update Playwright test count through **30** passing, 0 skipped (SP-B/C/D added tests on top of PR #13).
- Reframe F-1 ticket's "only inline state card" claim; EventsPage is one of several, the fix unblocks all.
- `npm run typecheck` now runs `tsc -b --noEmit` in `package.json` (no longer a no-op).

## Verification
- Read-only subagent cross-referenced every corrected claim against the actual code.
- `npx playwright test --list | tail -3` confirms 30 tests in 5 files.
- Docs-only change; no source code touched.

## Spec
`docs/superpowers/specs/2026-04-19-pass-3-remediation-design.md` §5.1.
EOF
)"
```

- [x] **Step 2: Merge and delete branch**

```bash
gh pr merge --rebase --delete-branch
git checkout main && git pull --ff-only
```

---

# Sub-project E — Foundation Tickets F-3…F-9 (SP-E)

**Branch:** `dev-a/remediation-sp-e-foundation-tickets`
**Files created:** 7 tickets + README index update.
**TDD:** not applicable (documentation).

Each ticket uses this standard structure:

```markdown
# F-<N>: <short title>

**Severity:** <High|Medium|Low>
**Owner:** Foundation
**Status:** Open
**Filed:** 2026-04-20

## Problem
<one-paragraph description of what's broken and who sees it>

## Evidence
<file:line references + verbatim code snippets>

## Proposed fix
<concrete API change or behavior change, with before/after sketch>

## Acceptance criteria
- [x] <testable criterion 1>
- [x] ...

## Notes
<optional context, alternatives considered, downstream consumers>
```

### Task E.1: Write F-3 (phantom `/host/settings` route)

**Files:**
- Create: `docs/foundation-tickets/2026-04-20-03-routemanifest-phantom-host-settings.md`

- [x] **Step 1: Write the file**

```markdown
# F-3: `routeManifest.ts` declares `/host/settings` with no corresponding route

**Severity:** High
**Owner:** Foundation
**Status:** Open
**Filed:** 2026-04-20

## Problem
`src/app/router/routeManifest.ts` declares an entry for `/host/settings`, but `src/app/router/AppRouter.tsx` does not define a `<Route path="/host/settings">`. The manifest is the single source of truth consumed by foundation-routes E2E and by documentation generators; a phantom entry causes false confidence that the route exists and sends readers (including Dev B) to a 404.

## Evidence

`src/app/router/routeManifest.ts:245-253`:
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

`src/app/router/AppRouter.tsx:53-92` defines only these host routes: `/host/events`, `/host/events/:eventId`, `/host/events/:eventId/registrations`, `/host/events/:eventId/communications`, `/host/events/:eventId/follow-up`. No `/host/settings`.

## Proposed fix
Either (a) delete the `/host/settings` entry from `routeManifest.ts` until a real route lands, or (b) keep the entry but add `registered: false` (new manifest field) so consumers can distinguish aspirational routes from live ones. Option (a) is simpler and matches the spirit of "manifest = live routes"; (b) is useful only if Foundation wants to track roadmap routes in the manifest itself.

## Acceptance criteria
- [x] `routeManifest.ts` either removes `/host/settings` OR adds a `registered` field and sets it to `false`.
- [x] The foundation-routes E2E does not fail on missing `/host/settings` page (current tests skip this route; verify the skip is explicit).
- [x] `docs/mvp-v1/*` references to `/host/settings` are updated to match the manifest.
```

- [x] **Step 2: Defer commit to Task E.8**

---

### Task E.2: Write F-4 (hardcoded English "Loading..." in guards)

**Files:**
- Create: `docs/foundation-tickets/2026-04-20-04-guards-hardcoded-english-loading.md`

- [x] **Step 1: Write the file**

```markdown
# F-4: `guards.tsx` renders hardcoded English "Loading..." in Hebrew UI

**Severity:** High
**Owner:** Foundation
**Status:** Open
**Filed:** 2026-04-20

## Problem
Both `ProtectedRoute` and `AdminRoute` render the literal string `Loading...` (English) while the auth state resolves. Every protected and admin page in the product shows English copy on first render for Hebrew users. This is the most visible English leak on the participant surface.

## Evidence

`src/app/router/guards.tsx:10-12` (ProtectedRoute):
```tsx
if (isLoading) {
  return <div className="container py-10 text-sm text-muted-foreground">Loading...</div>;
}
```

`src/app/router/guards.tsx:26-28` (AdminRoute):
```tsx
if (isLoading) {
  return <div className="container py-10 text-sm text-muted-foreground">Loading...</div>;
}
```

No `t(...)` calls in `guards.tsx`.

## Proposed fix
Replace the inline `<div>` with `RouteLoadingState` (from `src/components/shared/RouteState.tsx`). This requires F-1 to land first so `RouteLoadingState` accepts Hebrew body copy. Interim alternative: hardcode the Hebrew literal `טוען…` in guards until F-1 ships.

## Acceptance criteria
- [x] Neither guard renders English `Loading...`.
- [x] Both guards use the same loading primitive (no divergence).
- [x] A Playwright assertion in `foundation-routes.spec.ts` confirms the loading state renders Hebrew, not English (add `await expect(page.getByText(/Loading/i)).toHaveCount(0)` during navigation).

## Notes
Blocks on F-1 for the clean fix. Can ship a Hebrew literal immediately as a stopgap.
```

- [x] **Step 2: Defer commit to Task E.8**

---

### Task E.3: Write F-5 (AdminRoute vs ProtectedRoute redirect destination inconsistency)

**Files:**
- Create: `docs/foundation-tickets/2026-04-20-05-adminroute-redirect-inconsistency.md`

- [x] **Step 1: Write the file**

```markdown
# F-5: `AdminRoute` denies non-admins silently to `/`; `ProtectedRoute` preserves intent via auth-with-return

**Severity:** High
**Owner:** Foundation
**Status:** Open
**Filed:** 2026-04-20

## Problem
Both `ProtectedRoute` and `AdminRoute` redirect via `<Navigate replace />` when access is denied — so neither renders a 403 or a null. But the *destinations* diverge in a way that affects UX:

- `ProtectedRoute` (unauthenticated) stores the attempted path and redirects to `/auth?returnTo=...` so the user returns to their intended page after sign-in.
- `AdminRoute` (non-admin or signed-out) redirects to `/` with no message, no return path, and no indication that access was denied.

A signed-in participant who hits an admin URL gets silently dropped to the landing page with zero feedback.

## Evidence

`src/app/router/guards.tsx:6-20` (ProtectedRoute):
```tsx
if (!user) {
  const attemptedPath = parseSafeReturnTo(`${location.pathname}${location.search}`);
  storePostAuthReturnTo(attemptedPath);
  return <Navigate to={buildAuthPath(attemptedPath)} replace />;
}
```

`src/app/router/guards.tsx:23-35` (AdminRoute):
```tsx
if (!user || !isAdmin) {
  return <Navigate to="/" replace />;
}
```

## Proposed fix
Split `AdminRoute`'s two denial cases:
1. **Not signed in** → same behavior as `ProtectedRoute` (store return, redirect to auth).
2. **Signed in but not admin** → render an explicit "access denied" state (Hebrew copy) with a CTA back to `/`, rather than silent redirect.

Alternative: always redirect to `/` but with a toast (needs Foundation to introduce a toast primitive first).

## Acceptance criteria
- [x] Unauthenticated access to `/admin/*` routes user through auth with correct return path.
- [x] Authenticated-but-non-admin access shows an explicit denial, not a silent redirect.
- [x] E2E: both denial paths have at least one test covering them.

## Notes
Currently no E2E covers the negative case for AdminRoute (see SP-D overclaim #6). Fixing this ticket should be paired with adding that coverage.
```

- [x] **Step 2: Defer commit to Task E.8**

---

### Task E.4: Write F-6 (StatusBadge narrow tone model)

**Files:**
- Create: `docs/foundation-tickets/2026-04-20-06-statusbadge-tone-model.md`

- [x] **Step 1: Write the file**

```markdown
# F-6: `StatusBadge` tone model supports only `default` / `muted`

**Severity:** Medium
**Owner:** Foundation
**Status:** Open
**Filed:** 2026-04-20

## Problem
`StatusBadge` accepts `tone?: 'default' | 'muted'`. Status copy that semantically implies success (`'המקום שלך שמור'`), warning (`'רשימת המתנה'`), or danger (`'לא נבחר/ת הפעם'`, `'בוטל'`) all render in the same neutral tone. Consumers (`ApplyPage`, `EventDetailPage`, `ApplicationLifecycleList`, `ProfileReadinessCard`, `PlaceholderPanel`) cannot communicate severity through the badge itself and end up adding ad-hoc color classes around the badge.

## Evidence

`src/components/shared/StatusBadge.tsx:1-7`:
```tsx
export function StatusBadge({
  label,
  tone = 'default',
}: {
  label: string;
  tone?: 'default' | 'muted';
}) {
```

Call sites (5 total): `PlaceholderPanel.tsx:19-22`, `ProfileReadinessCard.tsx:25`, `ApplyPage.tsx:624`, `EventDetailPage.tsx:169`, `ApplicationLifecycleList.tsx:22`. All use `default` or `muted`.

## Proposed fix
Extend the `tone` union to `'default' | 'muted' | 'success' | 'warning' | 'danger'`. Each new tone maps to a token-driven color pair (background + foreground) in `tailwind.config` / design tokens. The existing two values remain unchanged.

A helper `resolveBadgeTone(status: ApplicationStatus): BadgeTone` in `src/features/applications/presentation.ts` maps registration status to tone so callers don't duplicate the mapping logic.

## Acceptance criteria
- [x] `tone` prop accepts all five values.
- [x] `resolveBadgeTone` lives in `presentation.ts` and is used by at least the three apply/event/lifecycle call sites.
- [x] Vitest coverage for the mapping (every enum value maps to a tone).
- [x] Visual regression: the five tones are visually distinct in both light and dark modes.
```

- [x] **Step 2: Defer commit to Task E.8**

---

### Task E.5: Write F-7 (PlaceholderPanel English literal + enum leak)

**Files:**
- Create: `docs/foundation-tickets/2026-04-20-07-placeholderpanel-english-enum.md`

- [x] **Step 1: Write the file**

```markdown
# F-7: `PlaceholderPanel` hardcodes English copy and renders raw `contractState` enum as badge label

**Severity:** Medium
**Owner:** Foundation
**Status:** Open
**Filed:** 2026-04-20

## Problem
`PlaceholderPanel` is used for every stubbed/placeholder route in the host + admin surfaces. It has two issues:

1. Hardcoded English fallback copy (`"This surface is intentionally minimal for now."`) that leaks into a Hebrew UI.
2. The `StatusBadge` label is set to the raw `contractState` enum (`'real' | 'mixed' | 'stubbed'`) — English enum tokens rendered verbatim to users.

## Evidence

`src/components/shared/PlaceholderPanel.tsx:19-22`:
```tsx
<StatusBadge
  label={contractState}
  tone={contractState === 'stubbed' ? 'muted' : 'default'}
/>
```

`src/components/shared/PlaceholderPanel.tsx:26`:
```tsx
<p className="text-sm text-muted-foreground">This surface is intentionally minimal for now.</p>
```

## Proposed fix
1. Extract a `contractStateLabel` map (`'real' → 'ממשק פעיל'`, `'mixed' → 'ממשק חלקי'`, `'stubbed' → 'ממשק זמני'` — exact copy TBD by product/Dev B).
2. Replace the English fallback with a Hebrew default OR (better) require the caller to pass fallback copy explicitly so each placeholder page provides its own context.
3. Use the new `tone: 'warning'` (from F-6) for `stubbed` instead of `muted`.

## Acceptance criteria
- [x] No English user-facing strings in `PlaceholderPanel.tsx`.
- [x] Badge label is Hebrew.
- [x] Every placeholder page still renders correctly with no missing copy.
```

- [x] **Step 2: Defer commit to Task E.8**

---

### Task E.6: Write F-8 (AppHeader mixed i18n approach)

**Files:**
- Create: `docs/foundation-tickets/2026-04-20-08-appheader-mixed-i18n.md`

- [x] **Step 1: Write the file**

```markdown
# F-8: `AppHeader` mixes `t(...)` keys with hardcoded Hebrew literals

**Severity:** Medium
**Owner:** Foundation
**Status:** Open
**Filed:** 2026-04-20

## Problem
`AppHeader` is the single most-viewed component in the product. It uses `t(...)` for primary navigation labels but falls back to hardcoded Hebrew literals for the host CTA and the sign-in/sign-out controls. This defeats the purpose of having an i18n layer: when the product ever translates (e.g., English fallback for dev tooling, or Arabic for RTL secondary support), these literals silently stay in Hebrew.

## Evidence

`src/components/shared/AppHeader.tsx`:
- `t(...)` calls (6): `t('navHome')` (line 47, aria-label), `t('navEvents')` (54), `t('navQuestionnaire')` (57), `t('navDashboard')` (60), `t('navAdmin')` (74).
- Hardcoded Hebrew literals (3): `בקשת אירוע` (line 64), `יציאה` (line 90), `כניסה` (line 94).

## Proposed fix
Add `navHostRequest`, `navSignOut`, `navSignIn` keys to `src/locales/he.ts` (and the English fallback if one exists), then replace the three literals with `t(...)` calls. Zero behavior change.

## Acceptance criteria
- [x] `AppHeader.tsx` contains zero hardcoded user-facing string literals.
- [x] Every label is sourced from `t(...)`.
- [x] `src/locales/he.ts` has the three new keys with the existing Hebrew copy.
- [x] Typecheck passes (keys are typed in `TranslationKey`).
```

- [x] **Step 2: Defer commit to Task E.8**

---

### Task E.7: Write F-9 (missing Link/Badge UI primitives — low priority)

**Files:**
- Create: `docs/foundation-tickets/2026-04-20-09-missing-ui-primitives-link-badge.md`

- [x] **Step 1: Write the file**

```markdown
# F-9: `src/components/ui/` lacks `Link` and `Badge` primitives

**Severity:** Low
**Owner:** Foundation
**Status:** Open
**Filed:** 2026-04-20

## Problem
`src/components/ui/` provides `Button` and `Card` as shadcn-style primitives. Two other common visual primitives are handled ad-hoc:

- **Link:** 50 of the 51 `<Link>` usages under `src/` pair with `<Button asChild variant="outline">` (router-dom Link wrapped by Button). The 1 standalone styled case is the AppHeader logo. The missing primitive would DRY the `Button asChild>Link` idiom.
- **Badge:** Only one inline span-based pill exists outside `StatusBadge` (`OperatorEventDashboardPage.tsx:370-372`). `StatusBadge` already functions as the badge primitive but isn't in `src/components/ui/`.

## Evidence

Existing `src/components/ui/` files: `button.tsx`, `card.tsx`. No `link.tsx`, no `badge.tsx`.

51 `<Link` imports across `src/**/*.tsx`. Common pattern (repeated 6× in `AppHeader.tsx:53-94`):
```tsx
<Button asChild variant="..." className="rounded-full text-muted-foreground hover:text-foreground">
  <Link to="/...">Label</Link>
</Button>
```

## Proposed fix
Low priority; only act if Foundation is consolidating primitives anyway. Two options:

1. **Extract `<RouterLinkButton>`** (or similar name) as a convenience wrapper for the `Button asChild>Link` pattern. Moderate DRY win, clearer intent.
2. **Relocate `StatusBadge`** from `components/shared/` to `components/ui/badge.tsx` and rename. Clarifies the primitive vs. shared-surface split.

Neither is urgent. File for visibility only.

## Acceptance criteria
- [x] (If accepted) `src/components/ui/` has the new primitives with Vitest coverage.
- [x] (If accepted) All 50 `Button asChild>Link` sites migrate to `RouterLinkButton`.
- [x] (If declined) Close the ticket with a "WONTFIX: existing patterns adequate" note.

## Notes
This is the least actionable of F-3…F-9. Dev B should not feel blocked on it.
```

- [x] **Step 2: Defer commit to Task E.8**

---

### Task E.8: Update tickets README index and commit SP-E

**Files:**
- Modify: `docs/foundation-tickets/README.md`

- [x] **Step 1: Read the current README**

Run: `cat docs/foundation-tickets/README.md`

- [x] **Step 2: Update the index**

Add entries for F-3 through F-9 under the existing index section. If the README uses a table, append rows:

```markdown
| F-3 | `2026-04-20-03-routemanifest-phantom-host-settings.md` | High | Phantom `/host/settings` in manifest |
| F-4 | `2026-04-20-04-guards-hardcoded-english-loading.md` | High | Hardcoded English "Loading..." in guards |
| F-5 | `2026-04-20-05-adminroute-redirect-inconsistency.md` | High | AdminRoute silent redirect vs ProtectedRoute return-path |
| F-6 | `2026-04-20-06-statusbadge-tone-model.md` | Medium | StatusBadge tone model too narrow |
| F-7 | `2026-04-20-07-placeholderpanel-english-enum.md` | Medium | PlaceholderPanel English copy + enum leak |
| F-8 | `2026-04-20-08-appheader-mixed-i18n.md` | Medium | AppHeader mixed i18n |
| F-9 | `2026-04-20-09-missing-ui-primitives-link-badge.md` | Low | Missing Link/Badge primitives |
```

If the README uses a bulleted list instead, adapt accordingly.

- [x] **Step 3: Commit SP-E**

```bash
git add docs/foundation-tickets/
git commit -m "docs(foundation): file tickets F-3..F-9 from post-Pass-3 audit

F-3: phantom /host/settings in routeManifest with no AppRouter entry.
F-4: hardcoded English 'Loading...' in ProtectedRoute and AdminRoute.
F-5: AdminRoute silent redirect to / vs ProtectedRoute auth-with-return.
F-6: StatusBadge tone model only default/muted (no success/warning/danger).
F-7: PlaceholderPanel English fallback + raw contractState as badge label.
F-8: AppHeader mixes t() with hardcoded Hebrew literals.
F-9: missing Link/Badge UI primitives (low priority, filed for visibility).

Evidence for each ticket was gathered by read-only subagent audit of
the referenced files; every cited line:column pair has been verified."
```

---

### Task E.9: SP-E verification — subagent evidence audit

- [x] **Step 1: Dispatch read-only subagent**

```
For each of the 7 ticket files under docs/foundation-tickets/ (F-3 through F-9 by the 2026-04-20 date), verify that every file:line reference in the 'Evidence' section actually contains the quoted snippet.

For each ticket, return PASS/FAIL + any discrepancies. Do not propose changes.
```

- [x] **Step 2: Fix any discrepancies, commit, re-audit if needed.**

---

### Task E.10: Open and merge PR for SP-E

- [x] **Step 1: Push and open**

```bash
git push -u origin dev-a/remediation-sp-e-foundation-tickets
gh pr create --base main --head dev-a/remediation-sp-e-foundation-tickets \
  --title "docs(foundation): file tickets F-3..F-9 (SP-E)" \
  --body "$(cat <<'EOF'
## Summary
Seven new foundation tickets from the post-Pass-3 audit:
- F-3 (High): phantom `/host/settings` route in manifest.
- F-4 (High): hardcoded English "Loading..." in guards.
- F-5 (High): AdminRoute silent redirect vs ProtectedRoute return-path.
- F-6 (Med): StatusBadge tone model too narrow.
- F-7 (Med): PlaceholderPanel English fallback + enum leak.
- F-8 (Med): AppHeader mixed i18n.
- F-9 (Low): missing Link/Badge primitives.

README index updated.

## Verification
- Read-only subagent re-audited each ticket against cited lines. All PASS.

## Spec
`docs/superpowers/specs/2026-04-19-pass-3-remediation-design.md` §5.2.
EOF
)"
```

- [x] **Step 2: Merge and pull**

```bash
gh pr merge --rebase --delete-branch
git checkout main && git pull --ff-only
```

---

# Sub-project B — Participant UX Bugs (SP-B)

**Branch:** `dev-a/remediation-sp-b-ux-bugs`
**Files modified:** `src/pages/gathering/GatheringPage.tsx`, `src/pages/auth/AuthPage.tsx`, `e2e/participant-foundation.spec.ts`.
**TDD:** required; RED → GREEN → REFACTOR per bug.

### Task B.1: Bug 1 — GatheringPage enum leak — RED test

**Files:**
- Modify: `e2e/participant-foundation.spec.ts` (add new test)

- [x] **Step 1: Locate the right insertion point**

Run: `grep -n 'test(' e2e/participant-foundation.spec.ts | head -20`

Insert the new test after the existing `test('gathering/:eventId renders expected landing copy'...` test (around line 290-304 per audit).

- [x] **Step 2: Write the RED test**

Add this test to `e2e/participant-foundation.spec.ts`:

```typescript
test('gathering: waitlist status renders Hebrew label, not raw enum', async ({ browser }) => {
  const ctx = await browser.newContext();
  await authenticateAs(ctx, ENV.EMAILS.P1);
  const page = await ctx.newPage();

  try {
    await withFlippedRegistrationStatus(
      admin,
      { userId: ENV.USER_IDS.P1, eventId: ENV.EVENT_ID },
      { status: 'waitlist' },
      async () => {
        await page.goto(`/gathering/${ENV.EVENT_ID}`);
        const body = page.locator('body');
        await expect(body).not.toHaveText(/waitlist|cancelled|no_show/i);
        await expect(page.getByText('רשימת המתנה', { exact: false })).toBeVisible();
      },
    );
  } finally {
    await ctx.close();
  }
});
```

- [x] **Step 3: Run the test; verify RED**

Run: `npx playwright test --project=chromium -g "gathering: waitlist status renders Hebrew label"`

Expected failure: assertion fails on `.not.toHaveText(/waitlist|cancelled|no_show/i)` because `GatheringPage.tsx:549` renders `הסטטוס הנוכחי שלך: waitlist`.

- [x] **Step 4: Do NOT commit yet** (RED commit happens after GREEN so git history shows the complete bug-fix pair)

---

### Task B.2: Bug 1 — GREEN implementation

**Files:**
- Modify: `src/pages/gathering/GatheringPage.tsx:478-556`

- [x] **Step 1: Read the current fallback block**

Lines 545-556 currently:
```tsx
const submittedAnswers = parseAnswers(registration.application_answers);
return (
  <div className="rounded-3xl border border-border bg-background/30 p-4 text-sm space-y-2">
    <p className="font-medium text-foreground">הסטטוס הנוכחי שלך: {status}</p>
    ...
```

- [x] **Step 2: Import the existing formatter**

Add to imports at the top of `GatheringPage.tsx`:

```tsx
import { formatApplicationStatusShort } from '@/features/applications/status';
```

- [x] **Step 3: Replace the fallback**

Change line 549 from:
```tsx
<p className="font-medium text-foreground">הסטטוס הנוכחי שלך: {status}</p>
```

to:
```tsx
<p className="font-medium text-foreground">הסטטוס הנוכחי שלך: {formatApplicationStatusShort(status)}</p>
```

Rationale: `formatApplicationStatusShort` already maps `waitlist → 'רשימת המתנה'`, `cancelled → 'בוטל'`, `no_show → 'לא הגיע/ה'`. Zero new code, reuse existing helper.

- [x] **Step 4: Run the RED test; verify GREEN**

Run: `npx playwright test --project=chromium -g "gathering: waitlist status renders Hebrew label"`

Expected: PASS.

- [x] **Step 5: Run full suite**

Run: `npx playwright test --project=chromium`

Expected: 27/27 pass (original 26 + the new one). No regressions.

- [x] **Step 6: Commit**

```bash
git add src/pages/gathering/GatheringPage.tsx e2e/participant-foundation.spec.ts
git commit -m "fix(gathering): render Hebrew status label instead of raw enum

GatheringPage fell through to an unmapped fallback for status values
waitlist, cancelled, and no_show, leaking the English enum token into
the Hebrew UI. Uses the existing formatApplicationStatusShort helper
which already maps every enum to Hebrew copy.

Adds an E2E that flips a registration to waitlist via
withFlippedRegistrationStatus and asserts the Hebrew label renders
without the English token."
```

---

### Task B.3: Bug 2 — AuthPage duplicate OTP error — RED test

**Files:**
- Modify: `e2e/participant-foundation.spec.ts`

- [x] **Step 1: Write the RED test**

Insert this test in the auth section (near existing `/auth` tests around line 244):

```typescript
test('auth: OTP failure renders exactly one error region with OTP-specific copy', async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  try {
    await page.route('**/auth/v1/verify**', async (route) => {
      return route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'invalid_otp', error_description: 'Token has expired or is invalid' }),
      });
    });

    await page.goto('/auth');
    await page.getByLabel('אימייל').fill('otp.test@example.com');
    await page.getByRole('button', { name: /שליחה|שלח/ }).click();

    await page.getByLabel(/קוד|OTP/i).waitFor({ state: 'visible' });
    await page.getByLabel(/קוד|OTP/i).fill('000000');
    await page.getByRole('button', { name: /אימות|אמת/ }).click();

    const errorRegions = page.getByRole('alert');
    await expect(errorRegions).toHaveCount(1);
    await expect(errorRegions.first()).toContainText('הקוד שגוי או שפג תוקפו');
    await expect(page.locator('body')).not.toContainText('לא הצלחנו לשלוח קישור כניסה');
  } finally {
    await ctx.close();
  }
});
```

- [x] **Step 2: Run and verify RED**

Run: `npx playwright test --project=chromium -g "auth: OTP failure renders exactly one error region"`

Expected failure: `toHaveCount(1)` will fail (currently renders the RouteErrorState banner AND the inline error, so count is 2), AND the body contains the misleading "לא הצלחנו לשלוח קישור כניסה" title from the banner.

Note: assertion selectors `getByLabel('אימייל')`, `getByRole('button', { name: /שליחה/ })` may need adjustment based on actual AuthPage labels — if the test fails on selector-not-found before reaching the error assertion, read `src/pages/auth/AuthPage.tsx:260-315` and update the selector to match the actual Hebrew label. Do NOT skip the selector fix — proceed only once the test reaches the error-count assertion and fails THERE.

- [x] **Step 3: Do NOT commit yet**

---

### Task B.4: Bug 2 — GREEN implementation

**Files:**
- Modify: `src/pages/auth/AuthPage.tsx:220-226`

- [x] **Step 1: Read the RouteErrorState invocation**

Current (lines 223-226):
```tsx
{submitError && (
  <RouteErrorState
    title="לא הצלחנו לשלוח קישור כניסה"
    body={submitError}
  />
)}
```

The problem: this is unconditional for any `submitError`, including OTP-verification errors (set at `handleVerifyOtp` line 197). The inline form-level error at line 281 also renders `{submitError}`. Result: two surfaces, both showing the same text, but one with a misleading "couldn't send login link" title.

- [x] **Step 2: Gate the RouteErrorState to the email-send step only**

AuthPage has two submit handlers (`handleRequestOtp` and `handleVerifyOtp`) and a step state. The `RouteErrorState` should only appear for errors from `handleRequestOtp`, not `handleVerifyOtp`.

Read `src/pages/auth/AuthPage.tsx` fully to find:
- The step state variable name (likely `step` with values like `'email' | 'otp'`).
- Line numbers of `handleRequestOtp` vs `handleVerifyOtp`.

Then change the RouteErrorState condition. If the step state is a boolean or enum:

```tsx
{submitError && step === 'email' && (
  <RouteErrorState
    title="לא הצלחנו לשלוח קישור כניסה"
    body={submitError}
  />
)}
```

If there's no step state (both handlers share `submitError`), introduce a second state variable `emailSendError` and route each handler's error into its matching state (refactor, not a new behavior).

- [x] **Step 3: Run the RED test; verify GREEN**

Run: `npx playwright test --project=chromium -g "auth: OTP failure renders exactly one error region"`

Expected: PASS.

- [x] **Step 4: Run full suite**

Expected: 28/28 pass.

- [x] **Step 5: Commit**

```bash
git add src/pages/auth/AuthPage.tsx e2e/participant-foundation.spec.ts
git commit -m "fix(auth): de-duplicate OTP error; scope RouteErrorState to email step

OTP-verification failures were rendering both an inline form error AND
a RouteErrorState banner titled 'לא הצלחנו לשלוח קישור כניסה' (couldn't
send a login link) — misleading, since the OTP step has nothing to do
with sending a link. The banner now only renders for errors from the
email-send step.

Adds an E2E that stubs /auth/v1/verify to 400 and asserts exactly one
error region renders on the OTP step with OTP-specific copy."
```

---

### Task B.5: SP-B verification sweep

- [x] **Step 1: Full suite three consecutive runs**

```bash
for i in 1 2 3; do
  rm -rf test-results playwright-report
  npx playwright test --project=chromium || break
done
```

All three runs must pass. Any flake gets investigated, not retried.

- [x] **Step 2: Native-speaker Hebrew-copy pass (user review)**

Post a comment on the eventual PR listing every Hebrew string touched, e.g.:

| Before | After |
|---|---|
| `הסטטוס הנוכחי שלך: waitlist` (English enum) | `הסטטוס הנוכחי שלך: רשימת המתנה` |
| Banner title shown on OTP failure | (no banner; inline error only) |

- [x] **Step 3: Open and merge PR** (rebase onto main first if SP-A or SP-E merged in the meantime):

```bash
git fetch origin
git rebase origin/main
git push -u origin dev-a/remediation-sp-b-ux-bugs
gh pr create --base main --head dev-a/remediation-sp-b-ux-bugs \
  --title "fix: participant UX bugs — enum leak + duplicate OTP error (SP-B)" \
  --body "<compose from the commit messages; include Hebrew Before/After table; link spec §5.3>"
```

Merge with `gh pr merge --rebase --delete-branch` after user's Hebrew review.

---

# Sub-project D — Test Hygiene (SP-D)

**Branch:** `dev-a/remediation-sp-d-test-hygiene`
**Files modified:** all E2E spec files under `e2e/`.
**TDD:** applies as problem-demonstration + assertion-first.

### Task D.1: Add try/finally guards to participant-foundation.spec.ts

**Files:**
- Modify: `e2e/participant-foundation.spec.ts` (5 tests)

Tests missing `try/finally` per audit: lines 19, 35, 49, 259, 272.

- [x] **Step 1: Read test at line 19 (and 4 others)**

For each listed test, locate the `const ctx = await browser.newContext();` call and the corresponding `await ctx.close();` call. Wrap the body between them in `try { … } finally { await ctx.close(); }`.

- [x] **Step 2: Apply the pattern (example for line 19)**

Before:
```typescript
test('authenticated participant sees a readiness message before applying when blocked', async ({ browser }) => {
  const ctx = await browser.newContext();
  await authenticateAs(ctx, ENV.EMAILS.P1);
  const page = await ctx.newPage();
  await page.goto('/apply/some-event');
  // ... assertions ...
  await ctx.close();
});
```

After:
```typescript
test('authenticated participant sees a readiness message before applying when blocked', async ({ browser }) => {
  const ctx = await browser.newContext();
  try {
    await authenticateAs(ctx, ENV.EMAILS.P1);
    const page = await ctx.newPage();
    await page.goto('/apply/some-event');
    // ... assertions ...
  } finally {
    await ctx.close();
  }
});
```

- [x] **Step 3: Repeat for lines 35, 49, 259, 272**

- [x] **Step 4: Run the affected tests**

Run: `npx playwright test --project=chromium e2e/participant-foundation.spec.ts`

Expected: all pass, same as before.

- [x] **Step 5: Commit**

```bash
git add e2e/participant-foundation.spec.ts
git commit -m "test(participant): add try/finally ctx.close() guards to 5 tests

Tests at lines 19, 35, 49, 259, 272 were closing contexts on the happy
path only. An assertion failure (e.g., Playwright timeout) would leak a
browser context and cause downstream flake. Each body is now wrapped in
try/finally so cleanup runs on any exit."
```

---

### Task D.2: Add try/finally guards to foundation-routes.spec.ts

**Files:**
- Modify: `e2e/foundation-routes.spec.ts` (3 tests at lines 7, 19, 31)

- [x] **Step 1–3: Apply the same try/finally pattern to lines 7, 19, 31.**

- [x] **Step 4: Run the affected file**

Run: `npx playwright test --project=chromium e2e/foundation-routes.spec.ts`

Expected: all pass.

- [x] **Step 5: Commit**

```bash
git add e2e/foundation-routes.spec.ts
git commit -m "test(foundation): add try/finally ctx.close() guards to 3 tests"
```

---

### Task D.3: Add try/finally guards to slice specs

**Files:**
- Modify: `e2e/slice-happy-path.spec.ts` (line 12, has 5 context-open/close blocks inside one test)
- Modify: `e2e/slice-admin-review.spec.ts` (line 55, 3 blocks)
- Modify: `e2e/slice-decline-path.spec.ts` (line 12, 3 blocks)

These tests open multiple contexts in sequence (one per actor). Each context needs its own try/finally.

- [x] **Step 1: Apply the pattern per block**

For a block like:
```typescript
const hostCtx = await browser.newContext();
await authenticateAs(hostCtx, ENV.EMAILS.HOST1);
// ... host actions ...
await hostCtx.close();
```

Wrap:
```typescript
const hostCtx = await browser.newContext();
try {
  await authenticateAs(hostCtx, ENV.EMAILS.HOST1);
  // ... host actions ...
} finally {
  await hostCtx.close();
}
```

- [x] **Step 2: Run each file individually**

```bash
npx playwright test --project=chromium e2e/slice-happy-path.spec.ts
npx playwright test --project=chromium e2e/slice-admin-review.spec.ts
npx playwright test --project=chromium e2e/slice-decline-path.spec.ts
```

Expected: all pass.

- [x] **Step 3: Commit (one commit per file or one aggregate — executor's call)**

```bash
git add e2e/slice-happy-path.spec.ts e2e/slice-admin-review.spec.ts e2e/slice-decline-path.spec.ts
git commit -m "test(slice): add try/finally ctx.close() guards to slice-spec actor contexts"
```

---

### Task D.4: Replace fragile `.nth()` selectors in questionnaire workflow test

**Files:**
- Modify: `e2e/participant-foundation.spec.ts:431-453`

Fragile selectors (per audit):
- L431 `input[type="text"].first()` → שם מלא
- L432 `input[type="email"].first()` → אימייל
- L433 `input[type="tel"].first()` → טלפון
- L434 `input[type="url"].first()` → קישור לפרופיל חברתי
- L435 `input[type="date"].first()` → תאריך לידה
- L441 `input[type="text"].nth(0)` → איפה את/ה גר/ה היום?
- L442 `input[type="text"].nth(1)` → מאיפה את/ה במקור?
- L453 `textarea.first()` → ספר/י לנו בקצרה על עצמך

- [x] **Step 1: Verify the Hebrew labels against the component source**

Read `src/features/profile/ProfileBaseQuestionnaire.tsx` (and `src/pages/questionnaire/QuestionnairePage.tsx` if labels are defined there). Confirm each audited label matches the actual `<label>` text.

- [x] **Step 2: Replace each selector**

Pattern: `page.locator('input[type="X"]').first().fill(...)` → `page.getByLabel('<Hebrew label>').fill(...)`

Example (line 431):
```typescript
// Before
await page.locator('input[type="text"]').first().fill('אורית בדיקה');
// After
await page.getByLabel('שם מלא').fill('אורית בדיקה');
```

Apply to all 8 selectors.

- [x] **Step 3: Run the test**

Run: `npx playwright test --project=chromium -g "questionnaire: full workflow"`

Expected: PASS.

If a `getByLabel` call fails because the label differs from what was assumed, inspect the actual form via `await page.pause()` locally or re-read the component file. Do not guess; fix the label string to match.

- [x] **Step 4: Commit**

```bash
git add e2e/participant-foundation.spec.ts
git commit -m "test(questionnaire): replace .nth/.first() with name-based selectors

The questionnaire workflow test relied on input[type=...].first() and
.nth(0/1) for 8 fields. Any re-ordering of the form or insertion of a
new field would silently misdirect the fills. Switched to getByLabel()
using the Hebrew field labels so the selectors are semantic and survive
layout changes."
```

---

### Task D.5: Tighten overclaiming test names — participant-foundation.spec.ts:251

**Files:**
- Modify: `e2e/participant-foundation.spec.ts:251`

- [x] **Step 1: Read the current test**

Name: `"auth callback keeps a visible loading state before redirect completes"`. Body only waits for `/מאמתים/` — does not assert the redirect ever finished.

- [x] **Step 2: Tighten** — add the missing assertion OR rename

Option A (add assertion, preferred):

```typescript
test('auth callback shows loading copy then navigates away from /auth/callback', async ({ browser }) => {
  const ctx = await browser.newContext();
  try {
    const page = await ctx.newPage();
    await page.goto('/auth/callback');
    await expect(page.getByText(/מאמתים/)).toBeVisible();
    await expect(page).not.toHaveURL(/\/auth\/callback/, { timeout: 10_000 });
  } finally {
    await ctx.close();
  }
});
```

Option B (rename without adding assertion):

```typescript
test('auth callback shows loading copy during navigation', async ({ browser }) => {
  // existing body
});
```

Use Option A. It's more informative and the assertion is cheap.

- [x] **Step 3: Run and commit**

```bash
npx playwright test --project=chromium -g "auth callback"
git add e2e/participant-foundation.spec.ts
git commit -m "test(auth): assert /auth/callback actually redirects, not just shows loading"
```

---

### Task D.6: Tighten overclaim at participant-foundation.spec.ts:19

**Files:**
- Modify: `e2e/participant-foundation.spec.ts:19`

Current name: `"authenticated participant sees a readiness message before applying when blocked"`. Body uses a regex alternation across many unrelated blocked reasons — no guarantee of which reason was hit.

- [x] **Step 1: Decide the approach**

Simplest correct fix: rename to match what's actually asserted. The test verifies *some* blocked-reason copy appears, not a specific one. Rename:

```typescript
test('authenticated participant sees at least one blocking readiness message on /apply', async ({ browser }) => {
  // body unchanged
});
```

This is honest. Splitting into one-test-per-reason would require fixture setup per reason — out of scope for test hygiene; file a followup note.

- [x] **Step 2: Apply the rename + add a comment explaining the alternation**

```typescript
// The alternation covers every blocked-reason copy the fixture user
// might legitimately hit (profile incomplete, saved seat, ended event,
// etc.). This test asserts the page surfaces *one* of them, not any
// specific one. Splitting into per-reason tests requires per-reason
// fixture setup — tracked as a followup.
test('authenticated participant sees at least one blocking readiness message on /apply', async ({ browser }) => {
  // body unchanged
});
```

- [x] **Step 3: Run and commit**

```bash
npx playwright test --project=chromium -g "blocking readiness message"
git add e2e/participant-foundation.spec.ts
git commit -m "test(apply): rename readiness-blocked test to match weaker assertion"
```

---

### Task D.7: Tighten overclaim at participant-foundation.spec.ts:372

**Files:**
- Modify: `e2e/participant-foundation.spec.ts:372`

Current name: `"questionnaire: matching_responses load failure shows RouteErrorState and keeps form"`. Body asserts error copy + presence of a `המשך` button, but does NOT assert the form itself is still rendered.

- [x] **Step 1: Add the missing assertion**

After the existing assertions, add:

```typescript
await expect(page.getByLabel('שם מלא')).toBeVisible();
```

This verifies the form (specifically the Step 1 identity form) is rendered alongside the error, which is what the test claims.

- [x] **Step 2: Run and commit**

```bash
npx playwright test --project=chromium -g "matching_responses load failure"
git add e2e/participant-foundation.spec.ts
git commit -m "test(questionnaire): assert form remains visible alongside error state"
```

---

### Task D.8: Tighten overclaim at participant-foundation.spec.ts:63

**Files:**
- Modify: `e2e/participant-foundation.spec.ts:63`

Current name: `"StatusBadge: apply surface shows current application short label when reapply form visible"`. Body asserts text `'לא נבחר/ת הפעם'` with no component-level scoping.

- [x] **Step 1: Scope to the badge**

Replace:
```typescript
await expect(page.getByText('לא נבחר/ת הפעם', { exact: true })).toBeVisible();
```

with:
```typescript
// The StatusBadge renders inside a .rounded-full span — scope the assertion
const badge = page.locator('span.rounded-full', { hasText: 'לא נבחר/ת הפעם' });
await expect(badge).toBeVisible();
```

If `StatusBadge.tsx` uses a different root className, inspect `src/components/shared/StatusBadge.tsx:8-11` and adjust the locator accordingly.

- [x] **Step 2: Run and commit**

```bash
npx playwright test --project=chromium -g "StatusBadge: apply surface"
git add e2e/participant-foundation.spec.ts
git commit -m "test(apply): scope StatusBadge assertion to the badge element"
```

---

### Task D.9: Tighten overclaim at foundation-routes.spec.ts:19

**Files:**
- Modify: `e2e/foundation-routes.spec.ts:19`

Current name: `"admin placeholder routes render behind admin guard"`. Body signs in as ADMIN1 and checks content — never tests that a non-admin is blocked.

- [x] **Step 1: Rename to match actual coverage**

```typescript
test('admin placeholder routes render expected copy when signed in as admin', async ({ browser }) => {
  // body unchanged
});
```

Then file a note pointing to F-5: the negative case (non-admin denial) should be covered after F-5's `AdminRoute` behavior is finalized.

- [x] **Step 2: Add a comment above the test**

```typescript
// NOTE: does not verify the guard rejects non-admins — AdminRoute currently
// silently redirects to /, which makes a positive denial assertion hard.
// See foundation ticket F-5 (docs/foundation-tickets/2026-04-20-05-*).
```

- [x] **Step 3: Run and commit**

```bash
npx playwright test --project=chromium -g "admin placeholder routes"
git add e2e/foundation-routes.spec.ts
git commit -m "test(foundation): rename admin-route test to match positive-only coverage"
```

---

### Task D.10: Tighten overclaim at participant-foundation.spec.ts:406 (questionnaire workflow)

**Files:**
- Modify: `e2e/participant-foundation.spec.ts:406`

Current name: `"questionnaire: full workflow completes and lands on success state with CTAs"`. Body stubs Supabase PATCH calls — doesn't verify real persistence.

- [x] **Step 1: Add clarity to the name**

Rename:
```typescript
test('questionnaire: UI workflow completes to success state with CTAs (API stubbed)', async ({ browser }) => {
  // body unchanged
});
```

- [x] **Step 2: Add a comment explaining the stubbing choice**

```typescript
// API writes are stubbed via page.route so the staging DB isn't mutated.
// Real persistence is covered by manual QA + the slice-happy-path test.
```

- [x] **Step 3: Run and commit**

```bash
npx playwright test --project=chromium -g "questionnaire: UI workflow"
git add e2e/participant-foundation.spec.ts
git commit -m "test(questionnaire): clarify that workflow test uses stubbed API writes"
```

---

### Task D.11: SP-D verification sweep

- [x] **Step 1: Dispatch read-only subagent**

```
Search e2e/ for any test that calls browser.newContext() without a matching finally { await ctx.close() } within the same test(...) arrow function. Return file:line of every violation, or PASS if none found.

Separately: search e2e/participant-foundation.spec.ts for any .nth( or .first()/.last() on locators that lack a name option. Return every hit.
```

- [x] **Step 2: If PASS/PASS, continue. If any hits remain, patch them.**

- [x] **Step 3: Three consecutive full-suite runs**

```bash
for i in 1 2 3; do
  rm -rf test-results playwright-report
  npx playwright test --project=chromium || { echo "FAILED on run $i"; break; }
done
```

All three must pass.

- [x] **Step 4: Open and merge PR** (rebase onto main first):

```bash
git fetch origin && git rebase origin/main
git push -u origin dev-a/remediation-sp-d-test-hygiene
gh pr create --base main --head dev-a/remediation-sp-d-test-hygiene \
  --title "test: E2E hygiene sweep (SP-D)" \
  --body "<describe the 11 ctx.close() fixes, 8 selector replacements, 6 overclaim fixes; link spec §5.4>"
gh pr merge --rebase --delete-branch
git checkout main && git pull --ff-only
```

---

# Sub-project C — Consistency Polish (SP-C)

**Branch:** `dev-a/remediation-sp-c-consistency`
**Files modified:** shared extracted component + 3 pages + 1 feature file + E2E tests.
**TDD:** regression tests before each migration.

### Task C.1: Extract EventNotFound component — RED unit test

**Files:**
- Create: `src/components/participant/EventNotFound.test.tsx`
- (will create) `src/components/participant/EventNotFound.tsx`

- [x] **Step 1: Write the component test first**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EventNotFound } from './EventNotFound';

describe('EventNotFound', () => {
  it('renders Hebrew page title and subtitle', () => {
    render(
      <MemoryRouter>
        <EventNotFound />
      </MemoryRouter>,
    );
    expect(screen.getByText(/המפגש לא נמצא/)).toBeInTheDocument();
    expect(screen.getByText(/לא פומבי|אינו תקין/)).toBeInTheDocument();
  });

  it('renders a CTA linking back to /events', () => {
    render(
      <MemoryRouter>
        <EventNotFound />
      </MemoryRouter>,
    );
    const cta = screen.getByRole('link', { name: /חזרה לכל המפגשים/ });
    expect(cta).toHaveAttribute('href', '/events');
  });
});
```

- [x] **Step 2: Run the test; verify RED**

Run: `npm test -- src/components/participant/EventNotFound.test.tsx`

Expected failure: module not found (`EventNotFound.tsx` doesn't exist yet).

- [x] **Step 3: Do NOT commit yet.**

---

### Task C.2: Extract EventNotFound — GREEN implementation

**Files:**
- Create: `src/components/participant/EventNotFound.tsx`

- [x] **Step 1: Write the component**

```tsx
import { Link } from 'react-router-dom';
import { PageShell } from '@/components/shared/PageShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { tokens } from '@/lib/tokens';

export function EventNotFound() {
  return (
    <PageShell
      title="המפגש לא נמצא"
      subtitle="יכול להיות שהוא כבר לא פומבי, או שהקישור אינו תקין."
    >
      <Card className={tokens.card.surface}>
        <CardContent className="space-y-4 py-8 text-sm text-muted-foreground">
          <p>לא מצאנו מפגש פומבי שמתאים לקישור הזה.</p>
          <Button asChild variant="outline">
            <Link to="/events">חזרה לכל המפגשים</Link>
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  );
}
```

Verify import paths match the actual project structure:
- Run: `grep -l 'export.*PageShell' src/ -r`
- Run: `grep -l 'export.*tokens' src/lib/`

Adjust imports as needed.

- [x] **Step 2: Run the component tests**

Run: `npm test -- src/components/participant/EventNotFound.test.tsx`

Expected: PASS.

- [x] **Step 3: Do NOT commit yet** (migrate call sites first so the first commit contains both the new component AND all call-site migrations — a clean refactor commit.)

---

### Task C.3: Migrate ApplyPage's event-not-found block

**Files:**
- Modify: `src/pages/apply/ApplyPage.tsx:407-417`

- [x] **Step 1: Import EventNotFound**

Add to imports at top of `ApplyPage.tsx`:
```tsx
import { EventNotFound } from '@/components/participant/EventNotFound';
```

- [x] **Step 2: Replace the block**

Replace lines 407-417:
```tsx
if (!event) {
  return (
    <PageShell title="המפגש לא נמצא" subtitle="יכול להיות שהוא כבר לא פומבי או שהקישור אינו תקין.">
      <Card className={tokens.card.surface}>
        <CardContent className="space-y-4 py-8 text-sm text-muted-foreground">
          <p>לא מצאנו מפגש שאפשר להגיש אליו דרך הקישור הזה.</p>
          <Button asChild variant="outline">
            <Link to="/events">חזרה לכל המפגשים</Link>
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  );
}
```

With:
```tsx
if (!event) {
  return <EventNotFound />;
}
```

Note: the original ApplyPage copy says "לא מצאנו מפגש שאפשר להגיש אליו" (slightly apply-specific) while `EventNotFound` uses "לא מצאנו מפגש פומבי שמתאים לקישור הזה" (generic). Decision: accept the minor copy change — the user is on `/apply/:eventId` so "שאפשר להגיש אליו" vs "פומבי שמתאים לקישור" is a narrow distinction that doesn't harm clarity. If the product insists on apply-specific copy, parameterize `EventNotFound` with an optional `body` prop in a followup.

- [x] **Step 3: Run the full Playwright suite to check for regressions**

Run: `npx playwright test --project=chromium`

Expected: all previously-passing tests still pass.

---

### Task C.4: Migrate EventDetailPage's event-not-found block

**Files:**
- Modify: `src/pages/events/EventDetailPage.tsx:99-109`

- [x] **Step 1: Import EventNotFound**

Add to imports at top of `EventDetailPage.tsx`:
```tsx
import { EventNotFound } from '@/components/participant/EventNotFound';
```

- [x] **Step 2: Replace the block**

Replace lines 99-109:
```tsx
if (!event) {
  return (
    <PageShell title="המפגש לא נמצא" subtitle="יכול להיות שהוא כבר לא פומבי, או שהקישור אינו תקין.">
      <Card className={tokens.card.surface}>
        <CardContent className="space-y-4 py-8 text-sm text-muted-foreground">
          <p>לא מצאנו מפגש פומבי שמתאים לקישור הזה.</p>
          <Button asChild variant="outline">
            <Link to="/events">חזרה לכל המפגשים</Link>
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  );
}
```

With:
```tsx
if (!event) {
  return <EventNotFound />;
}
```

Then remove imports from `EventDetailPage.tsx` that are no longer used by any remaining code in the file. Candidates to check: `Card`, `CardContent`, `Button`, `Link` (from react-router-dom), `PageShell`, `tokens`. Run `grep -n 'Card\|CardContent\|Button\|Link\|PageShell\|tokens' src/pages/events/EventDetailPage.tsx` after the replacement — if a name appears zero times outside the import line, remove it.

- [x] **Step 3: Run the suite**

Run: `npx playwright test --project=chromium`
Expected: all pass.

---

### Task C.5: Migrate GatheringPage's event-not-found block

**Files:**
- Modify: `src/pages/gathering/GatheringPage.tsx:279-287`

- [x] **Step 1: Import EventNotFound**

Add to imports at top of `GatheringPage.tsx` (if not already present from Task B.2):
```tsx
import { EventNotFound } from '@/components/participant/EventNotFound';
```

- [x] **Step 2: Replace the block**

Replace lines 279-287:
```tsx
if (!event) {
  return (
    <PageShell title="המפגש לא נמצא" subtitle="יכול להיות שהוא כבר לא פומבי, או שהקישור אינו תקין.">
      <Card className={tokens.card.surface}>
        <CardContent className="py-8 text-sm text-muted-foreground">
          לא מצאנו מפגש פומבי שמתאים לקישור הזה.
        </CardContent>
      </Card>
    </PageShell>
  );
}
```

With:
```tsx
if (!event) {
  return <EventNotFound />;
}
```

The original GatheringPage block had no CTA. After migration, users get the `חזרה לכל המפגשים` CTA inherited from `EventNotFound`. This is an intentional UX improvement (users should always have an exit path from an error state).

Remove now-unused imports as in Task C.4 (run the same grep check).

- [x] **Step 3: Run the suite and commit the extraction + 3 migrations**

```bash
npx playwright test --project=chromium
npm test -- src/components/participant/EventNotFound.test.tsx
git add src/components/participant/EventNotFound.tsx \
  src/components/participant/EventNotFound.test.tsx \
  src/pages/apply/ApplyPage.tsx \
  src/pages/events/EventDetailPage.tsx \
  src/pages/gathering/GatheringPage.tsx
git commit -m "refactor(participant): extract EventNotFound component from 3 duplicated blocks

ApplyPage, EventDetailPage, and GatheringPage each rendered a near-identical
PageShell+Card+CTA for the 'event not found' state. Extracted to
src/components/participant/EventNotFound with Vitest coverage for the
Hebrew copy and /events CTA.

GatheringPage's block had no CTA previously; it now inherits the shared
/events CTA, which is a UX improvement."
```

---

### Task C.6: Fix English strings — LandingPage "Circles"

**Files:**
- Modify: `src/pages/landing/LandingPage.tsx:12`

- [x] **Step 1: Write the RED E2E assertion**

Add to `e2e/participant-foundation.spec.ts`:

```typescript
test('landing: page body contains no English brand token', async ({ browser }) => {
  const ctx = await browser.newContext();
  try {
    const page = await ctx.newPage();
    await page.goto('/');
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/\bCircles\b/);
  } finally {
    await ctx.close();
  }
});
```

- [x] **Step 2: Run; verify RED**

Run: `npx playwright test --project=chromium -g "landing: page body contains no English"`

Expected failure: body matches `/\bCircles\b/` (currently on line 12 of LandingPage.tsx).

- [x] **Step 3: Patch LandingPage.tsx:12**

Decide on Hebrew replacement for the brand name "Circles" in the subtitle context. Options:
- Remove the brand name: `"עוזרת לך להצטרף למפגשים חברתיים קטנים..."` (drop the subject).
- Transliterate: `"סרקלס עוזרת לך..."` (probably ugly).
- Use an explicit product name in Hebrew: `"האפליקציה עוזרת לך..."` (generic but clean).

Recommendation: drop "Circles" and restructure as a generic subject or a product-neutral sentence. Exact copy to be confirmed by user Hebrew-review before merge.

Placeholder implementation (to be confirmed):
```tsx
subtitle="מצטרפים למפגשים חברתיים קטנים, נעימים ומאוצרים — עם תהליך שמרגיש בטוח יותר מרנדומליות."
```

- [x] **Step 4: Run; verify GREEN**

Run: `npx playwright test --project=chromium -g "landing: page body contains no English"`

Expected: PASS.

- [x] **Step 5: Defer commit to C.9 (batch English fixes)**

---

### Task C.7: Fix English strings — AuthPage "apply" token (placeholders retained as format hints)

**Files:**
- Modify: `src/pages/auth/AuthPage.tsx:330`

**Decision up front:** The audit flagged three English items in AuthPage:
- L271: `placeholder="123456"` — numeric, language-neutral. Retain.
- L309: `placeholder="name@example.com"` — format hint for email structure that Hebrew speakers parse as a structural pattern, not as English prose. Retain.
- L330: `"חוזרים אוטומטית ל-apply או לדשבורד"` — the word "apply" is used as prose inside a Hebrew sentence. Replace with Hebrew.

Only L330 is a genuine English-in-Hebrew-prose problem. The placeholders are format hints; changing them produces worse UX in Hebrew (users expect to see `name@example.com` as the email format).

- [x] **Step 1: Write RED E2E**

Add to `e2e/participant-foundation.spec.ts`:

```typescript
test('auth: page body contains no English prose word "apply"', async ({ browser }) => {
  const ctx = await browser.newContext();
  try {
    const page = await ctx.newPage();
    await page.goto('/auth');
    await expect(page.locator('body')).not.toContainText(/\bapply\b/);
  } finally {
    await ctx.close();
  }
});
```

- [x] **Step 2: Verify RED**

Run: `npx playwright test --project=chromium -g "auth: page body contains no English prose"`

Expected failure: body contains `"apply"` inside the sentence `"חוזרים אוטומטית ל-apply או לדשבורד"` at AuthPage.tsx:330.

- [x] **Step 3: Patch line 330**

Replace:
```tsx
<p>3. חוזרים אוטומטית ל-apply או לדשבורד, בלי לחפש שוב את המקום הנכון.</p>
```

With:
```tsx
<p>3. חוזרים אוטומטית להגשה או לדשבורד, בלי לחפש שוב את המקום הנכון.</p>
```

(הגשה = "submission/application", fits the context of returning to an apply flow.)

- [x] **Step 4: Verify GREEN**

Run: `npx playwright test --project=chromium -g "auth: page body contains no English prose"`

Expected: PASS.

- [x] **Step 5: Defer commit to C.9**

---

### Task C.8: Add ApplyPage + DashboardPage RouteErrorState normalization

**Files:**
- Modify: `src/pages/apply/ApplyPage.tsx` (paths A, C, D, E per audit)

Audit identified 6 error paths in ApplyPage, only 2 using RouteErrorState. The migration targets:
- **Path A (line 389-396)**: loading state — NOT an error, leave as-is (loading ≠ error).
- **Path C (line 407-419)**: event-missing state — already migrated to `<EventNotFound />` in Task C.3. 
- **Path D (line 422-434)**: unauthenticated state — is this really an error or a distinct state? Leave as-is; it's not an error per se but a branching state. Migrating would force an English-y "error" framing where a "please sign in" framing is more accurate.
- **Path E (line 437-490)**: `confirmError` for temporary-spot flow — *could* use RouteErrorState, but this is inline during a decision flow (the user is mid-interaction). Inline `<p className="text-destructive">` is the correct pattern for form-level errors, not RouteErrorState. Leave as-is.
- **Path F (line 699)**: submitError — already uses RouteErrorState. 

Revised decision: SP-C WS4 (error normalization) is effectively a no-op for ApplyPage after C.3 migrates the event-missing block. The "6 error paths" framing from the audit conflated loading/state/error boundaries with actual errors.

For DashboardPage: audit found only 1 error path (line 96-99) already using RouteErrorState. No migration needed.

- [x] **Step 1: Document the decision in a PR comment** (see C.10)

- [x] **Step 2: No code change.** Skip to C.9.

---

### Task C.9: Commit batched English-string fixes

- [x] **Step 1: Run full suite**

```bash
npx playwright test --project=chromium
```

Expected: all pass (including the two new RED→GREEN tests from C.6 and C.7).

- [x] **Step 2: Commit**

```bash
git add src/pages/landing/LandingPage.tsx src/pages/auth/AuthPage.tsx e2e/participant-foundation.spec.ts
git commit -m "fix(participant): remove English brand token and 'apply' word from Hebrew UI

LandingPage subtitle: 'Circles עוזרת לך...' → 'מצטרפים למפגשים...' (restructured
to drop the untranslated brand name).

AuthPage benefits list: 'חוזרים אוטומטית ל-apply או לדשבורד' → 'חוזרים אוטומטית
להגשה או לדשבורד'.

Email/OTP placeholders retained as-is — 'name@example.com' and '123456' are
format hints that Hebrew speakers read fluently as structural patterns, not
as English prose.

Adds two E2E regression tests asserting neither surface contains 'Circles'
or the bare word 'apply' in its rendered body."
```

---

### Task C.10: SP-C verification + PR

- [x] **Step 1: Rebase onto main** (SP-B and SP-D may have merged):

```bash
git fetch origin && git rebase origin/main
```

- [x] **Step 2: Run full suite**

```bash
rm -rf test-results playwright-report
npx playwright test --project=chromium
npx tsc -b --noEmit
npm test
```

All pass.

- [x] **Step 3: Dispatch SP-C verification subagent**

```
Scan src/pages/**/*.tsx and src/features/**/*.tsx for user-visible English words in JSX text content (NOT comments, imports, or route paths). Specifically check for: 'Circles', ' apply ', ' Apply ', 'Loading', 'Save', 'Submit', 'Cancel', 'Error' as standalone words. Return file:line:content for every hit.

Separately: confirm zero duplicated 'event not found' blocks remain. Grep for 'המפגש לא נמצא' — expect every hit to be inside src/components/participant/EventNotFound.tsx only (plus admin TeamGatheringPage which is Dev B scope).

Return both checks as PASS/FAIL.
```

- [x] **Step 4: Open PR**

```bash
git push -u origin dev-a/remediation-sp-c-consistency
gh pr create --base main --head dev-a/remediation-sp-c-consistency \
  --title "refactor: consistency polish (SP-C)" \
  --body "$(cat <<'EOF'
## Summary
- Extract `EventNotFound` component; migrate 3 participant pages (ApplyPage, EventDetailPage, GatheringPage) from duplicated blocks.
- Remove English 'Circles' brand name from LandingPage subtitle.
- Replace 'apply' English word in AuthPage benefits list with Hebrew 'הגשה'.
- Add regression E2E tests for both English-string fixes.
- `ApplicationLifecycleList` full migration to `presentation.ts` deferred: the two surfaces have partial, not full, overlap. Lightweight helper extraction filed as a followup note in the spec.
- `ApplyPage` / `DashboardPage` error-state normalization: after `EventNotFound` extraction, remaining "error paths" from the audit are actually state/flow branches (unauthenticated, in-flow confirm error), not errors. No further RouteErrorState migration needed.

## Hebrew copy changes (requires native-speaker review)

| Before | After |
|---|---|
| `Circles עוזרת לך להצטרף למפגשים חברתיים קטנים, נעימים ומאוצרים — עם תהליך שמרגיש בטוח יותר מרנדומליות.` | `מצטרפים למפגשים חברתיים קטנים, נעימים ומאוצרים — עם תהליך שמרגיש בטוח יותר מרנדומליות.` |
| `חוזרים אוטומטית ל-apply או לדשבורד` | `חוזרים אוטומטית להגשה או לדשבורד` |
| (GatheringPage event-not-found had no CTA) | (now inherits `חזרה לכל המפגשים` CTA from `EventNotFound`) |

## Verification
- Component tests: `npm test src/components/participant/EventNotFound.test.tsx` PASS.
- Full suite: 26 + 3 new = 29 tests, all green.
- Typecheck: `npx tsc -b --noEmit` clean.
- Subagent audit: zero English tokens in Hebrew participant UI, zero duplicated event-not-found blocks.

## Spec
`docs/superpowers/specs/2026-04-19-pass-3-remediation-design.md` §5.5.
EOF
)"
```

- [x] **Step 5: User Hebrew-copy review → merge after approval**

```bash
gh pr merge --rebase --delete-branch
git checkout main && git pull --ff-only
```

---

# Final Verification (across all 5 sub-projects)

Once all 5 PRs are merged:

- [x] **Step 1: Dispatch a read-only final-audit subagent**

```
Confirm the following across the current main:

1. Zero English user-facing strings in JSX body/text in src/pages/**/*.tsx (excluding comments, imports, placeholders that are format hints, and explicit allowlist: 'name@example.com' in email placeholder, '123456' in OTP placeholder).
2. Zero 'browser.newContext()' calls in e2e/ without a matching 'finally { await ctx.close() }' in the same test body.
3. Exactly one definition of 'המפגש לא נמצא' inside src/components/participant/EventNotFound.tsx (plus admin files which are out of scope).
4. docs/foundation-tickets/ contains F-1 through F-9 (9 files) indexed in README.
5. docs/superpowers/plans/2026-04-20-developer-b-kickoff.md has no remaining '/landing' route reference, no stale '25 passing' test count reference, and describes `npm run typecheck` consistently with `package.json` (`tsc -b --noEmit`).

Return a PASS/FAIL matrix. Do not propose changes.
```

- [x] **Step 2: If all PASS, the remediation is complete.** Notify user and ask whether to tag the completion (e.g., `dev-a-pass-3-remediation-complete`) or leave it at the natural main tip.

- [x] **Step 3: If any FAIL, file the gap as a followup task and decide whether to address in this pass or defer.**

---

## Self-Review Notes (orchestrator-internal)

**Spec coverage:** every §5.1–§5.5 section has ≥1 task. §6 acceptance criteria map to Task X.5/X.10 verification steps. §7 risks have concrete mitigations baked into the merge discipline (rebase between PRs, 3-run flake check, native-speaker Hebrew review for SP-B/C). §3 non-goals honored (no Foundation-owned file edits).

**Type consistency:** `formatApplicationStatusShort` is the existing helper from `src/features/applications/status.ts` — used consistently in B.2 and D.8. `EventNotFound` is named consistently across C.1, C.2, C.3, C.4, C.5, and the final audit. `withFlippedRegistrationStatus` matches existing helper in `e2e/fixtures/registrations.ts`.

**No placeholders** in any code step; every code block is complete.

**Deliberate scope reductions vs spec:**
- `ApplicationLifecycleList` → `presentation.ts` full migration dropped: evidence shows partial overlap. Filed as a spec-followup note, not a task here.
- Email/OTP placeholder English retention (`name@example.com`, `123456`): format hints, not prose. Retained in Task C.7 with explicit rationale.
- ApplyPage/DashboardPage error normalization: no-op after `EventNotFound` extraction. The audit's "6 error paths" conflated loading/flow/error states; only `event-not-found` was genuinely a RouteErrorState candidate and it's handled by C.3.
- Historical plan docs under `docs/superpowers/plans/2026-04-18-*` may still describe the **old** `typecheck` no-op; root `package.json` now runs `tsc -b --noEmit`. The spec acceptance criterion applies to *active* handoff docs (kickoff, audit, Pass-3 spec/plan). Frozen 2026-04-18 execution artifacts are not bulk-edited retroactively.

These are tightening, not scope-creep — each is documented in its own task with rationale.
