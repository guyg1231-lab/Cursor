# Example: one real-style event (filled metrics + checklist + SQL)

Hypothetical but internally consistent. **Event ID below is fake** — replace with your real UUID in SQL.

---

## 1. Filled `event-metrics-template` (copy pattern for your event)

# Real event — metrics (one row per event)

| Field | Value |
|--------|--------|
| **Event ID** | `c8f4e2a1-9b0d-4c7e-a3f2-11dd2299cc01` |
| **Event title** | Jerusalem Test Kitchen — May 2026 |
| **Event date (local)** | 17 / 05 / 2026 |
| **Operator / notes owner** | Dana K. |

## Live snapshot (fill before event starts)

| Field | Value |
|--------|------:|
| **Total registrations** | 24 |
| **pending** | 0 |
| **waitlist** | 14 |
| **awaiting_response** | 2 |
| **confirmed** | 7 |
| **approved** | 0 |
| **cancelled** | 1 |
| **Capacity** (`max_capacity`) | 12 |
| **Remaining offer slots** | 3 |

## Snapshot timestamp

Time captured: **2026-05-16 18:40** (local)

## Event mode

| Field | Value |
|--------|--------|
| **Selection mode** | orchestrated |
| **Offer window** | 36 hours |
| **Expiry job cadence** | daily at 09:00 + ad hoc after big drops |

## Counts (after event or at gate milestones)

| Metric | Value | Notes |
|--------|------:|-------|
| **Offers issued** (M1 cohort size) | 11 | `temporary_offer` sent, distinct `registration_id` |
| **Committed from offer cohort** (confirmed + approved) | 8 / 11 | 8 confirmed from that cohort |
| **Committed seat rate** | 73 % | 8 ÷ 11 |
| **Expiry rate** (est.) | 18 % | 2 returned to waitlist without confirm |
| **Cancellation rate** (post-offer / pre-event) | 9 % | 1 cancelled from `awaiting_response` |
| **Refill success** | 3 / 3 | three slots freed → three new offers completed |
| **Attendance** (if used) | 11 attended / 1 no-show / 0 unknown | 12 committed seats |

## Timing (optional first events)

| | |
|--|--|
| **Median / rough offer → confirm** | ~14 hours |
| **Expire job runs** (count) | 5 |

## Short retro (5 bullets max)

1. What went well: Refills kept the table full after two late declines.  
2. What was confusing for operators: One participant used a second email account; confirm showed up on wrong profile until we matched `user_id`.  
3. What was confusing for participants: Expiry time in email vs their timezone.  
4. One process change for next event: Add one line in host brief: “Offers expire 36h — clock is Israel time.”  
5. One thing to watch in SQL/logs next time: `email_queue` rows stuck `queued` after processor hiccup.  

---

## 2. Step-by-step operator checklist (this event only)

**Identifiers:** Event `c8f4e2a1-9b0d-4c7e-a3f2-11dd2299cc01`. Replace in SQL file with yours.

### Before registration closes

- [ ] Open event in admin; confirm **published**, **active**, **deadline** and **max_capacity = 12**.  
- [ ] Register yourself as smoke test; cancel that registration or leave documented.  
- [ ] Write on metrics sheet: **orchestrated**, **36h** offer window, **daily 09:00** expiry run.  
- [ ] Confirm you are the only person running **selection** and **expire** for this event.

### After registration closes

- [ ] Run SQL **§1** + **§2**; paste counts into **Live snapshot** (adjust numbers to match reality).  
- [ ] Run **`record_event_selection_output`** with the agreed 12 selected IDs and 8 waitlist IDs (example counts).  
- [ ] Run SQL **§2** again; confirm **selection_outcome** / **rank** look right on **§2 detail**.  
- [ ] Save CSV or screenshot of **§2 detail** as baseline.

### During selection / offer

- [ ] Issue **first wave** of offers (12 candidates) via your admin offer RPC; note time.  
- [ ] Run **email processor** / queue for this project.  
- [ ] Run SQL **§3** + **§6**; every selected person should show **`temporary_offer`** = **sent** when applicable.  
- [ ] Run SQL **§2** counts; **`awaiting_response`** should match “outstanding offers” (here: up to 12 minus immediate confirms if any).  
- [ ] Repeat for **refill waves** only after a slot frees (cancel or expiry); log each **slot freed → refill sent** on the metrics sheet.

### During expiry / refill

- [ ] Each morning at 09:00: run **`expire_offers_and_prepare_refill`** (event-scoped or global per your doc).  
- [ ] Write down RPC return counts if shown.  
- [ ] Run SQL **§9**; target **zero rows** (no `awaiting_response` with `expires_at` in the past).  
- [ ] Run SQL **§2** + **§6**; confirm expired people on **waitlist** and new **`awaiting_response`** for refills.  
- [ ] Run SQL **§5** if you use **approved** path anywhere; else skip.

### Before the event

- [ ] Run SQL **§7**; **committed_seats** must equal **12** (or host-agreed final).  
- [ ] Run SQL **§9** again; must be empty.  
- [ ] Send host final list from **§2 detail** filtered `status in ('confirmed','approved')`.

### After the event

- [ ] Record **attended** / **no-show** in your current admin path.  
- [ ] Run SQL **§8**.  
- [ ] Fill **Counts** + **Timing** + **retro** on the metrics sheet.  
- [ ] 15-minute retro with host.

---

## 3. SQL you will most likely run (essential only)

File: `docs/ops/real-events/queries/event_lifecycle_metrics.sql`  
**Action:** find-replace `00000000-0000-0000-0000-000000000000` → your real `event_id` once.

| When | Section | Why |
|------|---------|-----|
| After close, before event, after waves | **§1** | Event row: title, `starts_at`, `max_capacity`. |
| Constantly | **§2** (counts) | Status histogram — primary health check. |
| When debugging a person | **§2** (detail) | Full registration rows for one event. |
| After each offer / refill batch | **§3** + **§6** | Prove `temporary_offer` sent + cohort vs current status. |
| After expiry job | **§9** | Stuck `awaiting_response` past `expires_at` must be **empty**. |
| Before event | **§7** | Final **confirmed + approved** seat count. |
| After event (if attendance used) | **§8** | **attended** / **no_show** counts. |

**Usually skip for this flow:** §4 (logs fallback unless queue pruned), §5 (only if non-orchestrated **approved** emails matter for this run).

---

## Reference

- Blank template: [../event-metrics-template.md](../event-metrics-template.md)  
- Full query pack: [../queries/event_lifecycle_metrics.sql](../queries/event_lifecycle_metrics.sql)  
- Runbook: [../operator-runbook.md](../operator-runbook.md)
