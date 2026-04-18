# First real event — STAGING operator packet

**STAGING only.** Use this file for the **first** production-style run on the curated lifecycle via the **operator UI** in this repo.

**Prep context:**

- STAGING smoke event `798fb6a0-92d0-43b1-bc9d-b453752c4c81` was **removed** (no registrations; safe delete).
- Validation **Admin1** is **`ready_for_registration`** so **Create event** in the operator UI satisfies `events_insert_own_draft` RLS.

**STAGING app URL:** TBD (your deployed Vite host). **Supabase project ref:** `huzcvjyyyuudchnrosvx`.

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
| **Event ID** | `TBD_PASTE_EVENT_UUID` |
| **Event title** | TBD |
| **Event date (local)** | TBD (dd / mm / yyyy) |
| **Operator / notes owner** | TBD |

### Live snapshot (before event starts)

| Field | Value |
|--------|------:|
| **Total registrations** | ___ |
| **pending** | ___ |
| **waitlist** | ___ |
| **awaiting_response** | ___ |
| **confirmed** | ___ |
| **approved** | ___ |
| **cancelled** | ___ |
| **Capacity** (`max_capacity`) | ___ |
| **Remaining offer slots** | ___ |

**Snapshot time (local):** TBD

### Event mode

| Field | Value |
|--------|--------|
| **Selection mode** | TBD — orchestrated / non-orchestrated |
| **Offer window** | 24 (fixed in UI today) or note actual RPC if you change tooling |
| **Expiry job cadence** | TBD — e.g. daily + ad hoc |

### Counts (after event / milestones)

| Metric | Value | Notes |
|--------|------:|-------|
| **Offers issued** (M1) | ___ | |
| **Committed from cohort** | ___ / ___ | |
| **Committed seat rate** | ___ % | |
| **Expiry rate** (est.) | ___ % | |
| **Cancellation rate** (post-offer) | ___ % | |
| **Refill success** | ___ / ___ | |
| **Attendance** (if used) | ___ / ___ / ___ | |

### Timing & retro

| **Rough offer → confirm** | TBD |
| **Expire job runs** (count) | ___ |

**Short retro:** (see [../event-metrics-template.md](../event-metrics-template.md) bullets)

---

## Day-of & after-event checklists

Same as [upcoming-event-packet.md](./upcoming-event-packet.md): **Day-of operator checklist**, **After-event retro checklist**, **Full run checklist**, **SQL sections**.

---

## References

- Rules: [../README.md](../README.md)  
- Generic packet template: [upcoming-event-packet.md](./upcoming-event-packet.md)  
- SQL pack: [../queries/event_lifecycle_metrics.sql](../queries/event_lifecycle_metrics.sql)  
- Runbook: [../operator-runbook.md](../operator-runbook.md)  
- Troubleshooting: [../failure-mode-quick-reference.md](../failure-mode-quick-reference.md)
