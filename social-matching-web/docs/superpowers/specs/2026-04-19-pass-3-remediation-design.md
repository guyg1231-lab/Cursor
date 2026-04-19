# Pass-3 Remediation — Design Spec

**Date:** 2026-04-19  
**Owner:** Dev A  
**Status:** **Completed (merged to `main`, 2026-04)** — this document is the **approved design record** for the remediation that ran SP-A→E→B→D→C.  
**Scope:** Close out audit findings from the "everything fully perfect and optimal?" review after Pass-3 completion.

> **Aftercare:** Current Dev A maintenance / Dev B handoff is tracked in `docs/superpowers/plans/2026-04-21-dev-a-remaining-work-audit-and-plan.md`. Playwright on `chromium`: **30** tests in **5** files as of merge.

---

## 1. Context

**Historical baseline (audit day):** Pass-3 had closed with 10 merged PRs, 26 passing Playwright tests, zero `test.skip`, and a declared "Dev A is done." A five-agent read-only audit dispatched afterward surfaced ~28 issues across five categories: doc inaccuracies, user-facing UX bugs, consistency gaps, test hygiene debt, and unreported foundation issues.

**Outcome:** The remediation defined in §4–§7 was **implemented and merged** (through SP-C plus follow-ups). The suite grew to **30** passing Chromium tests (SP-B/C/D additions). Foundation tickets **F-3…F-9** were filed (see `docs/foundation-tickets/README.md`).

This spec remains the authoritative **design** for that remediation. For **execution** detail and forensic checklists, see `docs/superpowers/plans/2026-04-19-pass-3-remediation-implementation.md` (banner at top marks it historical).

## 2. Goals

1. Zero known factual inaccuracies in Dev B's onboarding documentation.
2. Zero English tokens leaking into Hebrew participant UI.
3. Zero known UX defects in participant-facing surfaces (`AuthPage`, `GatheringPage`).
4. Test suite that catches the regressions it claims to catch (no overclaiming names, no leaked contexts, no fragile selectors).
5. Foundation has a complete, evidence-backed picture of all cross-workstream debt discovered in the audit (F-3 through F-9 on top of the existing F-1 and F-2).
6. Participant-facing components use the shared state primitives consistently (`RouteErrorState`, `EventNotFound`, `presentation.ts`).

## 3. Non-goals

Explicitly out of scope:

1. Any work inside `src/app/router/**`, `src/components/shared/**`, `src/components/ui/**`, `src/features/applications/status.ts` — Foundation-owned.
2. Any change to `src/components/shared/RouteState.tsx` — F-1 is open.
3. Any change to `/questionnaire` guard semantics — F-2 is open.
4. `example.com` email blocklist / validation rules — product decision.
5. Host- or admin-side product work — Dev B's scope.
6. ~~Fixing `npm run typecheck`~~ — **Done separately (2026-04-21):** root `package.json` `typecheck` script now runs `tsc -b --noEmit` (was a no-op when this spec was written).
7. New Playwright fixtures or disposable test users — route-interception pattern (established in PR #13) is sufficient.
8. Design-system changes (tokens, colors, typography).
9. Performance work.
10. Supabase schema / RLS changes.

Deferred to separate followup tickets (not this spec): accessibility audit, mobile RTL review, Sentry error-mapping for Hebrew copy, broader `/auth` edge-case E2E coverage.

## 4. Architecture

### 4.1 Decomposition into five sub-projects

Each sub-project is an independently shippable PR branched off `main`. No stacked dependencies.

| ID   | Sub-project                    | Changes              | TDD applies        | Size   |
|------|--------------------------------|----------------------|--------------------|--------|
| SP-A | Doc accuracy                   | Docs only            | No                 | Tiny   |
| SP-E | Foundation tickets F-3…F-9     | Docs only            | No                 | Small  |
| SP-B | Participant UX bugs            | `src/pages/**`       | Yes (E2E RED→GREEN)| Small  |
| SP-D | Test hygiene                   | `e2e/**`             | Yes (assertion-first) | Small |
| SP-C | Participant consistency polish | `src/pages/**`, `src/features/**` | Yes (regression tests before migration) | Medium |

### 4.2 Branching strategy

All five branches cut from `main` at branch-creation time. No branch depends on another branch's commits. This avoids the PR #3 auto-close cascade observed during the Pass-3 stack merge.

```
main ─┬─ dev-a/remediation-sp-a-docs
      ├─ dev-a/remediation-sp-e-foundation-tickets
      ├─ dev-a/remediation-sp-b-ux-bugs
      ├─ dev-a/remediation-sp-d-test-hygiene
      └─ dev-a/remediation-sp-c-consistency
```

### 4.3 Merge order

`SP-A → SP-E → SP-B → SP-D → SP-C`. Rationale:

- Docs first (A, E): zero production risk, unblocks Dev B immediately.
- Bugs next (B): real user-visible defects.
- Test hygiene before polish (D before C): so SP-C's refactors merge against a test suite that actually catches regressions.
- Polish last (C): largest diff, lowest individual risk once B and D land.

Before merging PR N, rebase all still-open branches onto new `main` tip locally and `--force-with-lease` push.

### 4.4 Execution model

Sequential execution by the orchestrator. **Read-only subagents** are used for: post-PR audit sweeps, pre-merge evidence verification, grep confirmations. Not used for implementation (too much shared state and TDD discipline needed to split across agents).

## 5. Sub-project specifications

### 5.1 SP-A — Doc accuracy

**Files modified:**
- `docs/superpowers/plans/2026-04-20-developer-b-kickoff.md`
- `docs/foundation-tickets/2026-04-20-01-routeloadingstate-body-prop.md`
- Any doc that references `npm run typecheck` as if it works.

**Known falsehoods to correct:**

1. Wrong route paths in kickoff (cross-reference every path against `AppRouter.tsx`).
2. Stale Playwright test count (says ~24, actual is 26 per `001c6ca`).
3. Claim that `RouteLoadingState` is i18n-ready (it hardcodes English; F-1 is open).
4. Claim that `/landing` is a distinct route (`/landing` is mapped to `/` in `AppRouter.tsx`).
5. F-1 ticket's "only inline state card" claim is inaccurate (there are other inline states; F-1 is about `RouteLoadingState`'s API, not scope).
6. `npm run typecheck` is a no-op; every reference must be removed or annotated with a pointer to `npx tsc -b --noEmit`.

