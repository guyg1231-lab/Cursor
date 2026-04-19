# Handoff: Foundation (F-1…F-9) + Dev A follow-through — Dev B explicitly out of scope

## Session Metadata

- **Created:** 2026-04-19
- **Project:** `social-matching-web` (contains `src/`, `e2e/`, `docs/`). In some clones this folder is nested under a monorepo root (e.g. `Cursor/social-matching-web/`); run git and npm commands from the directory that contains `package.json`.
- **Branch:** Expect work from **`main`** (verify with `git status` / `git branch` before starting)
- **Handoff type:** Continuation for a **new AI model or human**; user asked to **do everything except Dev B work** (host/admin implementation deferred)

## Current State Summary

Participant-facing work through **Pass-3 remediation (SP-A → SP-E → SP-B → SP-D → SP-C)** is **merged and described as complete** in `docs/superpowers/plans/2026-04-21-dev-a-remaining-work-audit-and-plan.md` (**Dev A — maintenance mode**). **Foundation wave 1** (shared route/state primitives from `2026-04-18-shared-foundation-normalization.md`) is treated as already on `main`. **Foundation wave 2** (**F-1…F-9**) is **implemented and indexed as `done`** in `docs/foundation-tickets/README.md` (includes manifest `preview` tier for F-2, `RouterLinkButton` for F-9 Option A, and prior merges for loading/guards/admin/placeholder/header/StatusBadge). Root `package.json` **`npm run typecheck`** runs **`tsc -b --noEmit`**. Run Playwright from the app directory; Chromium suite was **35 tests** as of last full run.

**Focus for the incoming worker:** implement **Foundation tickets** in foundation-owned paths, update ticket **Status** + **PR link** when merged, then **Dev A–owned adoption** (participant pages only) where a ticket unlocks it (e.g. F-1 + `EventsPage` loading). **Do not** implement Dev B host/admin product pages or deepen `e2e/host-admin-foundation.spec.ts` beyond maintenance needed for green CI unless explicitly reassigned.

## Scope boundaries (read first)

### In scope

| Area | What to do |
|------|------------|
| **Foundation** | Implement `docs/foundation-tickets/2026-04-20-0*.md` (F-1…F-9) in **`src/app/router/**`**, **`src/components/shared/**`**, **`src/components/ui/**`**, **`src/lib/design-tokens.ts`** as each ticket specifies. |
| **Dev A (participant)** | After each Foundation PR: adopt new APIs in **participant-owned** trees only (`src/pages/{landing,events,apply,questionnaire,dashboard,gathering,auth}/**`, `src/components/participant/**`, participant `src/features/**` respecting locks, `e2e/participant-foundation.spec.ts`, `e2e/slice-*.spec.ts`, shared fixtures Dev A introduced). |
| **Docs / tickets** | Mark tickets `in-progress` → `done` with merge PR URL; keep `docs/foundation-tickets/README.md` index status column accurate. |
| **Optional (low)** | Audit doc **D-4** (checkbox cosmetics in long implementation plan); **P2** items in audit (per-reason `/apply` tests if fixtures allow; `ApplicationLifecycleList` ↔ `presentation.ts` alignment). **Product/a11y** (e.g. `Logo` `alt`) if product decides — coordinate before editing `src/components/shared/Logo.tsx` if that path is foundation-sensitive. |

### Out of scope (Dev B — leave aside)

| Path / work | Reason |
|-------------|--------|
| `src/pages/host/**`, `src/pages/admin/**` | Dev B product surfaces |
| `src/features/host-events/**`, `src/features/admin/**` | Dev B feature layers |
| **`e2e/host-admin-foundation.spec.ts`** | Dev B E2E ownership |
| **`docs/superpowers/plans/2026-04-18-developer-b-host-admin-product.md`** execution | User requested Dev B **last** — do not start host/admin buildout here |
| **Dev B kickoff** (`2026-04-20-developer-b-kickoff.md`) | Reference only for env/E2E conventions; not a work queue for this handoff |

**Note:** Foundation PRs may **touch** guards or placeholders that host/admin routes use; that is still **Foundation**, not “doing Dev B.”

## Codebase understanding

### Architecture overview

- **Vite + React + React Router + TypeScript + Tailwind + Supabase client.**
- **Four conceptual layers:** (1) shared router + shared UI primitives, (2) participant app, (3) host app, (4) admin/operator app. This handoff targets **(1)** fully and **(2)** only for adoption/regressions.
- **E2E:** Playwright; staging env via `e2e/.env.e2e` and dotenv patterns documented in Dev B kickoff.

### Critical files (Foundation)

| Path | Purpose |
|------|---------|
| `src/components/shared/RouteState.tsx` | `RouteLoadingState`, error/empty/gated/success primitives — **F-1** starts here |
| `src/app/router/guards.tsx` | **F-4**, **F-5** (per tickets) |
| `src/app/router/routeManifest.ts` | **F-3** |
| `src/components/shared/PlaceholderPanel.tsx` | **F-7** |
| `src/components/shared/StatusBadge.tsx` | **F-6** |
| App header / shell under `src/components/shared/` | **F-8** (exact paths per ticket) |
| `src/components/ui/*` | **F-9** and shared primitives |

