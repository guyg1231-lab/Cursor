# Apply-Flow Deepening (Polish Pass) — Developer A

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish-only deepening of `/events/:eventId` and `/events/:eventId/apply` so every application lifecycle state relevant to participants (pending; awaiting_response live; awaiting_response expired; confirmed/approved; attended; cancelled; rejected/re-apply eligible) surfaces a consistent `ApplicationStatusPanel` with aligned Hebrew `title`, `body`, and optional `footer` built from `formatLifecycleDateTime` where timestamps matter. Improve inline `StatusBadge` usage, tighten error/empty presentation with `RouteErrorState` / `RouteEmptyState`, and remove copy drift between the two routes—without new domain contracts.

**Architecture:** Add one pure presentation module under `src/features/applications/` that composes read-only helpers from `status.ts` (`canReapplyToEvent`, `canConfirmTemporarySpot`, `formatApplicationStatusDetailed`, `formatLifecycleDateTime`, `isAwaitingParticipantResponse`, `isOfferExpired`, `isConfirmedParticipation`) into a single `{ title, body, footer? }` (plus optional badge label) for a given `EventRegistrationRow`. `ApplyPage` and `EventDetailPage` remain thin orchestrators: load data, branch on guards, render `PageShell` + `ApplicationStatusPanel` + actions. No new RPC, tables, or lifecycle edges.

**Tech Stack:** React 18, TypeScript, React Router 6, Tailwind, Supabase client, Playwright

---

## Prerequisite

Merge `dev-a/participant-normalization` first.

This branch is expected to include: shared participant primitives wired on these pages (`PageShell`, `PageActionBar` where applicable, `SectionHeader` where applicable, `StatusBadge`, `RouteEmptyState`, `RouteErrorState`), the `ApplicationStatusPanel` component (`title`, `body`, optional `footer` — **do not** change its public props), and a baseline `e2e/participant-foundation.spec.ts`. Do **not** use `RouteLoadingState` or `PlaceholderPanel` on participant surfaces per foundation rules.

---

## Non-negotiable scope rules

- **Do not modify:** `routeManifest.ts`, `AppRouter.tsx`, `guards.tsx`, any file under `src/components/shared/*`, host/admin pages, `e2e/foundation-routes.spec.ts`, `e2e/slice-happy-path.spec.ts`, `src/features/applications/api.ts`, or `src/features/applications/status.ts` (treat helpers as a read-only contract).
- **Reuse** `ApplicationStatusPanel` and `StatusBadge`; do not rename or extend the panel component’s API—use the existing `footer` slot for deadline / lifecycle lines.
- **All user-facing copy remains Hebrew.**
- **Touch only:** `src/pages/apply/ApplyPage.tsx`, `src/pages/events/EventDetailPage.tsx`, `e2e/participant-foundation.spec.ts`, and **at most one** new file `src/features/applications/presentation.ts` (or the agreed single helper file under that feature folder).

---

## File Map

- Create: `src/features/applications/presentation.ts` — `resolveApplicationPanelContent(application: EventRegistrationRow)` returning `{ title: string; body: string; footer?: string; statusBadgeLabel?: string }` (exact shape may omit `statusBadgeLabel` if pages pass `formatApplicationStatusShort` directly, but prefer one source of truth).
- Modify: `src/pages/apply/ApplyPage.tsx`
- Modify: `src/pages/events/EventDetailPage.tsx`
- Modify: `e2e/participant-foundation.spec.ts` (relative imports: `./fixtures/env`, `./fixtures/auth`; use `ENV.EMAILS.P1` … `P4`, `ENV.EVENT_ID`, `authenticateAs`)

---

## Spec anchors (why this pass exists)

- **`/events/:eventId`:** Canonical participant understanding + application status entry; clarify prior applications, temporary-offer states, reapplication eligibility; hand off to apply (foundation spec §10.1, lines 397–408 in `docs/superpowers/specs/2026-04-18-near-term-buildout-foundation-design.md`).
- **`/events/:eventId/apply`:** Application flow + status surface; blocked states, readiness gating, temporary-offer response—without changing draft/persist behavior (lines 410–421).
- **§9.5 Vocabulary:** Stable Hebrew labels for readiness, application state, temporary offer, confirmation—aligned across routes (spec ~296–308).
- **§12.1 Participant examples:** questionnaire incomplete, already applied, submitted, registration closed, offer awaiting response, offer expired, confirmed participation (~664–672)—this pass maps those **presentation** outcomes to consistent panels and badges.