**Verification:** read-only subagent cross-references all claims against code and confirms zero remaining inaccuracies.

**TDD:** not applicable (docs only).

### 5.2 SP-E — Foundation tickets F-3 through F-9

**Files created** (under `docs/foundation-tickets/`):

| ID  | Filename                                                  | Severity | Summary                                                                         |
|-----|-----------------------------------------------------------|----------|---------------------------------------------------------------------------------|
| F-3 | `2026-04-20-03-routemanifest-phantom-host-settings.md`    | High     | `routeManifest.ts` declares `/host/settings` but `AppRouter.tsx` has no route.  |
| F-4 | `2026-04-20-04-guards-hardcoded-english-loading.md`       | High     | `ProtectedRoute` / `AdminRoute` render hardcoded English "Loading…".            |
| F-5 | `2026-04-20-05-adminroute-redirect-inconsistency.md`      | High     | `AdminRoute` denies silently; `ProtectedRoute` redirects. Inconsistent UX.      |
| F-6 | `2026-04-20-06-statusbadge-tone-model.md`                 | Medium   | `StatusBadge` supports only `default` / `muted`; no success/warning/danger.     |
| F-7 | `2026-04-20-07-placeholderpanel-english-enum.md`          | Medium   | `PlaceholderPanel` shows raw English `contractState` tokens in badge labels.    |
| F-8 | `2026-04-20-08-appheader-mixed-i18n.md`                   | Medium   | Some strings hardcoded Hebrew, others via `t(...)`. Mixed localization path.    |
| F-9 | `2026-04-20-09-missing-ui-primitives-link-badge.md`       | Low      | `src/components/ui/` has `Card` and `Button` but no `Link` / `Badge`.           |

**Files modified:**
- `docs/foundation-tickets/README.md` — index F-3 through F-9.

