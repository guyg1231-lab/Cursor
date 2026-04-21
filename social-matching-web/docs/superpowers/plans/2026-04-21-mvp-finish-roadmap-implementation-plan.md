# MVP Finish Roadmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the remaining work needed to call MVP complete with clear Dev A / Dev B ownership and a shared launch signoff.

**Architecture:** This plan is intentionally simple. First, close Dev A must-haves. Second, close Dev B must-haves. Third, run one shared launch-readiness pass with evidence. Everything else is post-MVP.

**Tech Stack:** React 18, TypeScript, React Router, Supabase, Playwright, docs under `docs/`.

---

## File Structure (what this plan updates)

- **Spec source of truth**
  - `docs/superpowers/specs/2026-04-21-mvp-finish-roadmap-design.md`
- **Execution plan**
  - `docs/superpowers/plans/2026-04-21-mvp-finish-roadmap-implementation-plan.md`
- **Existing launch docs used as evidence**
  - `docs/ops/participant-spa-deploy.md`
  - `docs/ops/public-readiness-smoke-checklist.md`
  - `docs/ops/real-events/events/upcoming-event-packet.md`
  - `docs/ops/real-events/events/first-real-event-packet.md`

---

## Task 1: Freeze MVP done checklist (single shared truth)

**Files:**
- Modify: `docs/superpowers/specs/2026-04-21-mvp-finish-roadmap-design.md`

- [x] **Step 1: Create final checklist section (RED review)**
  
Add one compact checklist with three headers:
- Dev A must-haves
- Dev B must-haves
- Shared launch must-haves

Expected result: no “maybe/TBD” language in must-have items.

- [x] **Step 2: Read-through check**

Run:

```bash
rg "TBD|maybe|optional|if possible" docs/superpowers/specs/2026-04-21-mvp-finish-roadmap-design.md
```

Expected: no ambiguous terms inside must-have checklist section.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-04-21-mvp-finish-roadmap-design.md
git commit -m "docs(mvp): freeze shared done checklist for launch"
```

---

## Task 2: Close Dev A must-haves and lock evidence

**Files:**
- Modify as needed in Dev A participant scope
- Verify:
  - `e2e/participant-foundation.spec.ts`
  - `e2e/foundation-routes.spec.ts`

- [ ] **Step 1: Re-run Dev A launch-critical tests**

Run:

```bash
npm run typecheck
npx playwright test e2e/foundation-routes.spec.ts e2e/participant-foundation.spec.ts --project=chromium
```

Expected: PASS.

- [ ] **Step 2: Resolve only launch-critical Dev A gaps (if any fail)**

If failures occur, patch only launch-critical paths (apply/gathering/propose/auth-return).  
Avoid non-blocking refactors.

- [ ] **Step 3: Re-run and confirm green**

Run same commands again; expect PASS.

- [ ] **Step 4: Commit**

```bash
git add e2e/foundation-routes.spec.ts e2e/participant-foundation.spec.ts src/pages/apply/ApplyPage.tsx src/pages/gathering/GatheringPage.tsx src/lib/authReturnTo.ts
git commit -m "test(dev-a): lock launch-critical participant MVP gates"
```

---

## Task 3: Close Dev B must-haves for operator readiness

**Files:**
- Modify in host/admin pages/routes/tests as needed
- Start from:
  - `docs/superpowers/plans/2026-04-18-developer-b-host-admin-product.md`
  - `docs/superpowers/plans/2026-04-20-developer-b-kickoff.md`

- [x] **Step 1: Define smallest Dev B launch slice**

Create a short list (inside commit message notes or working checklist) of only:
- must-operate actions,
- must-not-break routes/permissions,
- must-have tests.

- [x] **Step 2: Implement smallest missing Dev B blockers**

Patch only the minimum needed for MVP operations to be real and testable.

- [x] **Step 3: Run host/admin critical verification**

Run:

```bash
npm run typecheck
npx playwright test --project=chromium
```

Expected: PASS, or isolated known blocker list with owner/date.

- [x] **Step 4: Commit**

```bash
git add src/pages/host src/pages/admin src/app/router e2e
git commit -m "feat(dev-b): close MVP-critical host-admin operating gaps"
```

---

## Task 4: Shared launch-readiness evidence pass

**Files:**
- Modify:
  - `docs/ops/public-readiness-smoke-checklist.md`
  - `docs/ops/real-events/events/upcoming-event-packet.md`
  - `docs/ops/real-events/events/first-real-event-packet.md`

- [ ] **Step 1: Execute staging smoke checklist**

Follow deploy doc and run checklist against staging URL.  
Record pass/fail evidence inline in checklist.

- [ ] **Step 2: Fill real-event packet placeholders**

Replace remaining `TBD` values with concrete event/operator details.

- [x] **Step 3: Record known deferred items**

Add one short section: “Accepted post-MVP improvements” with owner + target timeframe.

- [x] **Step 4: Commit**

```bash
git add docs/ops/public-readiness-smoke-checklist.md docs/ops/real-events/events/upcoming-event-packet.md docs/ops/real-events/events/first-real-event-packet.md
git commit -m "docs(ops): complete MVP launch-readiness evidence and event packets"
```

---

## Task 5: Final go/no-go checkpoint

**Files:**
- No required code changes; verification + release decision output

- [x] **Step 1: Final hard gate run**

Run:

```bash
npm run typecheck
npx playwright test --project=chromium
```

Expected: PASS.

- [x] **Step 2: Prepare final launch summary**

One-page summary:
- what is complete,
- what is deferred,
- who owns each deferred item,
- recommendation: GO or NO-GO.

- [x] **Step 3: Commit summary (if stored in repo)**

```bash
git add docs
git commit -m "docs(mvp): publish final go-no-go summary"
```

---

## Final note

MVP completion means “ready to launch core value safely,” not “finished forever.”  
After this plan, continue with improvement phases as separate post-MVP work.