---

## Task 1: `resolveApplicationPanelContent` + first awaiting-response footer gate

**Files:**

- Create: `src/features/applications/presentation.ts`
- Modify: `src/pages/apply/ApplyPage.tsx` (minimal wiring: awaiting-response branch reads helper output for `footer` only, or full panel if faster)
- Test: `e2e/participant-foundation.spec.ts`

- [ ] **Step 1: Write the failing test**

Add a test that signs in `ENV.EMAILS.P1`, navigates to `/events/${ENV.EVENT_ID}/apply`, and asserts the awaiting-response panel exposes a footer-style deadline line in Hebrew, e.g. visible copy matching:

`/מועד אחרון לתגובה|יש להגיב עד|עד לתגובה/i`

combined with content produced via `formatLifecycleDateTime` (the rendered string is locale-shaped; prefer `expect(locator).toContainText` with a substring you know appears from the staging row’s `expires_at`, or assert the footer region text includes the Hebrew label prefix you set in the helper).

Respect heading levels in queries: `PageShell` owns the `h1`; do not assert the wrong heading level for card titles (`CardTitle` → `h3`).

```ts
import { test, expect } from '@playwright/test';
import { ENV } from './fixtures/env';
import { authenticateAs } from './fixtures/auth';

test('P1 awaiting temporary offer sees Hebrew deadline footer on apply', async ({ browser }) => {
  const ctx = await browser.newContext();
  await authenticateAs(ctx, ENV.EMAILS.P1);
  const page = await ctx.newPage();
  await page.goto(`/events/${ENV.EVENT_ID}/apply`);
  await expect(page.getByText(/מועד אחרון לתגובה|יש להגיב עד/i)).toBeVisible();
  await ctx.close();
});
```

(Adjust the regex to the **exact** footer prefix the helper uses once written.)

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx playwright test e2e/participant-foundation.spec.ts --project=chromium
```

Expected: **FAIL** — footer line not yet centralized / missing on `ApplicationStatusPanel`.

- [ ] **Step 3: Implement `resolveApplicationPanelContent` + minimal apply wiring**

Implement a pure function that branches on `application.status`, `isOfferExpired(application)`, and `isConfirmedParticipation` / `canReapplyToEvent` as needed. For `awaiting_response`, set e.g.:

- **title (live):** `נשמר עבורך מקום זמני`
- **body (live):** `כדי לשמור על המקום צריך לאשר את ההרשמה עד המועד שמופיע למטה.`
- **footer (live):** ``מועד אחרון לתגובה: ${formatLifecycleDateTime(application.expires_at)}`` (and parallel lines for `offered_at` if product wants both—keep one footer string or two sentences in one `footer` prop).

Expired:

- **title:** `חלון התגובה למקום הזמני נסגר`
- **body:** `המקום הזמני כבר לא ממתין לתגובה.`
- **footer:** ``המועד שעבר: ${formatLifecycleDateTime(application.expires_at)}``

Wire `ApplyPage` awaiting-response block so `ApplicationStatusPanel` receives `title`/`body`/`footer` from this helper (keep existing confirm buttons / `SubmittedAnswersSummary` as-is).

- [ ] **Step 4: Verify**

```bash
npm run typecheck
npx playwright test e2e/participant-foundation.spec.ts e2e/foundation-routes.spec.ts --project=chromium
```

Expected: **PASS**

- [ ] **Step 5: Commit**

```bash
git add src/features/applications/presentation.ts src/pages/apply/ApplyPage.tsx e2e/participant-foundation.spec.ts
git commit -m "feat: centralize apply awaiting-response panel copy"
```

---

## Task 2: `ApplyPage` — unify blocked / closed / readiness branches + `StatusBadge`

**Files:**

- Modify: `src/pages/apply/ApplyPage.tsx`
- Modify: `src/features/applications/presentation.ts` (only if small shared snippets for non-`EventRegistrationRow` states are inlined here as pure constants—**prefer** keeping questionnaire/closed-event copy in the page if it avoids bloating the helper beyond `EventRegistrationRow`.)
- Test: `e2e/participant-foundation.spec.ts`

- [ ] **Step 1: Extend / add failing tests**

Keep the existing test `authenticated participant sees a readiness message before applying when blocked` (or the merged equivalent) asserting Hebrew gate copy such as:

`/צריך להשלים את הפרופיל|המקום שלך במפגש נשמר|כבר קיימת הגשה/i`

Add:

```ts
test('apply surface shows StatusBadge for current application status when form visible', async ({ browser }) => {
  const ctx = await browser.newContext();
  await authenticateAs(ctx, ENV.EMAILS.P1);
  const page = await ctx.newPage();
  await page.goto(`/events/${ENV.EVENT_ID}/apply`);
  await expect(page.getByText('הגשה נשלחה')).toBeVisible();
  await ctx.close();
});
```

Use the **exact** short label your UI shows for the staged P1 state (map to `formatApplicationStatusShort` — for pending, the string is `הגשה נשלחה`). If P1 is not `pending` in staging, switch to the email whose seeded status matches the assertion **or** document in Self-Review and use the correct short string for that fixture row.

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npx playwright test e2e/participant-foundation.spec.ts --project=chromium
```