### Critical files (Dev A adoption after F-1)

| Path | Purpose |
|------|---------|
| `src/pages/events/EventsPage.tsx` | Inline Hebrew loading `Card` until `RouteLoadingState` accepts `body` — **migrate after F-1** |

### Key patterns

- **One ticket ≈ one PR** when possible; run **`npm run typecheck`** and **`npx playwright test --project=chromium`** before merge.
- **Do not** “fix” foundation files from participant branches without a Foundation ticket; tickets already exist for known gaps.
- Hebrew-first product: guards and loading copy should not leak English where tickets require Hebrew (see F-4, F-1 defaults in F-1 ticket text).

## Work completed (historical — do not redo)

- Pass-3 remediation stack merged; audit: `2026-04-21-dev-a-remaining-work-audit-and-plan.md`.
- Foundation tickets F-1…F-9 **filed and indexed** (`docs/foundation-tickets/README.md`); SP-E was documentation/ticket filing, not implementation.
- `npm run typecheck` fixed to `tsc -b --noEmit`; handoff docs aligned (kickoff, Pass-3 spec/plan, audit).

## Pending work

Foundation wave 2 (**F-1…F-9**) is **complete** on `main` (verify `docs/foundation-tickets/README.md`). Next focus areas:

1. **Push / PR hygiene** — If your remote `main` is behind local integration, push `main` and add GitHub PR links into ticket files if your team requires them (optional; resolution notes are already on each ticket).
2. **Dev A maintenance** — Optional P2 / audit items in `docs/superpowers/plans/2026-04-21-dev-a-remaining-work-audit-and-plan.md`.
3. **Dev B** — Host/admin product buildout when explicitly prioritized (`docs/superpowers/plans/2026-04-18-developer-b-host-admin-product.md`); still respect ownership of `e2e/host-admin-foundation.spec.ts` unless reassigned.

### Blockers / open questions

- **Owner field** on tickets may still say “Foundation (TBD)” — cosmetic only.
- **F-2 follow-ups** — `/auth/callback` is also `preview`; other routes could get the same tier in a future sweep if useful.

### Deferred (not this handoff’s primary queue)

- Full **Dev B** host/admin product plan.
- **Vitest** / unit test layer (repo historically E2E + `tsc`).

## Context for resuming agent

### Important context

- **Two meanings of “foundation”:** (a) **Wave 1** already merged (normalization plan); (b) **Wave 2** = **F-1…F-9** — this handoff is about **implementing (b)**.
- User instruction: **everything except Dev B** — so Foundation + participant adoption + optional audit/P2 is in; **host/admin feature work** is out.
- Frozen ownership is repeated in the audit doc §**Hard boundary** — do not violate it to “go faster.”

### Assumptions

- `main` is the integration branch; feature branches merge via PR.
- Staging credentials for Playwright exist locally (`e2e/.env.e2e`); do not commit secrets.

### Potential gotchas

- **F-1** default copy: ticket proposes Hebrew defaults — ensure **E2E** that snapshot English strings in guards/loading are updated intentionally, not accidentally loosened.
- **Merge order:** F-4/F-5 may affect `e2e/foundation-routes.spec.ts`; run full Chromium suite after each Foundation PR.
- Long plan `docs/superpowers/plans/2026-04-19-pass-3-remediation-implementation.md` has many unchecked `- [ ]` boxes for **historical** reasons — see banner at file top; do not assume unchecked means incomplete work.

## Environment state

### Verification (every substantive PR)

```bash
npm run typecheck
npx playwright test --project=chromium
```

### Optional narrower gate during tight iteration

```bash
npx playwright test e2e/foundation-routes.spec.ts e2e/participant-foundation.spec.ts --project=chromium
```

## Related resources

| Doc | Use |
|-----|-----|
| `docs/foundation-tickets/README.md` | Index + status of F-1…F-9 |
| `docs/superpowers/plans/2026-04-21-dev-a-remaining-work-audit-and-plan.md` | Ownership, maintenance mode, optional P2 |
| `docs/superpowers/specs/2026-04-18-near-term-buildout-foundation-design.md` | Big-picture platform map |
| `docs/superpowers/plans/2026-04-18-shared-foundation-normalization.md` | Original foundation file map (wave 1) |
| `docs/superpowers/plans/2026-04-20-developer-b-kickoff.md` | Reference only — E2E/env notes |

## Handoff validation note

The skill’s `python scripts/create_handoff.py` / `validate_handoff.py` scripts are **not present** in this repository root. This document was authored **fully populated** (no `[TODO: …]` placeholders) so another model can execute immediately. If you add the skill scripts later, run `validate_handoff.py` on this file and fix any reported issues.

## First action for the next session

1. `git checkout main && git pull` — confirm **`docs/foundation-tickets/README.md`** shows F-1…F-9 as **`done`**.
2. From the `social-matching-web` app directory: `npm run typecheck` and `npx playwright test --project=chromium`.
3. Pick up **Dev A maintenance**, **Dev B host/admin** (when in scope), or new foundation tickets — **do not** re-implement completed F-1…F-9 unless a regression appears.

---

**Continues from:** N/A (standalone handoff)  
**Supersedes:** Informal chat context — use this file + linked docs as source of truth.
