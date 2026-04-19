# Dev A — Public readiness master plan (non–Dev B)

**Created:** 2026-04-19  
**Audience:** Solo developer or Dev A owning participant + cross-cutting enablement **without** host/admin product work (Dev B).  
**Status:** **Engineering-closeout pass (2026-04-19)** — deliverable docs, deploy guide, FR matrix, support `mailto` hook, E2E mobile smoke, and explicit deferrals are on `main`. Remaining items are **product/legal/ops execution** (real deploy URL smoke, final legal copy, Sentry, deep a11y audit) rather than missing code stubs.  
**Related:** [`2026-04-21-dev-a-remaining-work-audit-and-plan.md`](2026-04-21-dev-a-remaining-work-audit-and-plan.md), [`2026-04-18-near-term-buildout-foundation-design.md`](../specs/2026-04-18-near-term-buildout-foundation-design.md), [`mvp-v1/06_FUNCTIONAL_REQUIREMENTS.md`](../../mvp-v1/06_FUNCTIONAL_REQUIREMENTS.md), [`2026-04-19-participant-fr-coverage-matrix.md`](2026-04-19-participant-fr-coverage-matrix.md), [`../../ops/participant-spa-deploy.md`](../../ops/participant-spa-deploy.md), [`../../participant-data-contracts.md`](../../participant-data-contracts.md)

---

## Purpose

Ship a **participant-trustworthy, deployable** experience on the path to a public launch, while **Dev B** owns host/admin surfaces. This plan does **not** replace product, legal, or ops decisions; it sequences **engineering work you can own**.

---

## Boundaries (non-negotiable)

| Own (Dev A / this plan) | Do not own (Dev B or explicit handoff) |
|-------------------------|----------------------------------------|
| `src/pages/{landing,events,apply,questionnaire,dashboard,gathering,auth,legal}/**`, participant `src/features/**`, `src/components/participant/**` | `src/pages/host/**`, `src/pages/admin/**`, `src/features/host-events/**`, `src/features/admin/**` |
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
| A.1 | Map participant UX to [`mvp-v1/06_FUNCTIONAL_REQUIREMENTS.md`](../../mvp-v1/06_FUNCTIONAL_REQUIREMENTS.md); maintain a short gap list (done / partial / missing). | **Done** — [`2026-04-19-participant-fr-coverage-matrix.md`](2026-04-19-participant-fr-coverage-matrix.md). |
| A.2 | Fix **participant-only** gaps: empty/error/gated states, copy, loading; prefer shared `Route*` primitives. | **Ongoing product work** — matrix shows no silent “missing” on core path; file new tickets for new gaps. |
| A.3 | Execute open **questionnaire / readiness** items from [`2026-04-19-developer-a-questionnaire-normalization.md`](2026-04-19-developer-a-questionnaire-normalization.md) that remain Dev A–scoped. | **Done on `main`** — see plan header “Implementation status”; procedural TDD checkboxes kept as history. |

---

## Phase B — Automated regression (participant)

**Goal:** Protect Phase A with E2E where fixtures are honest.

| ID | Task | Exit criteria |
|----|------|----------------|
| B.1 | Extend [`e2e/participant-foundation.spec.ts`](../../e2e/participant-foundation.spec.ts) for branches you change in Phase A. | **Satisfied** — suite includes landing/legal/footer + core path; extend when behavior branches. |
| B.2 | **Per-reason `/apply` tests** (audit P2): add only if [`e2e/fixtures/registrations.ts`](../../e2e/fixtures/registrations.ts) + staging can fix each branch; else document “blocked on fixture” in this file. | **Deferred** — blocked on deterministic per-reason staging fixtures ([`2026-04-21-dev-a-remaining-work-audit-and-plan.md`](2026-04-21-dev-a-remaining-work-audit-and-plan.md) §3.5). |
| B.3 | Keep [`docs/ops/e2e-slice.md`](../ops/e2e-slice.md) and `e2e/.env.e2e.example` accurate. | **Verified** — examples still match harness; no change required this pass. |