**Ticket structure (mandatory per ticket):**
- Problem (what's broken and what surface it affects)
- Evidence (exact `path:line` references, copy-pasted offending snippet)
- Proposed fix (concrete API change or behavior)
- Acceptance criteria (checklist)
- Owner: Foundation
- Priority

**Verification:** subagent re-reads each ticket against the cited lines and confirms evidence accuracy.

**TDD:** not applicable (docs only).

### 5.3 SP-B — Participant UX bugs

Three defects, three RED→GREEN cycles.

#### Bug 1 — `GatheringPage` English enum leak

`GatheringPage.tsx` renders raw `registration_status` token when the status is `waitlist | cancelled | no_show` (no Hebrew label mapped).

- **RED:** new E2E in `e2e/participant-foundation.spec.ts` using `withFlippedRegistrationStatus` to set status to `waitlist`. Asserts rendered text matches expected Hebrew and does **not** match `/waitlist|cancelled|no_show/i`.
- **GREEN:** add Hebrew label map for the three enums in `GatheringPage.tsx`. If the same enum is rendered elsewhere (grep first), extract into a shared `registrationStatusLabels.ts` helper.
- **REFACTOR:** extract helper if reused.

#### Bug 2 — `AuthPage` duplicate error messages

OTP failure renders both an inline form error and a `RouteErrorState` banner with a misleading generic title.

- **RED:** E2E submits known-bad OTP. Asserts exactly one error region (`getByRole('alert')` count === 1). Asserts surviving copy is OTP-specific Hebrew, not the generic route-error title.
- **GREEN:** remove the `RouteErrorState` wrapper for OTP-step errors (OTP is a form-submit error, not a route-load error). Keep inline form error.
- **REFACTOR:** if a shared "form error" primitive emerges, extract — but only if needed by multiple callers.

#### Bug 3 — `AuthPage` misleading OTP error title

Covered by Bug 2's fix; verified by the same RED test.

**Verification:**
- Subagent confirms the three RED tests fail on `main` before the fix and pass on the branch.
- Full Playwright suite green.
- Manual staging smoke + native-speaker Hebrew-copy pass by the user before merge.

**TDD:** required per bug.

### 5.4 SP-D — Test hygiene

Tests are the change; TDD applies by demonstrating the failure mode each fix addresses.

**Changes:**

1. Add `try { … } finally { await ctx.close() }` to the ~10 tests currently missing it in `e2e/participant-foundation.spec.ts` and the `e2e/slice-*.spec.ts` files Dev A is authorized to touch.
2. Replace `page.getByRole('button').nth(N)` fragility in PR #13's questionnaire workflow test with name-based selectors keyed on Hebrew chip labels.
3. Tighten the 4 previously-flagged overclaiming test names by either (a) adding the missing assertion or (b) renaming to match weaker coverage.

**Verification:**
- Subagent greps `e2e/` for `browser.newContext` occurrences without matching `finally { await ctx.close()` — expects zero hits.
- Subagent greps the questionnaire test for `.nth(` — expects zero hits.
- Full Playwright suite green three consecutive runs (surface flakiness). Any failure → investigate, do not retry-to-pass.

**TDD:** assertion-first for the name-tightening items; problem-demonstration-first for the `ctx.close()` items.

### 5.5 SP-C — Participant consistency polish

Biggest diff, lowest risk if D lands first. Four workstreams:

#### 1. Extract shared `EventNotFound` component

The "event not found" block appears in 3 places with near-identical copy.

- **RED:** component-level Vitest asserting Hebrew copy + CTA rendering for the new `EventNotFound` component.
- **GREEN:** create `EventNotFound` as a thin wrapper that *imports and consumes* the Foundation-owned `RouteNotFoundState` primitive with event-specific Hebrew copy and a CTA targeting `/events`. No modification to `RouteNotFoundState` itself (Foundation-owned per §3).
- **REFACTOR:** migrate the 3 call sites to import `EventNotFound`; existing E2E must stay green.

#### 2. Migrate `ApplicationLifecycleList` to `presentation.ts`

- **RED:** unit test asserting the list renders the same visual contract (title, subtitle, status badge) as `presentation.ts` produces for a fixture input.
- **GREEN:** rewire `ApplicationLifecycleList` to consume `presentation.ts`.
- **REFACTOR:** delete inline lifecycle rendering.

#### 3. English-string sweep in Hebrew UI

- `LandingPage`: "Circles" → Hebrew equivalent.
- `AuthPage`: "apply" and any English placeholders → Hebrew.
- Any other English token found during the subagent grep across `src/pages/**` and `src/features/**`.

- **RED (per page):** E2E asserts the page body does not contain the specific English token.
- **GREEN:** replace with Hebrew equivalent (included in PR description as a Before → After table for native-speaker review).

#### 4. Normalize `ApplyPage` / `DashboardPage` error states

Both pages currently mix inline error renderings with `RouteErrorState` usage elsewhere.

- **RED:** E2E forces error state on each page, asserts `RouteErrorState` role / structure is rendered.
- **GREEN:** replace inline error cards with `RouteErrorState`.

**Verification:**
- Subagent greps for remaining English tokens in `src/pages/**` / `src/features/**`; allowlist only comments, route paths, and explicitly-allowlisted components.
- Subagent confirms zero duplicated "event not found" blocks.
- Full Playwright suite green at every commit on the branch.
- Pre-merge staging smoke + Hebrew-copy review by user.

**TDD:** required; regression tests land **before** each migration.

## 6. Acceptance criteria

### 6.1 Per-sub-project

**SP-A — Doc accuracy:**
- Every route path mentioned in `dev-b-kickoff.md` matches `AppRouter.tsx`.
- Playwright test count matches `npx playwright test --list | tail -1`.
- No doc claims `RouteLoadingState` is i18n-ready.
- No doc claims `/landing` is a distinct route.
- F-1 ticket no longer contains the "only inline state card" claim.
- Every `npm run typecheck` reference is removed or annotated as a no-op.

**SP-E — Foundation tickets:**
- Seven new ticket files exist at agreed paths.
- Each ticket contains: Problem, Evidence (`path:line`), Proposed fix, Acceptance criteria, Owner, Priority.
- `docs/foundation-tickets/README.md` indexes F-3 … F-9.
- Subagent verifies each ticket's evidence against actual code lines.

**SP-B — UX bugs:**
- Three RED tests exist; each failed on `main` before fix.
- `GatheringPage` renders only Hebrew for `waitlist | cancelled | no_show` (grep: zero English enum tokens).
- `AuthPage` OTP failure renders exactly one error region with OTP-specific Hebrew copy.
- Full Playwright suite green; no new `test.skip`.
- Native-speaker Hebrew-copy review completed by user before merge.

**SP-D — Test hygiene:**
- Zero `browser.newContext` calls in `e2e/` without matching `finally { await ctx.close() }`.
- Zero `.nth(` uses in the questionnaire workflow test.
- Each flagged test name either matches its assertions or was tightened to add the missing assertion.
- Full suite green, three consecutive parallel-mode runs.

**SP-C — Consistency polish:**
- `EventNotFound` exists and is imported at all 3 call sites; zero duplicated blocks.
- `ApplicationLifecycleList` uses `presentation.ts`; zero inline lifecycle rendering.
- Zero English tokens in Hebrew participant UI (outside allowlist: comments, route paths, allowlisted components).
- `ApplyPage` / `DashboardPage` use `RouteErrorState` for errors; zero inline error cards.
- Component tests (Vitest) for `EventNotFound` and `ApplicationLifecycleList` migration pass.
- Full Playwright suite green at every commit on the branch.
- Staging smoke + native-speaker Hebrew review completed by user before merge.

### 6.2 Cross-cutting (every PR)

- `npm run lint` clean.
- `npx tsc -b --noEmit` clean.
- `npx playwright test` green (full suite).
- PR description includes: what changed, why, verification steps, known followups.
- Rebase-merge onto `main`, delete branch, confirm `git status` clean.

### 6.3 Spec-level "done"

All five PRs merged **and** a final subagent audit confirms:
- Zero English tokens in Hebrew participant UI (outside allowlist).
- Zero `ctx.close()` gaps in `e2e/`.
- Zero duplicated "event not found" blocks.
- Seven foundation tickets exist with accurate evidence.
- Zero known inaccuracies in the Dev B kickoff doc.

## 7. Risks and mitigations

| # | Risk                                                          | Likelihood | Impact | Mitigation                                                                                               |
|---|---------------------------------------------------------------|------------|--------|----------------------------------------------------------------------------------------------------------|
| 1 | Stacked-PR cascade failure (PR #3 auto-close repeat)          | Low        | High   | All branches off `main`; no stacked dependencies; rebase + `--force-with-lease` before each subsequent merge. |
| 2 | SP-C merge conflicts with SP-B / SP-D                         | Medium     | Low    | Merge order B→D→C; SP-C rebases onto post-B-D `main`; non-trivial conflicts halt execution for user review. |
| 3 | Hebrew-copy regressions grep cannot catch                     | Medium     | Medium | PR descriptions include Before→After string tables; native-speaker (user) review required for B and C.    |
| 4 | Refactor breaks rendering path not covered by existing tests  | Medium     | Medium | Component tests land before migration; staging smoke before PR opens; E2E runs against each call site.    |
| 5 | E2E flakiness masking real regressions                        | Low-Medium | Medium | 3 consecutive green runs required; flaky tests get quarantined + foundation ticket, never retry-to-pass.  |
| 6 | Subagent audits produce false-confidence all-clear            | Medium     | Low-Med| Subagents return raw evidence not summary; orchestrator verifies random 3-item sample per report.         |
| 7 | Scope creep ("perfect" keeps expanding)                       | High       | Medium | Section 3 non-goals are hard boundaries; new findings → new ticket or deferred list, not in-scope growth. |
| 8 | Hidden coupling between polish and user-facing behavior       | Low        | Medium | RED tests assert visible contract before refactor; staging smoke before PR.                               |

Rollback: per-PR rollback is a standard `git revert <sha>` one-liner; no per-PR boilerplate required.

## 8. Open questions

None at spec-approval time. All architectural decisions are resolved. Any questions that arise during implementation are brought to the user explicitly rather than silently absorbed.

## 9. Next step

Invoke the writing-plans skill to produce an implementation plan with concrete TDD cycles per sub-project, each cycle's expected RED failure message, and the exact subagent prompts used for verification.

---

*Spec approved by user on 2026-04-19 after section-by-section review of architecture, per-sub-project approach, acceptance criteria, risks, and non-goals.*
