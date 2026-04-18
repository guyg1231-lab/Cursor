# Operator runbook — real events (next 1–3)

Curated lifecycle only: offers, confirm, expiry/refill, optional attendance. No payments in this runbook.

Use together with: **event metrics template**, **SQL query pack**, **failure quick reference**.

---

## Before registration closes

1. Confirm event is **published**, **active**, deadline and **capacity** match the host brief.  
2. Smoke-test **registration** as a test user (then cancel or leave as needed).  
3. Record **orchestrated vs non-orchestrated** for this event (one line in the metrics template).  
4. Assign **one named operator** for selection, offers, and expiry runs.

---

## After registration closes

1. Run SQL **§2** (counts by status) and save a screenshot or paste into the metrics file.  
2. If **orchestrated**: run your admin **selection** procedure (`record_event_selection_output` or equivalent); verify **selection_outcome** / **rank** in SQL **§2 detail**.  
3. If **non-orchestrated**: confirm pool is only **`pending` / `waitlist`** as expected—no accidental batch metadata.  
4. Note **registration IDs** of edge cases (late signups, host holds) if any.

---

## During selection / offer phase

1. Run **offers** per your current admin path (`offer_registration_with_timeout` or internal offer flow).  
2. After the email processor runs, run SQL **§3** / **§6** and spot-check **`temporary_offer`** = **sent** for each intended registration.  
3. Watch count of **`awaiting_response`** vs **capacity** (SQL **§2**).  
4. If something looks wrong, stop issuing offers and use **failure quick reference**.

---

## During expiry / refill

1. On each agreed cadence (e.g. daily): run **`expire_offers_and_prepare_refill`** for this event (or global, per your procedure).  
2. Record **returned counts** (expired / prepared) if the RPC returns them.  
3. Re-run SQL **§2** and **§9** (no rows should remain **awaiting_response** with **expires_at ≤ now()**).  
4. Run SQL **§5** / **§6** to see **refill** offers or **approved** emails; log **slot freed → refill sent (Y/N)** in the metrics template.  
5. Repeat until no stuck offers or event is closed for changes.

---

## Before the event

1. Run SQL **§7** (**committed seats**) vs **max_capacity**; resolve gaps with host.  
2. Confirm **no** stray **`awaiting_response`** with past **expires_at** (SQL **§9**).  
3. Send host-facing comms using your existing channel (no new product).

---

## After the event

1. If you use **attended / no-show**: record via your current admin path, then run SQL **§8**.  
2. Fill **event metrics template** (M1 cohort, rates, refill, attendance).  
3. **15-minute retro:** three bullets in the template + one process tweak for the **next** event.