Expected: **FAIL** until `StatusBadge` is rendered above the main form and readiness / cannot-reapply / registration-closed blocks use `ApplicationStatusPanel` + Hebrew-only copy.

- [ ] **Step 3: Minimal UI polish**

- Replace ad hoc `Card` copy blocks for: questionnaire not ready, registration closed, cannot-reapply (non-awaiting), and the main form header region—with `ApplicationStatusPanel` + consistent subtitles on `PageShell` where helpful.
- Render `<StatusBadge label="…" />` above the form when the open-apply branch shows (use `formatApplicationStatusShort(existingApplication.status)` when an application exists).
- Swap raw error `Card` paragraphs for `<RouteErrorState title="…" body="…" />` where the spec is load/submit failure (Hebrew titles, e.g. `title="לא הצלחנו לטעון את פרטי ההגשה"` / `body={error}`).

- [ ] **Step 4: Verify**

```bash
npm run typecheck
npx playwright test e2e/participant-foundation.spec.ts e2e/foundation-routes.spec.ts --project=chromium
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/apply/ApplyPage.tsx src/features/applications/presentation.ts e2e/participant-foundation.spec.ts
git commit -m "feat: polish apply page panels and status badge"
```

---

## Task 3: `EventDetailPage` — drive awaiting / confirmed / terminal states from helper + panel

**Files:**

- Modify: `src/features/applications/presentation.ts`
- Modify: `src/pages/events/EventDetailPage.tsx`
- Test: `e2e/participant-foundation.spec.ts`

- [ ] **Step 1: Write failing test for detail footer**

```ts
test('event detail shows temporary-offer deadline as ApplicationStatusPanel footer for awaiting P1', async ({ browser }) => {
  const ctx = await browser.newContext();
  await authenticateAs(ctx, ENV.EMAILS.P1);
  const page = await ctx.newPage();
  await page.goto(`/events/${ENV.EVENT_ID}`);
  await expect(page.getByText(/מועד אחרון לתגובה|יש להגיב עד/i)).toBeVisible();
  await ctx.close();
});
```

