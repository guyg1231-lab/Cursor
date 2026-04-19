# Plan — Developer A Pass-3 Debt Sweep Follow-up (D4 + D5 + D6)

**Branch:** `dev-a/debt-sweep-followup` (stacked on `dev-a/debt-sweep-pass-2` → PR #7)
**Scope:** Execute the 3 design-decision debt items deferred in PR #7.
**Decisions recorded** (by orchestrator per user directive "proceed as you recommend"):

| Item | Option chosen | Rationale |
|------|---------------|-----------|
| D4 | (c) Won't-fix; document intent inline | Panel in apply competes with the form; shared header is over-engineering for ~20 lines of inline prose at 2 sites. Preserving Pass-2's intent is valuable; making that intent discoverable in code (not buried in handoff docs) is the productive move. |
| D5 | (a) Ship helper + migrate 1 test as POC | 5 staging-data-mutating tests; migrate all 5 at once = high blast-radius. POC approach ships the helper (gains the future de-duplication) while limiting risk. Remaining 4 migrations are a cheap follow-up PR once the helper is proven. |
| D6 | (a) Remove redundant footers; update test to assert a meaningful title | `formatApplicationStatusDetailed(attended/no_show/waitlist/pending)` already carries the meaning; the duplicated `כבר קיימת הגשה למפגש הזה.` footer adds no information. The polish-commit `396f26c` footer was test-driven, not UX-driven. Updating the test assertion to a more meaningful title (`המפגש כבר הסתיים` for P1-attended) is strictly better. |

**Spec anchors:** §6.2 participant scope, §9.5 vocabulary, §13 testing.

---

## Scope rules (same as PR #7)

- Do NOT touch `src/app/router/*`, `src/components/shared/*` (read-only), `features/applications/status.ts` (frozen), `api.ts` (frozen), `ApplicationStatusPanel.tsx` (prop API frozen), host/admin pages, `e2e/foundation-routes.spec.ts`, `e2e/slice-*.spec.ts`.
- `presentation.ts` IS Dev A-owned and in scope for D6.
- Playwright `e2e/` uses relative imports; no `@/` alias resolution.
- Typecheck: `npm run typecheck` (→ `tsc -b --noEmit`) or equivalently `npx tsc -b --noEmit`.

---

## D4 — Document intentional asymmetry at ApplyPage reapply branch

### Execution

Add a JSDoc-style comment block directly above the reapply-eligible rendering in `ApplyPage.tsx` (line ~588, the block `{existingApplication && canReapplyToEvent(existingApplication.status) ? ...}`).

The comment explains:
1. The reapply-eligible state on ApplyPage deliberately does NOT use `ApplicationStatusPanel` (which `EventDetailPage.tsx` does for the same state).
2. The rationale: ApplyPage also renders the actual application form below; a panel would visually compete with the form the user is filling in. Inline prose + `StatusBadge` is the chosen lighter treatment.
3. If symmetry is ever required, extract a shared `ReapplyHeader` component — don't adopt the full panel here.

Target placement: immediately before the first reapply branch (the prose paragraph at line ~588), as a single `/** … */` block.

### Verification

```bash
npx tsc -b --noEmit
grep -n "ReapplyHeader\|competes with the form" src/pages/apply/ApplyPage.tsx
```

Expected: typecheck clean; the grep returns the new comment lines (proves the comment exists).

### Commit

```bash
git add src/pages/apply/ApplyPage.tsx
git commit -m "docs(apply): document intentional reapply-branch asymmetry"
```

---

## D5 — `withFlippedRegistrationStatus` helper + migrate 1 test

### Execution

**Step 1:** Create a new helper file `e2e/fixtures/registrations.ts`:

```typescript
import type { createServiceRoleClient } from './supabase';

type AdminClient = ReturnType<typeof createServiceRoleClient>;

export type RegistrationPatch = {
  status?: string;
  expires_at?: string | null;
  offered_at?: string | null;
};

/**
 * Temporarily patches an event_registrations row, runs `body`, then restores
 * the snapshotted fields — with bulletproof teardown semantics:
 *   1. Always attempts restore in `finally`, even if body threw.
 *   2. If body threw, body's error takes precedence over restore errors.
 *   3. Restore errors are logged with a contextual prefix before re-throwing.
 *
 * Callers are responsible for their own browser-context lifecycle inside `body`.
 * Typical usage:
 *
 *   await withFlippedRegistrationStatus(
 *     admin,
 *     { userId: profile.id, eventId: ENV.EVENT_ID },
 *     { status: 'rejected' },
 *     async () => {
 *       const ctx = await browser.newContext();
 *       try {
 *         await authenticateAs(ctx, ENV.EMAILS.P1);
 *         const page = await ctx.newPage();
 *         // ... assertions ...
 *       } finally {
 *         try { await ctx.close(); } catch { /* swallow */ }
 *       }
 *     },
 *   );
 */
export async function withFlippedRegistrationStatus(
  admin: AdminClient,
  filter: { userId: string; eventId: string },
  patch: RegistrationPatch,
  body: () => Promise<void>,
): Promise<void> {
  const fields = Object.keys(patch);
  if (fields.length === 0) {
    throw new Error('withFlippedRegistrationStatus: patch must contain at least one field');
  }

  // Snapshot the fields we're about to overwrite so we can restore them later.
  const { data: snapshot, error: snapshotError } = await admin
    .from('event_registrations')
    .select(fields.join(','))
    .eq('event_id', filter.eventId)
    .eq('user_id', filter.userId)
    .maybeSingle();
  if (snapshotError) throw snapshotError;
  if (!snapshot) {
    throw new Error(
      `withFlippedRegistrationStatus: no event_registrations row for user=${filter.userId} event=${filter.eventId}`,
    );
  }

  const { error: patchError } = await admin
    .from('event_registrations')
    .update(patch)
    .eq('event_id', filter.eventId)
    .eq('user_id', filter.userId);
  if (patchError) throw patchError;

  let bodyError: unknown;
  try {
    await body();
  } catch (e) {
    bodyError = e;
  }

  // Always restore; body error (if any) takes precedence.
  try {
    const { error: restoreError } = await admin
      .from('event_registrations')
      .update(snapshot)
      .eq('event_id', filter.eventId)
      .eq('user_id', filter.userId);
    if (restoreError) throw restoreError;
  } catch (restoreError) {
    // eslint-disable-next-line no-console
    console.error(
      `withFlippedRegistrationStatus: failed to restore user=${filter.userId} event=${filter.eventId}`,
      restoreError,
    );
    if (!bodyError) throw restoreError;
  }

  if (bodyError) throw bodyError;
}
```

Notes for the implementer:
- `./supabase` exports `createServiceRoleClient` — use `ReturnType<typeof createServiceRoleClient>` so we don't add a dependency on `@supabase/supabase-js` type imports.
- Cast the `snapshot` object if TypeScript narrows `select(fields.join(','))` to `unknown`; use `as Record<string, unknown>` as needed. Keep strict typing where possible.

**Step 2:** Migrate the first test — `'StatusBadge: apply surface shows current application short label when reapply form visible'` (lines ~62-116 in `participant-foundation.spec.ts`). The migrated test should:

1. Look up P1's profile.id (unchanged).
2. Call `withFlippedRegistrationStatus` with `{ status: 'rejected' }` as the patch.
3. Inside the body callback, open browser context, authenticate, navigate, assert, then close context (with swallow pattern).
4. The helper handles the restore.

Full migrated test shape:

```typescript
test('StatusBadge: apply surface shows current application short label when reapply form visible', async ({
  browser,
}) => {
  const admin = createServiceRoleClient();
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id')
    .eq('email', ENV.EMAILS.P1)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile?.id) throw new Error('E2E missing P1 profile');

  await withFlippedRegistrationStatus(
    admin,
    { userId: profile.id, eventId: ENV.EVENT_ID },
    { status: 'rejected' },
    async () => {
      const ctx = await browser.newContext();
      try {
        await authenticateAs(ctx, ENV.EMAILS.P1);
        const page = await ctx.newPage();
        await page.goto(`/events/${ENV.EVENT_ID}/apply`);
        await expect(page.getByText('לא נבחר/ת הפעם', { exact: true })).toBeVisible();
      } finally {
        try {
          await ctx.close();
        } catch {
          // Ignore browser context close failures during teardown.
        }
      }
    },
  );
});
```

Import line added near the top of the file:

```typescript
import { withFlippedRegistrationStatus } from './fixtures/registrations';
```

**Step 3:** The other 4 tests (`cancelled participant...`, `P1 awaiting temporary offer...`, `confirmed participant...`, `confirmed sees confirmed status...`) remain UNCHANGED in this PR. They continue using the inline flip/restore pattern. The plan explicitly documents these as follow-up migrations.

### Verification

```bash
npx tsc -b --noEmit
npx playwright test e2e/participant-foundation.spec.ts --project=chromium -g "StatusBadge: apply surface"
npx playwright test e2e/participant-foundation.spec.ts --project=chromium
```

Expected:
- Typecheck exit 0.
- Single-test run: 1 passed.
- Full participant suite: 18 passed, 2 skipped (unchanged baseline).

### Commit

```bash
git add e2e/fixtures/registrations.ts e2e/participant-foundation.spec.ts
git commit -m "test(participant): extract withFlippedRegistrationStatus helper, migrate statusbadge test"
```

---

## D6 — Remove redundant footers in `presentation.ts` + update test regex

### Execution

**Step 1:** In `src/features/applications/presentation.ts`, remove the `footer: 'כבר קיימת הגשה למפגש הזה.'` line from 3 branches:

- `attended`/`no_show` branch (lines 52-57)
- `waitlist` branch (lines 60-65)
- `pending` branch (lines 68-73)

After removal, each branch returns only `{ title, body }`. The `footer` field becomes unused in these branches; its `footer?: string` optional declaration in `ApplicationPanelContent` stays (the two awaiting-participant-response branches at lines 21-34 still return footers — those carry real information: the deadline).

The default branch at the bottom (line 76-79) stays unchanged; it continues to return only `{ title, body }` where the title IS `'כבר קיימת הגשה למפגש הזה'`.

**Step 2:** Update the test regex at `e2e/participant-foundation.spec.ts:28` from:

```typescript
page.getByText(/צריך להשלים את הפרופיל|צריך להשלים את השאלון|המקום שלך במפגש נשמר|כבר קיימת הגשה/i),
```

to:

```typescript
page.getByText(/צריך להשלים את הפרופיל|צריך להשלים את השאלון|המקום שלך במפגש נשמר|המפגש כבר הסתיים|כבר קיימת הגשה/i),
```

**Rationale:** P1's staging status is `attended`, so the `presentation.ts` attended branch fires, rendering title `המפגש כבר הסתיים` + body `השתתפת במפגש`. The old regex matched only because the attended branch carried a redundant `כבר קיימת הגשה למפגש הזה.` footer. After removing that footer, we need the regex to accept the attended title. Keep the `כבר קיימת הגשה` alternative too — it still matches the default branch title (for unexpected status values) and doesn't weaken the assertion.

### Verification

```bash
npx tsc -b --noEmit
grep -c "כבר קיימת הגשה למפגש הזה" src/features/applications/presentation.ts
npx playwright test e2e/participant-foundation.spec.ts --project=chromium -g "authenticated participant sees a readiness message before applying when blocked"
npx playwright test e2e/participant-foundation.spec.ts --project=chromium
```

Expected:
- Typecheck exit 0.
- `grep -c` in `presentation.ts`: exactly `1` (only the default-branch title remains; 3 footer lines removed — count was 4, becomes 1).
- Targeted test: 1 passed.
- Full participant suite: 18 passed, 2 skipped.

### Commit

```bash
git add src/features/applications/presentation.ts e2e/participant-foundation.spec.ts
git commit -m "refactor(presentation): drop redundant footers on ended/waitlist/pending branches"
```

---

## Final verification (after all three commits)

```bash
cd social-matching-web
npx tsc -b --noEmit
npm run build
npx playwright test e2e/participant-foundation.spec.ts --project=chromium
```

Expected:
- TSC exit 0.
- Build successful (pre-existing chunk-size warning ignored).
- Participant suite: 18 passed, 2 skipped.

The pre-existing `slice-admin-review.spec.ts` failure remains out of scope — Plan #5 (next PR) handles that.

---

## What this plan explicitly excludes

- No changes to host/admin, router, shared primitives, or frozen contracts.
- No migration of the remaining 4 DB-flip tests to the new helper (follow-up PR).
- No changes to `EventSummaryCard`/events list (Plan #5 scope).
- No new i18n keys.
