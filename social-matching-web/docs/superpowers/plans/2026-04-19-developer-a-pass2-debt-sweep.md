# Plan — Developer A Pass-3 Debt Sweep (Plan #6)

**Branch:** `dev-a/debt-sweep-pass-2` (stacked on `dev-a/questionnaire-normalization`)
**Scope:** Pass-2 carry-over debt items D1-D6 from the 2026-04-19 handoff. Small, independent fixes bundled into one PR.
**Owner:** Developer A workstream.
**Spec anchors:** §6.2 participant scope, §9.5 vocabulary, §10.1 routes (landing/apply), testing hygiene §13.

---

## Scope rules (non-negotiable)

- **Forbidden to touch:** `src/app/router/routeManifest.ts`, `AppRouter.tsx`, `guards.tsx`, `src/components/shared/*` (read-only), `features/applications/status.ts`, `features/applications/api.ts`, `ApplicationStatusPanel.tsx` (prop API frozen), host/admin pages, `e2e/foundation-routes.spec.ts`, `e2e/slice-*.spec.ts`.
- **Hebrew-only rule:** all user-facing strings in production code must be Hebrew.
- **DB persisted values** in `matching_responses` and `event_registrations` must NOT change. Display labels can be localized without changing DB contents.
- **Playwright loader does not resolve `@/*` aliases in `e2e/`.** Use relative imports (`./fixtures/env`).

---

## Items executed in this PR

### D1 — Unify `whatYouBringLabels` with select options in `ApplyPage.tsx`

**Problem:**
- `src/pages/apply/ApplyPage.tsx:61-67` declares `whatYouBringLabels` with keys `{openness, curiosity, warmth, humor, listening}`.
- `src/pages/apply/ApplyPage.tsx:653-663` renders a `<select>` with `{openness, curiosity, good_energy, listening}`.
- Mismatch: a user who picks `good_energy` gets the raw English key in the prior-answers summary (labels map doesn't contain `good_energy`). `warmth`+`humor` in labels are dead code (select doesn't offer them).

**Fix:** Extract a module-scoped constant `WHAT_YOU_BRING_OPTIONS: readonly { value: string; label: string }[]` near the top of `ApplyPage.tsx`. Derive both the `<select>` options and the summary label map from it. Source of truth = the select (what users can actually pick).

Final values (align with existing Hebrew in the select):

```typescript
const WHAT_YOU_BRING_OPTIONS = [
  { value: 'openness', label: 'פתיחות' },
  { value: 'curiosity', label: 'סקרנות' },
  { value: 'good_energy', label: 'אנרגיה טובה' },
  { value: 'listening', label: 'הקשבה ונוכחות' },
] as const;

const WHAT_YOU_BRING_LABELS: Record<string, string> = Object.fromEntries(
  WHAT_YOU_BRING_OPTIONS.map((opt) => [opt.value, opt.label]),
);
```

In the summary component, use `WHAT_YOU_BRING_LABELS[answers.what_you_bring] ?? answers.what_you_bring` (fallback preserves raw value if legacy data has unexpected key).

In the form, render: `{WHAT_YOU_BRING_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}`.

**Verification gate:**
- `npx tsc -b --noEmit` — passes.
- Manual: pick each of the 4 options in the form; after submit, the submitted-answers summary renders the Hebrew label (not the English key).
- `grep -n "warmth\\|humor" src/pages/apply/ApplyPage.tsx` — returns no matches (dead code removed).

**Commit:** `fix(apply): unify what-you-bring labels with select options`

---

### D2 — Translate `LandingPage` eyebrow to Hebrew