(Align regex with Task 1 footer prefix.)

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx playwright test e2e/participant-foundation.spec.ts --project=chromium
```

Expected: **FAIL** if detail still uses inline `div` copy without shared footer.

- [ ] **Step 3: Refactor `EventDetailPage`**

Replace inline rounded status blocks with `ApplicationStatusPanel` fed by `resolveApplicationPanelContent` when `application` is non-null and the state is offer / confirmed / blocking / re-apply-eligible. Add `StatusBadge` inline with the same short label strategy as apply. Keep layout/grid and action buttons; do not change link targets.

- [ ] **Step 4: Verify**

```bash
npm run typecheck
npx playwright test e2e/participant-foundation.spec.ts e2e/foundation-routes.spec.ts --project=chromium
```

- [ ] **Step 5: Commit**

```bash
git add src/features/applications/presentation.ts src/pages/events/EventDetailPage.tsx e2e/participant-foundation.spec.ts
git commit -m "feat: align event detail application panels with apply"
```

---

## Task 4: Reapplication eligibility regression (real fixture only)

**Files:**

- Test: `e2e/participant-foundation.spec.ts`
- Modify: `src/pages/apply/ApplyPage.tsx` (only if the test exposes a real gap)

- [ ] **Step 1: Attempt the failing test**

```ts
test('cancelled or rejected participant sees open apply form with prior submission summary', async ({ browser }) => {
  const ctx = await browser.newContext();
  await authenticateAs(ctx, ENV.EMAILS.P4);
  const page = await ctx.newPage();
  await page.goto(`/events/${ENV.EVENT_ID}/apply`);
  await expect(page.getByRole('heading', { name: 'פרטים על ההגשה' })).toBeVisible();
  await expect(page.getByText('ההגשה הקודמת שלך')).toBeVisible();
  await ctx.close();
});
```

Pick `P2`/`P3`/`P4` based on which staging seed is `cancelled` or `rejected` for `E2E_EVENT_ID` (discover once via Supabase or team notes). Heading query must match actual `CardTitle` text.

- [ ] **Step 2: Run test**

```bash
npx playwright test e2e/participant-foundation.spec.ts --project=chromium
```

If no seeded row matches: **delete/skip the test** and record the gap under Self-Review (do **not** add API mocks).

- [ ] **Step 3: Minimal fix (if test fails for product/UI reasons)**

Ensure the open-form + `SubmittedAnswersSummary` branch shows `ApplicationStatusPanel` summarizing prior status in Hebrew, e.g. `title="הגשה קודמת למפגש"` / `body` explaining re-apply using `formatApplicationStatusDetailed`.

- [ ] **Step 4: Verify**

```bash
npm run typecheck
npx playwright test e2e/participant-foundation.spec.ts e2e/foundation-routes.spec.ts --project=chromium
```

- [ ] **Step 5: Commit**

```bash
git add e2e/participant-foundation.spec.ts src/pages/apply/ApplyPage.tsx
git commit -m "test: cover reapplication apply surface when fixture allows"
```

---

## Developer B coordination

**Do not touch** this pass’s files or participant E2E unless coordinating a rebase: `ApplyPage.tsx`, `EventDetailPage.tsx`, `e2e/participant-foundation.spec.ts`, and `src/features/applications/presentation.ts`. Host/admin workstreams should avoid overlapping copy changes on the same Hebrew strings until Developer A merges this polish branch.

---

## Self-Review Notes

- **Spec coverage:** Maps foundation §9.5 vocabulary and §12.1 participant examples to consistent `ApplicationStatusPanel` + `StatusBadge` on the two canonical participant routes; no new lifecycle transitions or offer UX.
- **Fixture truth:** `P1`/`P4` assertions must match **actual** `event_registrations.status` for `E2E_EVENT_ID`; wrong assumptions create flaky tests—verify once against staging before locking literal short labels.
- **Open product questions:** (1) Should `footer` include both `offered_at` and `expires_at`, or only deadline? (2) For `attended` / `no_show`, should `/apply` redirect-style messaging match detail exactly—same helper branch? (3) If `expires_at` is null while `awaiting_response`, confirm desired Hebrew fallback (`לא צוין` vs softer copy).
- **Scope ambiguities flagged:** `ApplicationStatusPanel` implementation lives on the prerequisite branch—confirm `footer` renders as visible text for Playwright **before** writing brittle selectors; if the panel wraps footer in a non-text node, prefer `data-testid` only if already present (adding testids would require shared component changes — **forbidden**), so use user-visible Hebrew substrings instead.
- **Gap documentation:** If staging cannot produce `cancelled`/`rejected` for the shared event, Task 4 stops at documenting the missing seed rather than stubbing data.
