# Developer A — Remaining Work: Full Audit & Plan to Proceed

**Created:** 2026-04-21  
**Audience:** Developer A (participant surface), orchestrators, product  
**Status:** Active handoff — Pass-3 remediation stack is merged to `main`  
**Related:** `docs/superpowers/specs/2026-04-19-pass-3-remediation-design.md`, `docs/superpowers/plans/2026-04-19-pass-3-remediation-implementation.md`, `docs/superpowers/plans/2026-04-20-developer-b-kickoff.md`

---

## 1. Executive summary

Pass-3 remediation **SP-A → SP-E → SP-B → SP-D → SP-C** is **complete and merged**, plus a small follow-up (**host capacity validation** no longer embeds the English brand in Hebrew prose). The participant surface is in a **merge-ready, E2E-green** state for Dev B to layer host/admin work.

**What this document does**

1. **Audits** the current gap between documentation, tickets, and `main` (as of the audit date).  
2. **Arranges all remaining work that could still be attributed to Dev A** into clear buckets: *unblocked*, *blocked on Foundation*, *optional / product*, *not Dev A*.  
3. **Provides a phased plan** so Dev A (or an orchestrator) can execute without scope creep.

**Hard boundary (unchanged)**

- **Foundation-owned:** `src/app/router/**`, `src/components/shared/**`, `src/components/ui/**`, `src/lib/design-tokens.ts` — changes only via Foundation tickets or explicit Foundation PRs.  
- **Dev B-owned:** `src/pages/host/**`, `src/pages/admin/**`, `src/features/host-events/**`, `src/features/admin/**`, `e2e/host-admin-foundation.spec.ts`.  
- **Dev A-owned:** participant routes under `src/pages/{landing,events,apply,questionnaire,dashboard,gathering,auth}/**`, participant-related `src/features/**` (except Foundation-declared locks), `e2e/participant-foundation.spec.ts`, `e2e/slice-*.spec.ts`, shared E2E fixtures Dev A introduced (`e2e/fixtures/registrations.ts`, etc.), `src/components/participant/**`.

---

## 2. Audit methodology & baseline

| Check | Command / source | Result (audit date) |
|--------|------------------|----------------------|
| Typecheck (real) | `npx tsc -b --noEmit` | Exit `0` |
| E2E (Chromium) | `npx playwright test --project=chromium` | **30** tests, **5** files — all passing |
| E2E inventory | `npx playwright test --list \| tail -1` | `Total: 30 tests in 5 files` |
| Participant “event not found” duplication | `rg 'המפגש לא נמצא' src/` | Single shared component `src/components/participant/EventNotFound.tsx` + **out-of-scope** `TeamGatheringPage.tsx` (admin) |

**Merged Pass-3 + follow-up (chronological, high level)**

| Area | Outcome |
|------|---------|
| SP-A / SP-E | Dev B kickoff + F-1 doc corrections; Foundation tickets F-3…F-9 filed and indexed |
| SP-B | Gathering Hebrew status; Auth OTP duplicate error UX; E2E |
| SP-D | `ctx.close()` hygiene; questionnaire `getByLabel` (after label/`id` wiring in `ProfileBaseQuestionnaire` + `PhoneInput`); overclaiming test renames; auth callback test aligned with real `AuthCallbackPage` behavior |
| SP-C | `EventNotFound` extraction; Landing / Auth English-prose leaks; E2E regressions |
| Follow-up | `HostEventsPage` capacity validation: removed embedded `Circles` from Hebrew string |

---

## 3. Full audit — gaps & drift

### 3.1 Documentation drift (Dev A can fix with docs-only PRs)

| ID | Finding | Severity | Evidence |
|----|---------|----------|----------|
| ~~D-1~~ | ~~**Dev B kickoff** still states **“26 passing”**~~ | **Resolved** (2026-04-21) | Kickoff updated to **30** tests + `30/30` gate; see `3aab34f` |
| D-2 | **Pass-3 implementation plan** still contains **stale** snippets (e.g. old skip/count narrative in copied blocks) | Low — historical execution artifact | `docs/superpowers/plans/2026-04-19-pass-3-remediation-implementation.md` (grep for “25 passing”, “2 skipped”) |
| D-3 | **Pass-3 design spec** opening still says “26 passing” / “10 merged PRs” as *audit-era* baseline | Low — readers may think current `main` is still 26 | `docs/superpowers/specs/2026-04-19-pass-3-remediation-design.md` §1 |
| D-4 | Implementation plan **checkboxes** (`- [ ]`) for completed tasks were never bulk-checked | Low — cosmetic | Same implementation plan file |

