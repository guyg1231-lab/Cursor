# Operator packet — upcoming real event

**Copy or rename this file** when you lock the event (e.g. `events/2026-05-20-tel-aviv-salon.md`).  
Find-replace in `queries/event_lifecycle_metrics.sql`: `00000000-0000-0000-0000-000000000000` → your **Event ID** below.

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
| **Offer window** | 24 hours |
| **Expiry job cadence** | daily 09:00 + ad hoc |

### Counts (after event / milestones)

| Metric | Value | Notes |
|--------|------:|-------|
| **Offers issued** (M1) | 0 | distinct regs with `temporary_offer` sent |
| **Committed from cohort** | 0 / 0 | confirmed+approved from M1 / M1 |
| **Committed seat rate** | 0 % | baseline before first live cycle |
| **Expiry rate** (est.) | 0 % | baseline before first live cycle |
| **Cancellation rate** (post-offer) | 0 % | baseline before first live cycle |
| **Refill success** | 0 / 0 | baseline before first live cycle |
| **Attendance** (if used) | 0 / 0 / 0 | attended / no-show / unknown |

### Timing

| | |
|--|--|
| **Rough offer → confirm** | 0h (no offers yet) |
| **Expire job runs** (count) | 0 |

### Short retro (after event)

1. What went well:  
2. Operator confusion:  
3. Participant confusion:  
4. One process change next time:  
5. Watch next time (SQL/logs):  

---

## Accepted post-MVP improvements

| Item | Owner | Target timeframe | Notes |
|------|-------|------------------|-------|
| Host communications surface (currently placeholder-only) | Dev B | First post-MVP sprint | Keep host scope summary-only for MVP launch safety. |
| Host follow-up write actions (currently read-only placeholder) | Dev B | First post-MVP sprint | Add after launch once operator core path is stable. |
| Admin diagnostics/audit deep tooling (currently placeholder route content) | Dev B + Ops | 2-4 weeks post-MVP | Route exists and is guarded; deeper observability is deferred. |

## Day-of operator checklist

_Use the morning / few hours before the event starts._

- [ ] Run SQL **§7** — `committed_seats` matches **host-agreed** headcount (and §1 `max_capacity` if that is the contract).
- [ ] Run SQL **§9** — **no rows** (no `awaiting_response` with `expires_at` already passed).
- [ ] Export or copy **§2 detail** for `status in ('confirmed','approved')` → send **final guest list** to host on the usual channel.
- [ ] Quick scan **email_queue** for this `event_id` if anyone reports “no email” (optional sanity check).

---

## After-event retro checklist

- [ ] Record **attended** / **no-show** via your **existing** admin path (if you use those statuses).
- [ ] Run SQL **§8** and align with what you recorded.
- [ ] Fill **Counts**, **Timing**, and **Short retro** in this file (or paste into `event-metrics-template.md`).
- [ ] **15-minute** debrief: host + operator; note one concrete change for the **next** event.

---

## Full run checklist (this event)

### Before registration closes

- [ ] Admin: event **published**, **active**, deadline + **capacity** match host.
- [ ] Smoke-test register (then cancel or document).
- [ ] Fill **Event mode** above (orchestrated vs not, hours, expiry cadence).
- [ ] One named person owns selection + offers + expiry.

### After registration closes

- [ ] SQL **§1** + **§2** → paste into **Live snapshot** when you freeze registration for ops.
- [ ] **Orchestrated:** run `record_event_selection_output` with agreed IDs; **non-orchestrated:** confirm pool is pending/waitlist only, no stray batch metadata.
- [ ] SQL **§2** again (+ detail); save screenshot/CSV baseline.

### During selection / offer

- [ ] Issue offers per admin path; run **email processor**.
- [ ] SQL **§3** + **§6** — `temporary_offer` **sent** for intended regs.
- [ ] SQL **§2** — `awaiting_response` vs capacity makes sense.
- [ ] Each refill: log **slot freed → refill sent (Y/N)**.

### During expiry / refill

- [ ] Run `expire_offers_and_prepare_refill` on agreed cadence; note RPC counts if returned.
- [ ] SQL **§9** → should be **empty** after each run.
- [ ] SQL **§2** + **§6** (and **§5** if non-orchestrated **approved** path applies).

---

## SQL to run most often

| When | Sections |
|------|-----------|
| Health checks | **§1**, **§2** (counts + detail as needed) |
| After offers / refills | **§3**, **§6** |
| After expiry job | **§9**, then **§2** |
| Before event | **§7**, **§9** |
| After event | **§8** (if attendance) |

File: [../queries/event_lifecycle_metrics.sql](../queries/event_lifecycle_metrics.sql)

---

## More help

- Blank template: [../event-metrics-template.md](../event-metrics-template.md)  
- Full runbook: [../operator-runbook.md](../operator-runbook.md)  
- Troubleshooting: [../failure-mode-quick-reference.md](../failure-mode-quick-reference.md)  
- Worked example: [../examples/hypothetical-event-filled.md](../examples/hypothetical-event-filled.md)
