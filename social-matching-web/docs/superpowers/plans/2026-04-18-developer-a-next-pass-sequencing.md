# Developer A Pass-2 — Sequencing & Coordination

One coordination doc for the three sibling plans; it does not replace them.

---

## 1. Context

Pass-1 participant work from [`docs/superpowers/plans/2026-04-18-developer-a-participant-product.md`](2026-04-18-developer-a-participant-product.md) is implemented on branch `dev-a/participant-normalization` with **PR #1 pending merge**; after merge, `main` is the stable foundation for further participant work. Developer A’s Pass-2 backlog is the trio: [`2026-04-18-developer-a-dashboard-expansion.md`](2026-04-18-developer-a-dashboard-expansion.md), [`2026-04-18-developer-a-apply-flow-deepening.md`](2026-04-18-developer-a-apply-flow-deepening.md), and [`2026-04-18-developer-a-gathering-landing-polish.md`](2026-04-18-developer-a-gathering-landing-polish.md).

---

## 2. Recommended execution order

| Rank | Plan | Rationale |
|------|------|-----------|
| **1** | Dashboard expansion | Plans describe the largest user-visible delta on `/dashboard`, scoped to new list/card components plus `DashboardPage.tsx`, with no dependency on the new `resolveApplicationPanelContent` helper. |
| **2** | Apply-flow deepening | Plan introduces `src/features/applications/presentation.ts` (`resolveApplicationPanelContent`) and unifies copy across `ApplyPage` / `EventDetailPage`; sequencing after dashboard lets readiness/lifecycle Hebrew patterns on the dashboard land first where the dashboard plan calls for consistency with Pass-1 / apply-adjacent copy. |
| **3** | Gathering + landing polish | Plan is intentionally small (≤60 lines of code diff excluding new doc) and documents `/gathering/:eventId` vs canonical `/events/:eventId`; it may run **in parallel** with #1 or #2 if capacity allows, provided merge/rebase rules below are followed. |

---

## 3. Conflict map

Concrete paths **listed as created or modified** in more than one plan, plus the focus paths from the sequencing brief.

| Pair | Path(s) | Notes |
|------|---------|--------|
| Dashboard **×** Apply | `e2e/participant-foundation.spec.ts` | **Merge-order issue:** both extend the same spec; not mutually exclusive edits if tests are namespaced, but concurrent PRs will conflict on the file. |
| Dashboard **×** Apply | `src/features/applications/components/ApplicationStatusPanel.tsx` | **Not a planned dual-edit:** neither plan’s file map modifies this module; dashboard **reuses** the panel from `DashboardPage` / lifecycle list; apply plan **consumes** it from pages only (forbidden to change panel API). Conflict only if scope expands into the shared file. |
| Dashboard **×** Apply | `src/pages/dashboard/DashboardPage.tsx`, `src/pages/apply/ApplyPage.tsx`, `src/pages/events/EventDetailPage.tsx` | **No cross-pair overlap** per file maps (each plan owns disjoint pages here). |
| Dashboard **×** Gathering | `e2e/participant-foundation.spec.ts` | **Merge-order issue** (same as above). |
| Dashboard **×** Gathering | `src/pages/dashboard/DashboardPage.tsx` vs `GatheringPage.tsx` / `LandingPage.tsx` | **No overlap** on application pages. |
| Apply **×** Gathering | `e2e/participant-foundation.spec.ts` | **Merge-order issue.** |
| Apply **×** Gathering | `src/pages/events/EventDetailPage.tsx` vs `GatheringPage.tsx` / optional `LandingPage.tsx` | **No overlap** except optional `LandingPage.tsx` if gathering Task 3 edits it—apply plan does not list `LandingPage.tsx`. |

**All three:** `e2e/participant-foundation.spec.ts` — **merge-order issue**; coordinate or land in recommended order with rebases.

**Shared-file count:** By each plan’s stated create/modify file maps, **one** path is touched by **all three** plans (`e2e/participant-foundation.spec.ts`). No other path is listed as modified/created by more than one plan (optional `LandingPage.tsx` appears only in the gathering plan).

---

## 4. Branch strategy

| Plan | Branch |
|------|--------|
| Dashboard expansion | `dev-a/dashboard-expansion` |
| Apply-flow deepening | `dev-a/apply-flow-deepening` |
| Gathering + landing polish | `dev-a/gathering-landing-polish` |