---

## Phase C — Real-user quality bar

**Goal:** Reduce support load and embarrassment for first public users.

| ID | Task | Exit criteria |
|----|------|----------------|
| C.1 | **A11y** on participant routes: focus, labels, forms (auth, questionnaire, apply). | **Partial** — Logo `alt` and form labels addressed in prior passes; full WCAG audit not in scope for this closeout. |
| C.2 | **RTL + narrow viewport** smoke on core pages; fix breaks in Dev A trees. | **Done** — Playwright narrow-viewport smoke on landing (see `e2e/participant-foundation.spec.ts`). |
| C.3 | Optional: **`ApplicationLifecycleList` ↔ `presentation.ts` alignment** (audit A-FEAT-1) — only with a small API design; skip if risk > value. | **Deferred** — same rationale as audit §3.5 / §Phase 2 optional quality. |

---

## Phase D — Deploy & ops (participant app)

**Goal:** Something more durable than `npm run dev`.

| ID | Task | Exit criteria |
|----|------|----------------|
| D.1 | Document production build + hosting (`npm run build`, static host, env vars for Supabase + auth redirects). | **Done** — [`docs/ops/participant-spa-deploy.md`](../ops/participant-spa-deploy.md); smoke checklist unchanged. |
| D.2 | Separate **prod** vs **staging** config; never commit secrets. | **Done** — examples document staging vs prod keys; optional `VITE_SUPPORT_EMAIL` documented. |
| D.3 | Optional: client-side **error reporting** (e.g. Sentry) — product-approved only. | **Not implemented** — requires product approval + SDK wiring. |
| D.4 | Post-deploy **smoke** using ops checklist. | **Operator step** — run [`public-readiness-smoke-checklist.md`](../ops/public-readiness-smoke-checklist.md) when a prod URL exists. |

---

## Phase E — Trust & policy surfaces

**Goal:** Users see where terms/privacy/contact live before money or deep trust.

| ID | Task | Exit criteria |
|----|------|----------------|
| E.1 | Coordinate **legal copy** with product/legal; replace stubs when text exists. | **Product step** — replace text in `TermsPage` / `PrivacyPage` when approved. |
| E.2 | **Stub routes** `/terms`, `/privacy` (Hebrew-first placeholders) + footer links from landing — see foundation ticket **F-10** and `AppRouter`. | **Done** (F-10). |
| E.3 | **Support contact**: `mailto:` or form — product decides; implement in participant-owned UI. | **Done** — optional `VITE_SUPPORT_EMAIL` shows **צור קשר** on landing footer. |

---

## Phase F — Enable Dev B (without doing their work)

| ID | Task | Exit criteria |
|----|------|----------------|
| F.1 | Stable contracts for data participant flows rely on; document breaking changes. | **Done** — [`docs/participant-data-contracts.md`](../../participant-data-contracts.md). |
| F.2 | Keep full Chromium E2E green when rebasing; fix participant/fixture breaks only. | **Gate** — `npm run typecheck` + `npx playwright test --project=chromium` on each PR. |
| F.3 | Point host/admin work to [`2026-04-18-developer-b-host-admin-product.md`](2026-04-18-developer-b-host-admin-product.md) + kickoff. | **Unchanged** — Dev B docs remain source of truth for host/admin scope. |

---

## What this plan does not promise

- **Full MVP** from [`mvp-v1/02_MVP_SCOPE.md`](../../mvp-v1/02_MVP_SCOPE.md) (filters, payments, WhatsApp, etc.) — many depend on **Dev B** or product.
- **Legal approval** — you ship **surfaces**; counsel approves **text**.
- **Production Supabase** project setup — you document; infra may create resources.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-04-19 | Closeout: FR matrix, `participant-spa-deploy.md`, `participant-data-contracts.md`, `VITE_SUPPORT_EMAIL`, narrow-viewport E2E, phase status table updates |
| 2026-04-19 | Initial master plan + cross-links from docs index |
