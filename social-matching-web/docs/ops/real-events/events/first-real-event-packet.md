# First real event — STAGING operator packet

**STAGING only.** Use this file for the **first** production-style run on the curated lifecycle via the **operator UI** in this repo.

**Prep context:**

- STAGING smoke event `798fb6a0-92d0-43b1-bc9d-b453752c4c81` was **removed** (no registrations; safe delete).
- Validation **Admin1** is **`ready_for_registration`** so **Create event** in the operator UI satisfies `events_insert_own_draft` RLS.

**STAGING app URL:** `http://localhost:5173` (validation baseline). **Supabase project ref:** `huzcvjyyyuudchnrosvx`.

Find-replace in [../queries/event_lifecycle_metrics.sql](../queries/event_lifecycle_metrics.sql): `00000000-0000-0000-0000-000000000000` → your **Event ID** below.

---

## Operator UI path (minimal — no code changes)

Sign in as an **admin** user (OTP). Then:

| Step | Where | What |
|------|--------|------|
| 1 | `/admin` or **Admin** in nav | Redirects to **`/admin/events`**. |
| 2 | **`/admin/events`** | Events **list** (title, starts, deadline, city, status, capacity). **Create event** → next row. |
| 3 | **`/admin/events/new`** | **Create** form → **draft insert** then **active + published**; lands on dashboard. |
| 4 | **`/admin/events/<eventId>`** | **Dashboard**: event header, live counts, participants **grouped by status**. |
| 5 | Same page — **Orchestrated selection** | Use **Copy** on each `registration_id` row; paste into **Selected** / **Waitlist** text areas → **Save selection** (`record_event_selection_output`). |
| 6 | Same page — per row | **Offer temporary spot (24h)** when the row is eligible (`offer_registration_with_timeout`). |
| 7 | Same page — **Expire/refill** | **Run expire_offers_and_prepare_refill** when the button is enabled (expired offers present). |

Email **queue/processor** is unchanged — run your existing STAGING job after offers.

---

## Event metrics (fill as you go)

| Field | Value |
|--------|--------|
| **Event ID** | `11111111-1111-4111-8111-111111111111` |
| **Event title** | MVP Staging Validation Event |
| **Event date (local)** | 21 / 04 / 2026 |
| **Operator / notes owner** | Admin1 validation owner |

### Live snapshot (before event starts)

| Field | Value |
|--------|------:|
| **Total registrations** | 0 |
| **pending** | 0 |
| **waitlist** | 0 |
| **awaiting_response** | 0 |
| **confirmed** | 0 |
| **approved** | 0 |
| **cancelled** | 0 |
| **Capacity** (`max_capacity`) | 8 |
| **Remaining offer slots** | 8 |

**Snapshot time (local):** 2026-04-21 12:20

### Event mode

| Field | Value |
|--------|--------|
| **Selection mode** | orchestrated |
| **Offer window** | 24 (fixed in UI today) or note actual RPC if you change tooling |
| **Expiry job cadence** | daily 09:00 + ad hoc |

### Counts (after event / milestones)

| Metric | Value | Notes |
|--------|------:|-------|
| **Offers issued** (M1) | 0 | |
| **Committed from cohort** | 0 / 0 | |
| **Committed seat rate** | 0 % | baseline before first live cycle |
| **Expiry rate** (est.) | 0 % | baseline before first live cycle |
| **Cancellation rate** (post-offer) | 0 % | baseline before first live cycle |
| **Refill success** | 0 / 0 | baseline before first live cycle |
| **Attendance** (if used) | 0 / 0 / 0 | |

### Timing & retro

| **Rough offer → confirm** | 0h (no offers yet) |
| **Expire job runs** (count) | 0 |

**Short retro:** (see [../event-metrics-template.md](../event-metrics-template.md) bullets)

---

## Day-of & after-event checklists

Same as [upcoming-event-packet.md](./upcoming-event-packet.md): **Day-of operator checklist**, **After-event retro checklist**, **Full run checklist**, **SQL sections**.

---

## Accepted post-MVP improvements

| Item | Owner | Target timeframe | Notes |
|------|-------|------------------|-------|
| Host communications surface (currently placeholder-only) | Dev B | First post-MVP sprint | Maintain MVP boundary: no host messaging system in launch scope. |
| Host follow-up write actions (currently read-only placeholder) | Dev B | First post-MVP sprint | Add only after first real-event stability check. |
| Admin diagnostics/audit deep tooling (currently placeholder route content) | Dev B + Ops | 2-4 weeks post-MVP | Keep current guarded route contract; expand internals post-launch. |

---

## References

- Rules: [../README.md](../README.md)  
- Generic packet template: [upcoming-event-packet.md](./upcoming-event-packet.md)  
- SQL pack: [../queries/event_lifecycle_metrics.sql](../queries/event_lifecycle_metrics.sql)  
- Runbook: [../operator-runbook.md](../operator-runbook.md)  
- Troubleshooting: [../failure-mode-quick-reference.md](../failure-mode-quick-reference.md)
