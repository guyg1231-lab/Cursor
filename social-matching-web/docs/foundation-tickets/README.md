# Foundation Tickets

This folder tracks change requests against **foundation-owned** code: files that
no single workstream (Dev A participant, Dev B host/admin) is allowed to modify
unilaterally because they cut across all workstreams.

## What qualifies as foundation-owned

- `src/components/shared/*` — route state primitives, `PageShell`, `StatusBadge`, etc.
- `src/components/ui/*` — base UI primitives (`Card`, `Button`, `Link`, …).
- `src/app/router/*` — `AppRouter.tsx`, `routeManifest.ts`, `guards.tsx`.
- `src/lib/design-tokens.ts`.
- Any other file explicitly labeled as foundation-owned in a handoff or plan.

If you need one of these changed, open a ticket here instead of editing it
from your workstream.

## Ticket format

One markdown file per ticket, named:

```
YYYY-MM-DD-NN-short-slug.md
```

Where `NN` is a zero-padded two-digit counter within the day.

Each ticket should include:

- **Status:** `proposed` | `accepted` | `in-progress` | `done` | `rejected`
- **Raised by:** author workstream
- **Impact:** which workstreams are blocked or degraded until this lands
- **Current state:** what the code looks like today (quote it)
- **Proposed change:** concrete API / behavior change
- **Non-goals:** what this ticket is NOT
- **Acceptance criteria:** how we know it's done
- **Open questions:** anything requiring a decision before implementation

Tickets that are `done` should link to the merging PR and be kept in this
folder as historical record (do not delete).

## Index

| Ticket | Status | Impact |
| --- | --- | --- |
| [F-1: `RouteLoadingState` body prop](2026-04-20-01-routeloadingstate-body-prop.md) | done | Dev A (deferred), Dev B (upcoming) |
| [F-2: `/questionnaire` guard semantics](2026-04-20-02-questionnaire-guard-semantics.md) | proposed | Routing / spec alignment |
| [F-3: Phantom `/host/settings` route](2026-04-20-03-routemanifest-phantom-host-settings.md) | in-progress | Routing documentation accuracy |
| [F-4: Hardcoded English "Loading..." in guards](2026-04-20-04-guards-hardcoded-english-loading.md) | done | Participant UI English leak |
| [F-5: AdminRoute silent redirect](2026-04-20-05-adminroute-redirect-inconsistency.md) | proposed | Admin UX, guard testability |
| [F-6: StatusBadge narrow tone model](2026-04-20-06-statusbadge-tone-model.md) | proposed | All lifecycle surfaces |
| [F-7: PlaceholderPanel English + enum leak](2026-04-20-07-placeholderpanel-english-enum.md) | proposed | Placeholder surfaces |
| [F-8: AppHeader mixed i18n](2026-04-20-08-appheader-mixed-i18n.md) | proposed | i18n consistency |
| [F-9: Missing Link/Badge primitives](2026-04-20-09-missing-ui-primitives-link-badge.md) | proposed | Low priority, filed for visibility |
