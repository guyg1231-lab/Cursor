# Admin-review slice

Minimal admin screen that closes the host-submission loop and lets us eventually
retire the `host_submit_gathering_dev_shortcut` RPC.

## Purpose

Take a host-submitted event from `status = submitted_for_review` to
`status = active, is_published = true` — or reject it — without touching any of
the already-validated participant/operator surfaces.

## Scope

In scope:

- One new admin-only route: `/admin/event-requests`
- One new page: `src/pages/admin/AdminEventRequestsPage.tsx`
  (extracted from the existing "Host requests" block on `OperatorEventsListPage`)
- One new nav link on `/admin/events` pointing at the new page
- E2E כיסוי מפוזר בקבצים קיימים (אין `e2e/slice-admin-review.spec.ts` בריפו):
  - `e2e/participant-foundation.spec.ts` — משטח מארח וכפתור **שליחה לבדיקה מנהלית**
  - `e2e/foundation-routes.spec.ts` — רישום הנתיב `/admin/event-requests` בקטלוג האדמין

Explicitly out of scope:

- No changes to `GatheringPage` (participant)
- No changes to `TeamGatheringPage` (operator)
- No changes to migration `017_vertical_slice_registration_rpcs.sql`
- No new DB surface, no new RPCs
- No broader admin dashboard redesign
- No discovery / marketplace / payments
- ~~No removal (yet) of `host_submit_gathering_dev_shortcut`~~ — the shortcut
  was removed on 2026-04-17 by migration 019. See
  [`host-submission-shortcut.md`](./host-submission-shortcut.md) for the
  removal notice.

## Actors

- **HOST1** — questionnaire-ready host user (`STAGING_HOST1_EMAIL`)
- **ADMIN1** — admin user (`STAGING_ADMIN1_EMAIL`)

## Flow

1. Host signs in, goes to `/host/events`, fills a new draft, clicks
   **שליחה לבדיקה מנהלית**. Row now has `status = submitted_for_review`,
   `is_published = false`, `host_user_id = null`.
2. Admin signs in, goes to `/admin/event-requests`, clicks **Approve & publish**
   next to the request. Existing `approveSubmittedEventRequest` runs a plain
   `update` on `public.events` authorized by the `events_update_admin` RLS
   policy. Row is now `status = active`, `is_published = true`,
   `host_user_id = created_by_user_id`.
3. From this point the event is indistinguishable from one published via the
   dev shortcut, so the already-validated participant + operator slice works
   against it unchanged.

## Backend contract

- Reuses the existing `events` table + `submitted_for_review` / `active` status
  values.
- Publish action = `approveSubmittedEventRequest(eventId)` in
  `src/features/admin/api.ts`. No new RPC. No `SECURITY DEFINER`.
- Reject action = `rejectSubmittedEventRequest(eventId)` — sets `status` to
  `rejected`, leaves `is_published = false`.
- RLS: `events_update_admin` grants the update; `is_admin(auth.uid())` gate is
  unchanged.

## UI surface

`/admin/event-requests` shows a list of `submitted_for_review` events with:

- title, creator, starts_at, registration_deadline, city, capacity
- **Approve & publish** and **Reject** buttons per row
- success / error banner at the bottom

`/admin/events` now has an **"לבקשות מארחים ממתינות"** link to the new page.
The submitted-for-review block has been removed from that page.

## How to run related E2E

```bash
npm run e2e -- participant-foundation.spec.ts
npm run e2e -- foundation-routes.spec.ts
```

הרצה מלאה של זרימת **אישור מנהל ופרסום** end-to-end דורשת כיום בדיקה ידנית או הרחבת טסט (אין ספק ייעודי אחד). הפריסה מניחה `STAGING_HOST1_EMAIL` + `STAGING_ADMIN1_EMAIL` בסטייג׳ (או משתני סביבה מקבילים). Auth: סיסמה + הזרקת session — ראו `e2e/fixtures/auth.ts`.

What automated tests cover today:

- משטח מארח: כפתור שליחה לבדיקה מנהלית נראה ב־`participant-foundation` (בהתאם לסצנה).
- קטלוג נתיבים: `/admin/event-requests` רשום לעבודת אדמין ב־`foundation-routes`.

What still relies on manual / future E2E:

- אדמין לוחץ **Approve & publish** ב־`/admin/event-requests` ומוודא `active` + `is_published` + `host_user_id` ב־DB.

## Current limitations

- Rejection path is covered only by unit-level trust (reject button wired to
  the existing API); no dedicated E2E test yet.
- `deleteEventsForCreator` cleans HOST1 events before the test to keep the
  admin list deterministic. This is a service-role helper; it does not touch
  any other user's events.
- The admin-review page is a list without paging or filtering. Fine for MVP
  validation; will need paging once volumes grow.

## Exit criteria — when to remove the host dev shortcut

Once all of the following are true we can drop `host_submit_gathering_dev_shortcut`
and turn off `VITE_ENABLE_HOST_DEV_SHORTCUT` everywhere:

1. `/host/events` is the canonical host submission surface in both staging and
   production (it already is — the shortcut page was additive).
2. `/admin/event-requests` is wired into real admin navigation / dashboard (or
   at least reachable from the top-level admin home for real reviewers).
3. כיסוי E2E אוטומטי מלא לזרימת approve-and-publish (או בדיקת smoke מתועדת ב־CI).
4. The dev-shortcut doc (`docs/ops/host-submission-shortcut.md`) is updated to
   reference the admin-review slice as the live replacement.

At that point the removal is a pure deletion + migration drop; no product
logic should change.