**Recommendation:** D-1 kickoff sync is **done** on `main`. Remaining doc hygiene (D-2–D-4) is optional: add a one-line banner to Pass-3 spec/plan pointing here, grep-replace stale counts in historical remediation docs, or bulk-check implementation-plan checkboxes if you use them as trackers.

### 3.2 Foundation ticket queue (implementation = NOT Dev A)

All below are **indexed** in `docs/foundation-tickets/README.md`. Dev A’s role is **triage / +1 / consumer of APIs**, not implementation inside frozen paths.

| Ticket | Topic | Blocks Dev A? |
|--------|--------|----------------|
| **F-1** | `RouteLoadingState` body / i18n | **Indirectly** — `EventsPage` and others still hand-roll Hebrew loading until F-1 ships; Dev A must not edit `RouteState.tsx` to “fix” it |
| **F-2** | `/questionnaire` guard semantics | **Yes** if product wants route-level behavior change |
| **F-3** | Phantom `/host/settings` in manifest | Documentation / E2E manifest consumers — Dev A does not edit `routeManifest.ts` |
| **F-4** | English `Loading...` in `guards.tsx` | Participant first paint — Foundation |
| **F-5** | `AdminRoute` vs `ProtectedRoute` redirect UX | Admin + tests — Foundation |
| **F-6** | `StatusBadge` tone model | Cross-surface — Foundation |
| **F-7** | `PlaceholderPanel` English + enum | Host/admin placeholders — Foundation |
| **F-8** | `AppHeader` mixed i18n | Global chrome — Foundation |
| **F-9** | Missing `Link`/`Badge` UI primitives | Low priority — Foundation |

### 3.3 Tooling (Foundation or dedicated tooling PR — not participant feature work)

| ID | Finding | Owner |
|----|---------|--------|
| T-1 | `npm run typecheck` does **not** compile project references (`tsconfig` `files: []` pattern) | Documented in kickoff; **fix = tsconfig/script change** — align with Foundation or a small infra PR **outside** participant UX scope |

### 3.4 Optional product / a11y (participant-adjacent but cross-cutting)

| ID | Finding | Note |
|----|---------|------|
| A-1 | `Logo.tsx` uses `alt="Circles"` | Screen-reader language; Hebrew-first product may want Hebrew `alt` or decorative pattern — **product + a11y** decision |
| A-2 | `FloatingCircles` / asset filenames contain “Circles” | **Not** user-visible prose; rename is cosmetic |

### 3.5 Explicitly deferred from Pass-3 spec (still valid “later”)

| Item | Rationale |
|------|-----------|
| **Full `ApplicationLifecycleList` → `presentation.ts` migration** | Spec/plan: partial overlap with `resolveApplicationPanelContent`; list already uses `formatApplicationStatusShort` from `status.ts` — deeper unification is **refactor**, not debt closure |
| **Per-reason `/apply` blocked-state tests** | Plan: needs per-fixture setup; one honest alternation test exists |
| **Accessibility audit, mobile RTL, Sentry Hebrew mapping** | Listed as follow-ups in Pass-3 spec §1 / deferred list |
| **Vitest + component unit tests** | Repo has **no** `npm test` / Vitest; SP-C used E2E + `tsc` only |

### 3.6 Dev B / admin English (NOT Dev A unless explicitly reassigned)

Admin pages still contain English loading / action strings (e.g. `Loading…`, `Save selection…`). That is **Dev B** polish unless product reassigns.

---

## 4. Remaining work arranged for Dev A

### Bucket A — **Unblocked** (Dev A may execute now)

| Priority | ID | Work item | Outcome |
|----------|-----|-----------|---------|
| ~~**P0**~~ | ~~A-DOC-1~~ | ~~Patch **Dev B kickoff**: Playwright count **26 → 30**~~ | **Done** (`main` @ `3aab34f`) |
| ~~**P0**~~ | ~~A-DOC-2~~ | ~~Kickoff note on SP-B/C/D + link to this audit~~ | **Done** (same commit) |
| **P1** | A-DOC-3 | (Optional) Normalize **Pass-3 spec + implementation plan** headers with “completed” + link to this file | Less confusion for future agents |
| **P2** | A-TEST-1 | Split **apply readiness** test into **per-reason** tests *if* staging fixtures can guarantee each branch | Stronger guarantees; higher fixture cost |
| **P2** | A-FEAT-1 | **Deeper unify** `ApplicationLifecycleList` with `presentation.ts` / `ApplicationStatusPanel` patterns *without* touching Foundation files | Code quality; requires design of `viewer` / row API per kickoff guidance |

