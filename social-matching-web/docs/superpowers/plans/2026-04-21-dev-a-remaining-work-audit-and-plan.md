# Developer A — Remaining Work: Full Audit & Plan to Proceed

**Created:** 2026-04-21  
**Audience:** Developer A (participant surface), orchestrators, product  
**Status:** **Dev A — maintenance mode** — Pass-3 remediation + doc/typecheck handoff complete on `main`. **Foundation wave 2 (F-1…F-10)** is **implemented and indexed as done** in `docs/foundation-tickets/README.md`. Remaining Dev A work is **optional quality**, **participant feature** backlog, and **lightweight regression** when shared code changes — not blocked on Foundation tickets.  
**Related:** `docs/superpowers/specs/2026-04-19-pass-3-remediation-design.md`, `docs/superpowers/plans/2026-04-19-pass-3-remediation-implementation.md`, `docs/superpowers/plans/2026-04-20-developer-b-kickoff.md`, `docs/superpowers/plans/2026-04-19-dev-a-public-readiness-master-plan.md`

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
- **Dev A-owned:** participant routes under `src/pages/{landing,events,apply,questionnaire,dashboard,gathering,auth,legal}/**`, participant-related `src/features/**` (except Foundation-declared locks), `e2e/participant-foundation.spec.ts`, `e2e/slice-*.spec.ts`, shared E2E fixtures Dev A introduced (`e2e/fixtures/registrations.ts`, etc.), `src/components/participant/**`.

---

## 2. Audit methodology & baseline

| Check | Command / source | Result (audit date) |
|--------|------------------|----------------------|
| Typecheck (real) | `npm run typecheck` (→ `tsc -b --noEmit`) | Exit `0` |
| E2E (Chromium) | `npx playwright test --project=chromium` | **43** tests, **5** files — all passing after deterministic `/apply` matrix expansion |
| E2E inventory | `npx playwright test --list \| tail -1` | `Total: 43 tests in 5 files` |
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
| ~~D-2~~ | ~~**Pass-3 implementation plan** stale snippets~~ | **Mostly resolved** (2026-04-21) | Banner + Task A.2/A.4 + execution conventions aligned with **30** tests and working `npm run typecheck`; grep may still find “25/26” inside **historical** PR-body examples — intentional unless someone bulk-edits |
| ~~D-3~~ | ~~**Pass-3 design spec** §1 audit-era counts~~ | **Resolved** (2026-04-21) | `2026-04-19-pass-3-remediation-design.md` §1 reframed as historical baseline + **completed** outcome + link to this audit |
| ~~D-4~~ | ~~Implementation plan **checkboxes**~~ | **Resolved** (2026-04-19) | `2026-04-19-pass-3-remediation-implementation.md`: all list items `- [x]`; banner updated |

**Recommendation:** D-1, D-3, D-4, and most of D-2 are **done** on `main` (2026-04-21 pass). **T-1** (below) is **resolved** via root `package.json` `typecheck` → `tsc -b --noEmit`.

### 3.2 Foundation ticket queue — **resolved on `main` (2026-04)**

Tickets **F-1…F-10** are **done** (see `docs/foundation-tickets/README.md`). Dev A **consumes** the outcomes (e.g. `RouteLoadingState` defaults, guard Hebrew, `StatusBadge` tones, `RouterLinkButton`, manifest `preview` tier, legal stub routes) but does **not** re-open Foundation work except via **new** foundation tickets.

| Follow-up | Note |
|-----------|------|
| **Participant adoption** | `EventsPage` uses `<RouteLoadingState />` with shared defaults; further copy tweaks stay in Dev A-owned files only. |
| **Regression** | After any PR touching `src/components/shared/**` or `src/app/router/**`, run full Chromium Playwright + `npm run typecheck`. |

### 3.3 Tooling (Foundation or dedicated tooling PR — not participant feature work)

| ID | Finding | Owner |
|----|---------|--------|
| ~~T-1~~ | ~~`npm run typecheck` no-op~~ | **Resolved** (2026-04-21): root `package.json` `"typecheck": "tsc -b --noEmit"`; kickoff “Known issues” §1 updated to match |

### 3.4 Optional product / a11y (participant-adjacent but cross-cutting)

| ID | Finding | Note |
|----|---------|------|
| ~~A-1~~ | ~~`Logo.tsx` uses `alt="Circles"`~~ | **Resolved** — Hebrew `alt` (`לוגו`) for screen readers; see `src/components/shared/Logo.tsx` |
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
| ~~**P1**~~ | ~~A-DOC-3~~ | ~~Normalize **Pass-3 spec + implementation plan** headers~~ | **Done** (2026-04-21): spec §1 + status; implementation plan banner + A.2/A.4/conventions; kickoff typecheck §1 |
| **P2** | A-TEST-1 | Split **apply readiness** test into **per-reason** tests *if* staging fixtures can guarantee each branch | Stronger guarantees; higher fixture cost |
| **P2** | A-FEAT-1 | **Deeper unify** `ApplicationLifecycleList` with `presentation.ts` / `ApplicationStatusPanel` patterns *without* touching Foundation files | Code quality; requires design of `viewer` / row API per kickoff guidance |

### Bucket B — **Foundation follow-through** (was “blocked”; now **tracking only**)

