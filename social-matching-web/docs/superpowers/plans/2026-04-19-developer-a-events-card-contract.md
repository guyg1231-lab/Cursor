# Plan #5 — `/events` card contract + slice-admin-review fix

**Branch:** `dev-a/events-card-contract` (stacked on `dev-a/debt-sweep-followup` → PR #8)
**Goal:** Close the `/events` discovery surface per spec §10.1 ("minimal event card/list contract") and fix the pre-existing `slice-admin-review.spec.ts` failure that traces back to Pass-1's `EventSummaryCard`.

---

## Context

`slice-admin-review.spec.ts` (Step 4, lines 136-146) asserts that `/events` shows a truncated description preview:

```typescript
const previewPrefix = longDescription.slice(0, 40);
// ...
await page.goto('/events');
await expect(page.getByText(previewPrefix, { exact: false })).toBeVisible();
await expect(page.getByText(longDescription, { exact: true })).toHaveCount(0);
```

`EventSummaryCard` currently renders only title/city/starts_at. Users see no description preview, and the slice test fails.

Per spec §10.1 ("expose enough state that users understand whether [this event is right for them]"), the card should surface a brief description preview — it's the most useful discovery signal after title.

## Scope rules

Same as PR #7/#8:
- Do NOT touch `src/app/router/*`, `src/components/shared/*` (read-only), `features/applications/status.ts`, `api.ts`, `ApplicationStatusPanel.tsx`, host/admin pages, `e2e/foundation-routes.spec.ts`, `e2e/slice-*.spec.ts` (BUT we verify the slice test passes — no modification to it).
- `features/events/components/EventSummaryCard.tsx` IS Dev A-owned.
- `pages/events/EventsPage.tsx` IS Dev A-owned.

Typecheck: `npx tsc -b --noEmit` (not `npm run typecheck`).

---

## Task P5-1 — Truncated description preview on `EventSummaryCard`

### Critical constraint — JS slice, not CSS line-clamp

The slice test asserts `expect(page.getByText(longDescription, { exact: true })).toHaveCount(0)`. Playwright's `getByText` looks at DOM text content, not visually-rendered text. A CSS solution like `line-clamp-2` leaves the full string in the DOM and would fail this assertion. Implementation MUST truncate at the string level before rendering.

### Execution

In `src/features/events/components/EventSummaryCard.tsx`:

1. Add a module-scoped constant for the preview length:

```typescript
const DESCRIPTION_PREVIEW_MAX_LENGTH = 120;
```

2. Add a truncation helper (module-scoped, not exported):

```typescript
function truncateForPreview(input: string, max: number): string {
  if (input.length <= max) return input;
  return `${input.slice(0, max).trimEnd()}…`;
}
```

3. Render a description preview line between `city` and `starts_at` — or after `starts_at`, whichever reads more naturally in Hebrew. Recommended placement: BETWEEN the two `<p>` lines. Render ONLY when `event.description` is a non-empty string (defensive):

```tsx
{event.description && event.description.trim().length > 0 ? (
  <p className="text-foreground/75 leading-relaxed">
    {truncateForPreview(event.description, DESCRIPTION_PREVIEW_MAX_LENGTH)}
  </p>
) : null}
```

### Why 120 chars

- The slice test's `longDescription` is 152 chars; `previewPrefix = longDescription.slice(0, 40)`.
- A 120-char preview contains the first 40 chars (assertion passes) and does NOT contain the full 152-char string (second assertion passes).
- 120 chars is ~2 dense lines on a card — readable at a glance without dominating the card.
- Buffer: if descriptions grow past 152 chars, any slice threshold in `(40, fullLength)` works. 120 is a comfortable middle.

### Verification

```bash
npx tsc -b --noEmit
npx playwright test e2e/slice-admin-review.spec.ts --project=chromium
```

Expected:
- Typecheck exit 0.
- `slice-admin-review.spec.ts`: 1 passed (the previously failing test).

### Commit

```bash
git add src/features/events/components/EventSummaryCard.tsx
git commit -m "feat(events): add truncated description preview to summary card"
```

---

## Task P5-2 — Normalize `/events` empty + error states to shared primitives

### Context

`pages/events/EventsPage.tsx` currently renders three states with generic `<Card>` + `<CardContent>`:
- Loading: `'טוענים מפגשים...'`
- Error: `<CardContent className="...text-destructive">{error}</CardContent>`
- Empty: `'אין כרגע מפגשים פתוחים'`

Shared primitives `RouteEmptyState` and `RouteErrorState` (from `@/components/shared/RouteState`) give consistent styling with dashboard/apply/detail pages. Both take `{ title, body, tone? }`.

### NOT normalizing the loading state — why

`RouteLoadingState` has a hardcoded English body (`'Please wait while this page loads.'`) that CANNOT be customized through the current prop API. Using it in this Hebrew-only app would leak English. `src/components/shared/*` is off-limits for Dev A to patch. Leaving the loading state inline until foundation extends `RouteLoadingState` with a `body` prop.

This asymmetry (empty+error normalized, loading inline) will be documented as a non-blocking follow-up on the PR.

### Execution

In `src/pages/events/EventsPage.tsx`:

1. Import `RouteEmptyState`, `RouteErrorState`:

```typescript
import { RouteEmptyState, RouteErrorState } from '@/components/shared/RouteState';
```

2. Replace the error block:

```tsx
) : error ? (
  <Card className={tokens.card.surface}>
    <CardContent className="py-10 text-sm text-destructive">{error}</CardContent>
  </Card>
) : events.length === 0 ? (
```

with:

```tsx
) : error ? (
  <RouteErrorState title="שגיאת טעינה" body={error} />
) : events.length === 0 ? (
```

3. Replace the empty block:

```tsx
) : events.length === 0 ? (
  <Card className={tokens.card.surface}>
    <CardContent className="py-10 text-sm text-muted-foreground">אין כרגע מפגשים פתוחים</CardContent>
  </Card>
) : (
```

with:

```tsx
) : events.length === 0 ? (
  <RouteEmptyState
    title="אין כרגע מפגשים פתוחים"
    body="ברגע שיתפרסמו מפגשים חדשים, הם יופיעו כאן."
  />
) : (
```

4. The loading state (with `'טוענים מפגשים...'`) stays as an inline `<Card>` exactly as it is now — NO change.

5. Clean up: after the change, `Card` and `CardContent` imports are still used by the inline loading state, so keep them.

### Verification

```bash
npx tsc -b --noEmit
npx playwright test e2e/participant-foundation.spec.ts --project=chromium
```

Expected:
- Typecheck exit 0.
- Participant suite: 18 passed, 2 skipped (the `discovery links into canonical event detail` test at line 7-16 navigates to `/events` but doesn't assert on the empty/error state; should still pass).

### Commit

```bash
git add src/pages/events/EventsPage.tsx
git commit -m "refactor(events): normalize /events empty and error states to shared primitives"
```

---

## Final verification (after both commits)

```bash
cd social-matching-web
npx tsc -b --noEmit
npm run build
npx playwright test --project=chromium
```

Expected:
- TSC exit 0.
- Build success.
- **Full suite**: 22/22 passed (was 21/22 — the pre-existing `slice-admin-review` failure is now fixed by P5-1).

This is the first time in the Dev A Pass-3 sequence that the full Playwright suite is expected to be fully green.

---

## What's explicitly excluded from this plan

- No changes to `src/components/shared/RouteState.tsx` (foundation-owned; the English body on `RouteLoadingState` is flagged as a non-blocking follow-up).
- No changes to `EventDetailPage.tsx` (description already shown there; card preview is additive, not replacing detail).
- No filters, search, sorting, categories, participant counts, or host names on `/events` — intentionally per the `EventsPage` comment block.
- No normalization of the loading state (blocked on foundation change).
- No modifications to `e2e/slice-admin-review.spec.ts` (it was correct; `EventSummaryCard` was wrong).

## Non-blocking follow-ups for the PR body

- Foundation ticket: extend `RouteLoadingState` to accept an optional `body` prop (or default Hebrew body) so it can be used consistently across Dev A-owned routes.
- Migrate the remaining 4 DB-flip tests in `participant-foundation.spec.ts` to `withFlippedRegistrationStatus` (from PR #8).

## Why this plan is the last in the Pass-3 sequence

After this PR lands:
- Spec §10.1 participant route table is fully covered (landing, events, events/:id, events/:id/apply, dashboard, questionnaire, gathering).
- Spec §8.3 (Functional Placeholder definition) is satisfied on every participant route.
- The single pre-existing red test flips to green.
- All Pass-2 debt items have either shipped (D1/D2/D3/D6), shipped partially with documented follow-ups (D5), or been explicitly closed as won't-fix with inline documentation (D4).

The Pass-3 goal as defined in the 2026-04-19 handoff is met.