**Rule:** Each branch starts from **`main` after PR #1 merges** (i.e. participant normalization on `main`). If PR #1 is still open when work must start, branch from `dev-a/participant-normalization` instead and **rebase onto `main` once PR #1 lands** before opening / updating the Pass-2 PR.

---

## 5. Merge order enforcement

Land Pass-2 PRs in **the recommended order (dashboard → apply-flow → gathering)** so each follow-on PR rebases on the latest merged `main`.

If **parallel** work happens (e.g. gathering-landing alongside dashboard): the **smaller** PR must **rebase onto** the larger / earlier-track PR’s branch (or onto `main` after that PR merges) **before** review—**not** the other way around. For the default ordering, **gathering-landing** rebases on top of **dashboard** and/or **apply-flow** as needed so `participant-foundation.spec.ts` stays coherent.

---

## 6. Developer B coordination — files Developer A will touch (Pass-2)

Single list aggregated from each plan’s “Developer B” / “do not touch” sections (paths Developer A owns this cycle; Developer B should avoid or coordinate):

- `docs/participant-routing.md` (gathering plan — new)
- `src/pages/dashboard/DashboardPage.tsx`
- `src/features/profile/components/ProfileReadinessCard.tsx`
- `src/features/applications/components/ApplicationLifecycleList.tsx` (and optional `ApplicationLifecycleRow.tsx` per dashboard plan)
- `src/pages/apply/ApplyPage.tsx`
- `src/pages/events/EventDetailPage.tsx`
- `src/features/applications/presentation.ts` (apply plan — new)
- `src/pages/gathering/GatheringPage.tsx`
- `src/pages/landing/LandingPage.tsx` (gathering plan — **only if** Task 3 landing audit fails)
- `e2e/participant-foundation.spec.ts`

**Also reserved globally across these plans (Developer A stream + shared foundation):** `routeManifest.ts`, `AppRouter.tsx`, `guards.tsx`, everything under `src/components/shared/*`, host/admin route trees, `e2e/foundation-routes.spec.ts`, `e2e/slice-happy-path.spec.ts`. Dashboard plan additionally asks B to leave **`src/features/events/query.ts`** and **`src/features/applications/api.ts`** untouched (no edits per dashboard scope).

---

## 7. Open product questions rolled up

Decisions called out in the three plans for humans before / during implementation (not answered here):

1. **Staging fixtures:** Which `ENV.EMAILS.P1`–`P4` mailboxes have zero applications, `confirmed`/`approved` on `ENV.EVENT_ID`, `awaiting_response` with known `expires_at`, and `cancelled`/`rejected` for re-apply coverage (dashboard Tasks 2–3; apply Tasks 1–4).
2. **Hebrew copy + tests:** Dashboard readiness strings vs assertions; apply footer prefix / regex vs final `resolveApplicationPanelContent` wording—keep UI and Playwright in lockstep when changed.
3. **Temporary-offer footer:** Include **`offered_at`** with **`expires_at`** or deadline-only; expired-state wording; **`awaiting_response` with null `expires_at`** — Hebrew fallback vs softer copy (apply plan Task 1 / Self-Review).
4. **Lifecycle parity:** **`attended` / `no_show`** — should `/apply` match event detail exactly via the same helper branch? (apply Self-Review).
5. **Participant UX edge cases:** Dashboard **loading** pattern without `RouteLoadingState` (dashboard Self-Review); **landing** — if gathering Task 3 tests fail after merge, minimal `LandingPage.tsx` change vs test-only adjustment (gathering Task 3).

---

## 8. Kickoff checklist — Plan #1 (dashboard expansion)

When ready to start dashboard expansion after PR #1 is on `main` (or branching from normalization per §4):

```bash
git fetch origin
git checkout main && git pull
git checkout -b dev-a/dashboard-expansion
# then run subagent-driven-development using the plan file:
# docs/superpowers/plans/2026-04-18-developer-a-dashboard-expansion.md
```

---

## 9. Regression gate (all three plans, any PR this cycle)

Both developers run before opening any Pass-2 PR:

```bash
npm run typecheck && npx playwright test e2e/foundation-routes.spec.ts e2e/participant-foundation.spec.ts --project=chromium
```