| ID | Action for Dev A |
|----|------------------|
| B-F-ALL | **Done** — F-1…F-10 merged; keep **participant regression** on future shared changes. |
| B-F-1 | **Satisfied** — `EventsPage` uses `RouteLoadingState` (shared loading primitive). |
| B-F-4 / F-5 | **Satisfied** — guard Hebrew + admin denial E2E live in `e2e/foundation-routes.spec.ts`. |

### Bucket C — **Optional / product** (not required for Dev B start)

| ID | Work item |
|----|-----------|
| ~~C-A11Y-1~~ | ~~Logo `alt` text~~ — **done** (Hebrew `alt`; same row as A-1) |
| ~~C-REL-1~~ | ~~Git tag on `main`~~ — **done**: tag `foundation-wave-2-complete` (pushed with rollout docs) |
| ~~C-SPEC-1~~ | ~~English grep sweep (participant paths)~~ — **N/A**: no new product-facing English strings found in participant `src/pages/*` beyond placeholders (`name@example.com`) and code identifiers; host/admin English out of scope for Dev A |

### Bucket D — **Not Dev A** (do not schedule here)

| Workstream | Examples |
|------------|----------|
| **Dev B** | Host/admin pages, `e2e/host-admin-foundation.spec.ts`, product plan `2026-04-18-developer-b-host-admin-product.md` |
| **Foundation** | Implementing F-1…F-9, router/guards/ui/shared refactors |
| **Infra** | Broader CI/tsconfig changes beyond what Dev A owns (e.g. new check scripts) — coordinate with Foundation |

---

## 5. Plan to proceed (recommended order)

### Phase 0 — Same day (docs integrity) — **DONE on `main`**

Completed in commit `3aab34f` (pushed to `main`):

1. Updated `docs/superpowers/plans/2026-04-20-developer-b-kickoff.md`: Playwright **26 → 30** passing, preflight gate **30/30**, short note on SP-B/C/D + link to this audit file.  
2. This audit document added alongside the kickoff fix.

**Follow-up (2026-04-21, same phase):** Root `package.json` `typecheck` → `tsc -b --noEmit`; kickoff “Known issues” §1 corrected; Pass-3 design spec §1 + implementation plan banner/tasks; this audit D-2/D-3/T-1/A-DOC-3 reconciled — merged to `main` (commit message: `chore(docs): fix typecheck script and align Pass-3 handoff docs`).

**Exit criteria:** Dev B kickoff numbers match `npx playwright test --list`; typecheck script matches docs — **satisfied**.

### Phase 1 — Ongoing maintenance (post–Foundation wave 2)

1. On any PR touching **shared router/UI** (`RouteState`, `guards`, `AppHeader`, `StatusBadge`, `routeManifest`, `design-tokens`): run **full Chromium Playwright** + `npm run typecheck`.  
2. **Participant features** and **Dev A refactors** continue under normal ownership rules; new cross-cutting changes still go through **Foundation tickets** when they hit frozen paths.

### Phase 2 — Optional quality (only if capacity)

1. `ApplicationLifecycleList` / `presentation.ts` alignment — spike in a branch; must not duplicate `ApplicationStatusPanel` logic awkwardly.  
2. Per-reason `/apply` tests — only if fixture data supports deterministic branches.

### Phase 3 — Close Dev A chapter (handoff)

1. Confirm `main` green.  
2. ~~Update **this** document’s **Status** header~~ — **done** (maintenance mode).  
3. Optional git tag.

---

## 6. Verification gates (every Dev A PR)

```bash
npm run typecheck
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
| 2026-04-20 | Deterministic `/apply` matrix slice adds five targeted participant regressions (`pending`, `waitlist`, `attended`, `approved`, expired `awaiting_response`); branch verification baseline → **43** tests |
| 2026-04-20 | Dashboard lifecycle compact branch adds one Playwright regression; branch verification baseline → **38** tests |
| 2026-04-19 | Public-readiness closeout: FR matrix, `participant-spa-deploy.md`, `participant-data-contracts.md`, `VITE_SUPPORT_EMAIL`, narrow-viewport E2E; audit §2 → **37** tests |
| 2026-04-19 | Public-readiness master plan + smoke checklist; F-10 legal stubs; audit §2 → **36** tests; D-4 recommendation corrected; foundation index F-1…F-10 |
| 2026-04-21 | Initial audit + plan after Pass-3 stack + host copy follow-up on `main` |
| 2026-04-21 | Phase 0 kickoff sync landed; audit Phase 0 section marked done |
| 2026-04-21 | D-2/D-3/T-1 resolved in docs; `typecheck` script + kickoff §1; verification gates prefer `npm run typecheck` |
| 2026-04-21 | Status header → maintenance mode; Phase 0 follow-up noted merged on `main` |
| 2026-04-19 | Foundation F-1…F-9 complete on `main`; audit §2 counts → **35** tests; §3.2 / Bucket B / Phase 1 updated for post-foundation maintenance |
| 2026-04-19 | D-4: Pass-3 implementation plan checklists bulk `[x]`; C-SPEC-1 participant sweep (no changes); C-REL-1 tag `foundation-wave-2-complete`; near-term SPEC rollup |