### Bucket B — **Blocked on Foundation** (Dev A: track, do not implement in frozen paths)

| ID | Action for Dev A |
|----|------------------|
| B-F-ALL | Watch F-1…F-9; when Foundation merges, **rebase participant pages** to adopt new APIs (e.g. `RouteLoadingState` body, guard Hebrew, `StatusBadge` tones) |
| B-F-1 | After F-1: consider replacing **inline Hebrew loading** on `EventsPage` with `RouteLoadingState` + Hebrew body prop |
| B-F-4 / F-5 | After guard fixes: add/adjust **E2E** for non-admin denial if tests become meaningful (today F-5 note exists in `foundation-routes.spec.ts`) |

### Bucket C — **Optional / product** (not required for Dev B start)

| ID | Work item |
|----|-----------|
| C-A11Y-1 | Logo `alt` text decision + implementation |
| C-REL-1 | Git tag on `main` (e.g. `dev-a-pass-3-remediation-complete`) if release hygiene wants it |
| C-SPEC-1 | Broader English grep sweep **limited to** `src/pages/{landing,events,apply,questionnaire,dashboard,gathering,auth}/**` + participant `features` — file tickets for anything that is actually product-facing Hebrew |

### Bucket D — **Not Dev A** (do not schedule here)

| Workstream | Examples |
|------------|----------|
| **Dev B** | Host/admin pages, `e2e/host-admin-foundation.spec.ts`, product plan `2026-04-18-developer-b-host-admin-product.md` |
| **Foundation** | Implementing F-1…F-9, router/guards/ui/shared refactors |
| **Infra** | Fixing `npm run typecheck` script/tsconfig (coordinate with Foundation) |

---

## 5. Plan to proceed (recommended order)

### Phase 0 — Same day (docs integrity) — **DONE on `main`**

Completed in commit `3aab34f` (pushed to `main`):

1. Updated `docs/superpowers/plans/2026-04-20-developer-b-kickoff.md`: Playwright **26 → 30** passing, preflight gate **30/30**, short note on SP-B/C/D + link to this audit file.  
2. This audit document added alongside the kickoff fix.

**Exit criteria:** Dev B kickoff numbers match `npx playwright test --list` — satisfied.

### Phase 1 — While Dev B is active (lightweight maintenance)

1. **Monitor** Foundation PRs that touch `RouteState`, `guards`, `AppHeader`, `StatusBadge`, `routeManifest`.  
2. After each Foundation merge: **participant regression** = full Chromium Playwright + `tsc -b`.  
3. If Foundation adds APIs (F-1 body prop): **migrate** `EventsPage` loading from inline Card to primitive **in Dev A-owned file only**.

### Phase 2 — Optional quality (only if capacity)

1. `ApplicationLifecycleList` / `presentation.ts` alignment — spike in a branch; must not duplicate `ApplicationStatusPanel` logic awkwardly.  
2. Per-reason `/apply` tests — only if fixture data supports deterministic branches.

### Phase 3 — Close Dev A chapter (handoff)

1. Confirm `main` green.  
2. Update **this** document’s **Status** header to `Complete — maintenance mode` when Phase 0 is done and Dev B is primary.  
3. Optional git tag.

---

## 6. Verification gates (every Dev A PR)

```bash
npx tsc -b --noEmit
npx playwright test --project=chromium
```

Optional: run twice if touching timing-sensitive auth/callback paths.

---

## 7. Appendix — file ownership quick reference

| Path pattern | Owner |
|--------------|--------|
| `src/pages/landing|events|apply|questionnaire|dashboard|gathering|auth/**` | **Dev A** |
| `src/components/participant/**` | **Dev A** (participant-only shared UI) |
| `src/features/applications/**`, `src/features/events/**` (participant) | **Dev A** (respect Foundation locks on specific files if any) |
| `src/features/profile/**` | **Dev A** for questionnaire UX; coordinate if Foundation claims it |
| `e2e/participant-foundation.spec.ts`, `e2e/slice-*.spec.ts` | **Dev A** |
| `src/app/router/**`, `src/components/shared/**`, `src/components/ui/**` | **Foundation** |
| `src/pages/host/**`, `src/pages/admin/**` | **Dev B** |

---

## 8. Changelog of this document

| Date | Change |
|------|--------|
| 2026-04-21 | Initial audit + plan after Pass-3 stack + host copy follow-up on `main` |
| 2026-04-21 | Phase 0 kickoff sync landed; audit Phase 0 section marked done |
