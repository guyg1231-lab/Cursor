# Production Content Ops

Run one repeatable flow to upsert:
- Operator users + app roles
- Published events
- Email templates

The flow is idempotent and driven by a JSON bundle.

## 1) Prepare a content bundle

Start from:

- `scripts/ops/content/production-bootstrap.sample.json`
- `scripts/ops/content/tel-aviv-production-bundle.json` (Tel Aviv-only MVP pack: 4 categories, 5 activities)

Copy it to a private ops file (recommended outside git) and edit:

- `operators[]`: `email`, optional `full_name`, `role` (`admin` or `participant`)
- `events[]`: fixed `id` (UUID for idempotency), titles/copy, schedule, capacity
- `email_templates[]`: approved message copy for each template key

## 2) Run on staging first

```bash
npm run ops:upsert-content-bundle -- staging scripts/ops/content/production-bootstrap.sample.json
```

## 3) Verify in app/UI

- `/events` shows realistic upcoming events
- host/operator pages load with the new operator account(s)
- message templates reflect updated copy

## 4) Run on production

```bash
npm run ops:upsert-content-bundle -- production /absolute/path/to/your-content.json
```

## Notes

- If an operator email does not exist in Auth, the script creates it and ensures a `profiles` row.
- `events` are upserted by `id`, so keep IDs stable.
- `email_templates` are upserted by `key`.
- Supported template keys:
  - `registration_received`
  - `approved`
  - `rejected`
  - `reminder_evening_before`
  - `location_morning_of`
  - `temporary_offer`
