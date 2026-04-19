# Dev A — Public readiness master plan (non–Dev B)

**Created:** 2026-04-19  
**Audience:** Solo developer or Dev A owning participant + cross-cutting enablement **without** host/admin product work (Dev B).  
**Status:** Living plan — execute by phase; mark sections complete in-place or via PR notes.  
**Related:** [`2026-04-21-dev-a-remaining-work-audit-and-plan.md`](2026-04-21-dev-a-remaining-work-audit-and-plan.md), [`2026-04-18-near-term-buildout-foundation-design.md`](../specs/2026-04-18-near-term-buildout-foundation-design.md), [`mvp-v1/06_FUNCTIONAL_REQUIREMENTS.md`](../../mvp-v1/06_FUNCTIONAL_REQUIREMENTS.md)

---

## Purpose

Ship a **participant-trustworthy, deployable** experience on the path to a public launch, while **Dev B** owns host/admin surfaces. This plan does **not** replace product, legal, or ops decisions; it sequences **engineering work you can own**.

---

## Boundaries (non-negotiable)

| Own (Dev A / this plan) | Do not own (Dev B or explicit handoff) |
|-------------------------|----------------------------------------|
| `src/pages/{landing,events,apply,questionnaire,dashboard,gathering,auth}/**`, participant `src/features/**`, `src/components/participant/**` | `src/pages/host/**`, `src/pages/admin/**`, `src/features/host-events/**`, `src/features/admin/**` |
| `e2e/participant-foundation.spec.ts`, `e2e/slice-*.spec.ts`, shared fixtures you maintain | `e2e/host-admin-foundation.spec.ts` (Dev B) |
| Foundation **via tickets** for `src/app/router/**`, `src/components/shared/**`, `src/components/ui/**`, `src/lib/design-tokens.ts` | Ad-hoc edits to frozen paths without a ticket |

**Verification gate (every substantive change):**

```bash
cd social-matching-web
npm run typecheck
npx playwright test --project=chromium
```

---

## Phase A — Core participant journey (“stranger-safe”)

**Goal:** Land → browse events → event detail → auth as needed → questionnaire/readiness → apply → honest post-submit state → dashboard / gathering as applicable.

| ID | Task | Exit criteria |
|----|------|----------------|
| A.1 | Map participant UX to [`mvp-v1/06_FUNCTIONAL_REQUIREMENTS.md`](../../mvp-v1/06_FUNCTIONAL_REQUIREMENTS.md); maintain a short gap list (done / partial / missing). | Written gap list; no silent failures on critical path. |
| A.2 | Fix **participant-only** gaps: empty/error/gated states, copy, loading; prefer shared `Route*` primitives. | Demo on staging without hand-holding. |
| A.3 | Execute open **questionnaire / readiness** items from [`2026-04-19-developer-a-questionnaire-normalization.md`](2026-04-19-developer-a-questionnaire-normalization.md) that remain Dev A–scoped. | Plan tasks reconciled or explicitly deferred with reason. |

---

## Phase B — Automated regression (participant)

**Goal:** Protect Phase A with E2E where fixtures are honest.

| ID | Task | Exit criteria |
|----|------|----------------|
| B.1 | Extend [`e2e/participant-foundation.spec.ts`](../../e2e/participant-foundation.spec.ts) for branches you change in Phase A. | New tests fail if behavior regresses. |
| B.2 | **Per-reason `/apply` tests** (audit P2): add only if [`e2e/fixtures/registrations.ts`](../../e2e/fixtures/registrations.ts) + staging can fix each branch; else document “blocked on fixture” in this file. | No flaky invented state. |
| B.3 | Keep [`docs/ops/e2e-slice.md`](../ops/e2e-slice.md) and `e2e/.env.e2e.example` accurate. | Another dev can run the suite. |

---

## Phase C — Real-user quality bar

**Goal:** Reduce support load and embarrassment for first public users.

| ID | Task | Exit criteria |
|----|------|----------------|
| C.1 | **A11y** on participant routes: focus, labels, forms (auth, questionnaire, apply). | No known critical a11y blockers on core path. |
| C.2 | **RTL + narrow viewport** smoke on core pages; fix breaks in Dev A trees. | Readable layout on mobile for core journey. |
| C.3 | Optional: **`ApplicationLifecycleList` ↔ `presentation.ts` alignment** (audit A-FEAT-1) — only with a small API design; skip if risk > value. | Documented decision to ship or defer. |

---

## Phase D — Deploy & ops (participant app)

**Goal:** Something more durable than `npm run dev`.

| ID | Task | Exit criteria |
|----|------|----------------|
| D.1 | Document production build + hosting (`npm run build`, static host, env vars for Supabase + auth redirects). | [`docs/ops/public-readiness-smoke-checklist.md`](../ops/public-readiness-smoke-checklist.md) runnable after deploy. |
| D.2 | Separate **prod** vs **staging** config; never commit secrets. | Matches [`.env.production.example`](../../.env.production.example) patterns. |
| D.3 | Optional: client-side **error reporting** on participant bundles (e.g. Sentry) — product-approved only. | Errors visible in chosen tool. |
| D.4 | Post-deploy **smoke** using ops checklist. | Checklist green on prod URL. |

---

## Phase E — Trust & policy surfaces

**Goal:** Users see where terms/privacy/contact live before money or deep trust.

| ID | Task | Exit criteria |
|----|------|----------------|
| E.1 | Coordinate **legal copy** with product/legal; replace stubs when text exists. | Published policy matches product intent. |
| E.2 | **Stub routes** `/terms`, `/privacy` (Hebrew-first placeholders) + footer links from landing — see foundation ticket **F-10** and `AppRouter`. | Routes resolve; links visible on landing. |
| E.3 | **Support contact**: `mailto:` or form — product decides; implement in participant-owned UI. | Link reachable from shell or landing. |

---

## Phase F — Enable Dev B (without doing their work)

| ID | Task | Exit criteria |
|----|------|----------------|
| F.1 | Stable contracts for data participant flows rely on; document breaking changes. | Dev B kickoff still accurate. |
| F.2 | Keep full Chromium E2E green when rebasing; fix participant/fixture breaks only. | No participant regressions from your merges. |
| F.3 | Point host/admin work to [`2026-04-18-developer-b-host-admin-product.md`](2026-04-18-developer-b-host-admin-product.md) + kickoff. | Clear scope handoff. |

---

## What this plan does not promise

- **Full MVP** from [`mvp-v1/02_MVP_SCOPE.md`](../../mvp-v1/02_MVP_SCOPE.md) (filters, payments, WhatsApp, etc.) — many depend on **Dev B** or product.
- **Legal approval** — you ship **surfaces**; counsel approves **text**.
- **Production Supabase** project setup — you document; infra may create resources.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-04-19 | Initial master plan + cross-links from docs index |
