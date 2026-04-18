# Real-world validation — operator kit

Minimal artifacts for the **next 1–3 real events** (curated lifecycle; no payments).

## Rules — first 1–3 real events

- **No manual DB edits** during the live flow (no ad hoc `UPDATE`/`DELETE` on registrations or related rows in the SQL editor).
- **Allowed without escalation:** existing **RPCs** / admin flows as already documented, **defined cancellation** paths (user or admin), **email queue re-run** / processor runs.
- **Anything else** (data fixes, status patches, one-off SQL): **do not patch silently** — log it in the event metrics / incident note (what, why, who approved) and treat as exception, not routine.

| Artifact | File |
|----------|------|
| Metrics template (copy per event) | [event-metrics-template.md](./event-metrics-template.md) |
| SQL query pack | [queries/event_lifecycle_metrics.sql](./queries/event_lifecycle_metrics.sql) |
| Step-by-step runbook | [operator-runbook.md](./operator-runbook.md) |
| Troubleshooting | [failure-mode-quick-reference.md](./failure-mode-quick-reference.md) |
| Worked example (filled metrics + checklist + SQL subset) | [examples/hypothetical-event-filled.md](./examples/hypothetical-event-filled.md) |
| **Upcoming event packet** (TBD fields + day-of / retro checklists) | [events/upcoming-event-packet.md](./events/upcoming-event-packet.md) |
| **First real event (STAGING)** — UI path + packet | [events/first-real-event-packet.md](./events/first-real-event-packet.md) |

**ADR (payment strategy, dormant Stripe):** [../../adr/0001-payment-strategy-provider-agnostic.md](../../adr/0001-payment-strategy-provider-agnostic.md)
