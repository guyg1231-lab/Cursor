# Failure mode quick reference — curated lifecycle

| Symptom | Likely cause | First operator action |
|--------|----------------|------------------------|
| Participant did not get offer email | Queue not processed; template/send failure | SQL: `email_queue` for that `registration_id` + `temporary_offer`. Re-run email processor; check `status` / errors. |
| Participant says they confirmed; DB still `awaiting_response` | Wrong account; confirm RPC not run; expiry | Check `event_registrations.user_id` vs their login. Retry confirm if still valid and not payment-required. |
| Many `awaiting_response` past `expires_at` | Expiry job not run or failed | Run `expire_offers_and_prepare_refill`. Re-check SQL **§9** in query pack. |
| Refill did not happen after cancel | Trigger/refill RPC not run; capacity math | Verify cancel moved from **approved / confirmed / awaiting_response**. Check capacity (`remaining_event_offer_slots` / status counts). Re-run refill procedure. |
| Wrong person received offer | Selection batch / rank mistake | **Pause** new offers. Audit `selection_outcome` / `selection_rank` for event. Fix via admin-only path; document. |
| Too many **confirmed** vs capacity | Manual DB edit or race | Stop manual edits. Count statuses that **hold** slots (**awaiting_response**, **confirmed**, **approved**). Reconcile with host and admin correction path. |
| Emails duplicate or spam | Idempotency / re-queue | Check `idempotency_key` on `email_queue` for repeats. Hold processor; escalate before mass re-send. |

**Escalation:** If data fix is unclear, snapshot SQL **§2 detail** + `email_queue` for affected IDs before changing rows.
