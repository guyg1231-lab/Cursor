# Participant routing: canonical event detail vs gathering slice

This note is for **developers** (not end-user copy). It explains how participant-facing URLs relate to each other and where new work should land.

## Canonical participant event detail

- **`/events/:eventId`** is the **canonical** participant route for reading event information, deciding whether to apply, and following the primary apply/status handoff. Discovery starts at **`/events`**, then participants open an event from the list.
- Implementation lives in [`src/pages/events/EventDetailPage.tsx`](../src/pages/events/EventDetailPage.tsx). The sibling apply route **`/events/:eventId/apply`** is part of the same product path.

## Legacy gathering slice

- **`/gathering/:eventId`** is a **legacy vertical-slice** route: it predates the canonical flow and keeps a **self-contained** experience on one page (view details, submit application, accept/decline temporary offers, see status).
- It remains **operational** because it is exercised by live Playwright vertical-slice specs:
  - [`e2e/slice-happy-path.spec.ts`](../e2e/slice-happy-path.spec.ts)
  - [`e2e/slice-decline-path.spec.ts`](../e2e/slice-decline-path.spec.ts)
- Page implementation: [`src/pages/gathering/GatheringPage.tsx`](../src/pages/gathering/GatheringPage.tsx).

## Authoring guidance

1. **New participant features** should default to **`/events/:eventId`** and **`/events/:eventId/apply`**, not to the gathering page, so navigation and architecture stay aligned with the canonical product.
2. **Do not remove** **`/gathering/:eventId`**. Removing it would break the slice E2E suite and any bookmarks or links still pointing at the old URL.
3. When you **must** change **`/gathering/:eventId`**, preserve the **selectors and visible copy** relied on by `slice-happy-path.spec.ts` and `slice-decline-path.spec.ts` (buttons, headings, form labels, status text). Prefer additive changes or coordinated test updates in those specs only when unavoidable.

## Route registration

Declared routes are listed in [`src/app/router/routeManifest.ts`](../src/app/router/routeManifest.ts). Treat that file as the inventory of paths; this document explains **intent** and **canonical vs legacy** usage, not the manifest format itself.

## Readiness route — /questionnaire

- In the route manifest, `/questionnaire` remains **auth: 'public'** (foundation-owned; do not change in Dev A passes).
- Anonymous visitors get a **preview** questionnaire: drafts persist **locally**; **Supabase** persistence for profile / `matching_responses` runs **after sign-in** (`ProfileBaseQuestionnaire`).
- Public access is **intentional** for onboarding; tightening guards is a **foundation** ticket, not Dev A.
