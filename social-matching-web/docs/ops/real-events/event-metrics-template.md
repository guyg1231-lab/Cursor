# Real event — metrics (one row per event)

Copy this block for each real event. Replace values after the run. Use your SQL pack to fill numbers where helpful.

| Field | Value |
|--------|--------|
| **Event ID** | `________________________` |
| **Event title** | ________________________ |
| **Event date (local)** | ____ / ____ / ______ |
| **Operator / notes owner** | ________________________ |

## Live snapshot (fill before event starts)

Capture once registration is closed or frozen for ops (or at a defined gate). Use SQL pack **§2** (status counts) and **§1** / `events.max_capacity` for capacity; note **remaining offer slots** from your admin path or `remaining_event_offer_slots` RPC if you use it.

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

## Snapshot timestamp

Time captured: ________

(Important: this snapshot should be taken once before the event and not continuously edited)

## Event mode

| Field | Value |
|--------|--------|
| **Selection mode** | orchestrated / non-orchestrated |
| **Offer window** | ___ hours (timeout passed to offer / refill RPCs) |
| **Expiry job cadence** | manual / daily / automatic (describe) |

## Counts (after event or at gate milestones)

| Metric | Value | Notes |
|--------|------:|-------|
| **Offers issued** (M1 cohort size) | ___ | Distinct registrations with `temporary_offer` sent (see SQL pack) |
| **Committed from offer cohort** (confirmed + approved) | ___ / ___ | Numerator / denominator = M1 cohort |
| **Committed seat rate** | ___ % | (confirmed + approved from cohort) ÷ M1 |
| **Expiry rate** (est.) | ___ % | Cohort offered, ended waitlist without confirm/approve/cancel (see SQL + ops judgment) |
| **Cancellation rate** (post-offer / pre-event) | ___ % | Cancelled from awaiting_response / confirmed / approved before event |
| **Refill success** | ___ / ___ | Refills completed ÷ slots freed (operator count) |
| **Attendance** (if used) | ___ attended / ___ no-show / ___ unknown | Only if statuses recorded |

## Timing (optional first events)

| | |
|--|--|
| **Median / rough offer → confirm** | ___ hours (manual log or SQL approximation) |
| **Expire job runs** (count) | ___ |

## Short retro (5 bullets max)

1. What went well:  
2. What was confusing for operators:  
3. What was confusing for participants:  
4. One process change for next event:  
5. One thing to watch in SQL/logs next time:  