**Problem:** `src/pages/landing/LandingPage.tsx:18` renders `<p className={tokens.typography.eyebrow}>Curated social matching</p>` directly above a Hebrew `CardTitle`. Violates the Hebrew-only rule (handoff note #6).

**Fix:** Replace `'Curated social matching'` with `'מפגשים מאוצרים'` (Hebrew for "curated gatherings"; short, eyebrow-appropriate, consistent with the page's tone).

**Verification gate:**
- `npx tsc -b --noEmit` — passes.
- `grep -n "Curated" src/pages/landing/LandingPage.tsx` — no matches.
- `grep -n "מפגשים מאוצרים" src/pages/landing/LandingPage.tsx` — exactly 1 match.
- `participant-foundation.spec.ts` — `landing page primary CTAs link to events and questionnaire` still passes (the test asserts CTAs by role, not the eyebrow).

**Commit:** `fix(landing): translate eyebrow to hebrew`

---

### D3 — Drop English token from auth-callback test regex

**Problem:** `e2e/participant-foundation.spec.ts:372-377` asserts `/loading|טוענים|מאמתים/i`. The actual production text in `AuthCallbackPage.tsx:35` is `מאמתים את הסשן ומכינים את ההמשך...` — so only `מאמתים` ever matches. The `loading` alternative is dead code and tolerates English regression.

**Fix:** Tighten regex to `/מאמתים/` (single-source; matches exactly the production string). Keep case-sensitive (no `/i` flag) — the Hebrew is case-less anyway.

**Verification gate:**
- Targeted test: `npx playwright test e2e/participant-foundation.spec.ts --project=chromium -g "auth callback keeps"` — passes.
- Full participant suite: `npx playwright test e2e/participant-foundation.spec.ts --project=chromium` — 18 passed + 2 skipped (unchanged from Plan #4).

**Commit:** `test(auth-callback): assert on hebrew-only loading text`

---

## Items deferred for user decision

### D4 — Reapply-eligible asymmetry (ApplyPage vs EventDetailPage) — DEFERRED

**Problem:** `ApplyPage.tsx:~585-614` renders inline prose + `StatusBadge` (no `ApplicationStatusPanel`) on the reapply-eligible branch; `EventDetailPage.tsx:~166-175` renders `ApplicationStatusPanel` via helper on the same state.

**Why deferred:** Pass-2 Plan #2 explicitly chose this asymmetry as a "deliberate scope defer" — the rationale was that `ApplyPage` also shows the actual form below the reapply summary, so adding the panel would compete visually with the form. The handoff calls it a non-blocking follow-up.

**Decision needed:** Product intent for the reapply-eligible surface.
- **Option (a):** Add `ApplicationStatusPanel` to `ApplyPage` reapply branch (symmetry; possible visual competition with the form).
- **Option (b):** Extract a shared `ReapplyHeader` component rendering the StatusBadge + prose (both pages use it, panel stays out of apply).
- **Option (c):** Leave as-is; update the PR follow-ups list to mark as "won't-fix (intentional asymmetry)".

Awaiting choice before execution.

---

### D5 — Extract `withFlippedRegistrationStatus(admin, ids, patch, fn)` helper — DEFERRED

**Problem:** 5 tests in `participant-foundation.spec.ts` (lines ~65-110, ~119-162, ~175-230, ~243-300, ~310-358) duplicate the pattern `{ select current row → update via admin → run body → finally: close ctx + restore row }`. Each duplicated block is ~40-50 lines.

**Why deferred:** Pure refactor touching 5 tests that mutate staging data. Each test already ships with bulletproof teardown (commit `94004e8` pattern). Migrating all 5 simultaneously during an unattended session is high-risk:
- A subtle bug in the helper (e.g. swallowing a restore error) could strand P1's staging data across runs.
- Any regression would be a PR-blocking failure on the single e2e file that defines the test contract.

**Decision needed:** Migration strategy.
- **Option (a):** Ship helper + migrate 1 test as proof-of-concept; migrate remaining 4 in a separate follow-up PR (lowest risk).
- **Option (b):** Ship helper + migrate all 5 in one PR (cleanest outcome, highest risk).
- **Option (c):** Defer indefinitely — the duplication is tolerable given how rarely these tests change.

Suggested signature to review:

```typescript
// e2e/fixtures/registrations.ts
export async function withFlippedRegistrationStatus(
  admin: SupabaseClient,
  filter: { userId: string; eventId: string },
  patch: Record<string, unknown>,
  body: () => Promise<void>,
): Promise<void>;
```

Awaiting choice before execution.

---

### D6 — `presentation.ts` footer redundancy — DEFERRED

**Problem:** `src/features/applications/presentation.ts:~52-73` has the footer `כבר קיימת הגשה למפגש הזה.` duplicated across the `attended`/`no_show`/`waitlist`/`pending` branches (added in commit `396f26c` to keep a specific test green without changing it).

**Why deferred:** The handoff flags this as a design-choice fix — "remove footer (title+body carry the meaning) OR swap for status-specific copy." Both options are valid; they produce different UX. Need product intent.

**Decision needed:** Footer direction.
- **Option (a):** Remove footer from all 4 branches (title+body carry the meaning; minimal UI). Risk: may fail whatever test relied on the footer string.
- **Option (b):** Keep a footer per branch but make it status-specific (e.g. `attended`: `כבר נרשמת והשתתפת.`; `no_show`: `הרישום הסתיים ללא השתתפות.`; etc.) — richer UX, more Hebrew strings to own.
- **Option (c):** Leave as-is; mark "won't-fix" since polish commit `396f26c` rationale (test preservation) still holds.

Awaiting choice before execution.

---

## Verification (full pass, after D1+D2+D3 commits)

```bash
cd social-matching-web
npx tsc -b --noEmit
npm run build
npx playwright test e2e/participant-foundation.spec.ts --project=chromium
```

**Expected:**
- Typecheck: exit 0.
- Build: clean (pre-existing 596 kB chunk-size warning ignored).
- Participant-foundation suite: 18 passed, 2 skipped (unchanged from Plan #4 baseline).

The `slice-admin-review.spec.ts` pre-existing failure (documented in PR #5 + PR #6) is NOT in scope for this plan — it's Plan #5's target.

---

## Developer B coordination — do not touch

Dev B should avoid these paths during this PR window:

- `src/pages/apply/ApplyPage.tsx` (D1)
- `src/pages/landing/LandingPage.tsx` (D2)
- `e2e/participant-foundation.spec.ts` (D3)

---

## What this plan explicitly excludes

- No changes to any file listed in "Scope rules" forbidden set.
- No refactor of D4/D5/D6 (deferred for user decision).
- No interaction with Plan #5 scope (EventSummaryCard description preview + slice-admin-review).
- No new i18n keys (all D1-D3 Hebrew strings are inline).
- No new shared primitives.
