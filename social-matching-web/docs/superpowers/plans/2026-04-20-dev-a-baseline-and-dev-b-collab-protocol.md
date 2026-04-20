# Dev A Baseline and Dev B Collaboration Protocol

> Status: active coordination note
> Last verified: 2026-04-20 (local `main` at `a68f5a7`)

## 1) Current baseline (single source for start conditions)

- Branch: `main`
- Upstream sync: `main` == `origin/main`
- Typecheck gate: `npm run typecheck` passes (`tsc -b --noEmit`)
- E2E gate: `npx playwright test --list` shows `Total: 47 tests in 5 files`
- Existing local-only artifacts to keep out of product PRs:
  - `.superpowers/`
  - `../.claude/handoffs/` (repo-root relative path)

## 2) Dev A operating protocol (active developer)

1. Start each task from latest `main`.
2. Create one branch per task (`dev-a/<short-task-name>`).
3. Keep PRs narrow (one behavior slice or one docs slice).
4. Before opening PR:
   - `npm run typecheck`
   - `npx playwright test --project=chromium`
   - update only docs directly affected by the change
5. After merge, add a 5-line handoff note:
   - what changed
   - verification commands and result
   - known risk
   - next recommended task
   - whether Dev B is blocked/unblocked

## 3) Dev B onboarding protocol (starts later)

Dev B must not start from old kickoff assumptions. Dev B starts from this checklist:

1. Pull latest `main`.
2. Confirm preflight:
   - `npm run typecheck`
   - `npx playwright test --project=chromium`
3. Read only these files first:
   - `docs/superpowers/plans/2026-04-20-developer-b-kickoff.md`
   - `docs/superpowers/plans/2026-04-21-dev-a-remaining-work-audit-and-plan.md`
   - `docs/superpowers/specs/2026-04-18-near-term-buildout-foundation-design.md`
   - `docs/superpowers/plans/2026-04-20-dev-a-baseline-and-dev-b-collab-protocol.md` (this file)
4. Pick one queued Dev B task and open one branch (`dev-b/<task-name>`).
5. Open one PR per task with explicit dependency notes.

## 4) Work split rules (to avoid collisions)

- Dev A owns: participant-lifecycle polish, docs integrity, shared baseline updates.
- Dev B owns: host/admin product depth per kickoff and near-term foundation spec.
- Shared files (`routeManifest`, shared components, top-level plans/specs) require explicit mention in PR description when touched.
- If both need the same shared file, Dev A merges first, Dev B rebases and reapplies.

## 5) Merge and handoff rhythm

- Daily async update (short):
  - done
  - next
  - blockers
  - files likely to conflict
- Handoff trigger:
  - Any merge that changes shared contracts, route states, or status vocabulary.
- Freeze rule:
  - No new feature branch if `main` is red on `typecheck` or chromium Playwright.

## 6) Deferred decisions log (explicitly postponed)

Keep these intentionally deferred until pillars are live and stable:

- in-event experience layer
- post-event feedback loop design depth
- advanced matching automation beyond current manual/semi-manual process

When revisiting deferred topics, attach:
- trigger condition (what became true)
- expected product impact
- owner (Dev A / Dev B / shared)
