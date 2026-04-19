# Docs Index

This folder holds the working documentation for `social-matching-web`.

## Main Sections

### `mvp-v1/`

Primary product-definition set for the current MVP baseline:

- product overview
- scope
- roles and permissions
- workflows
- functional requirements
- technical baseline
- questionnaire/apply/discovery specifics
- trust and UX principles

Start here:

- [`mvp-v1/README.md`](mvp-v1/README.md)

### `ops/`

Operational and execution-facing docs:

- vertical slices
- admin review notes
- host submission shortcut notes
- real-event runbooks and templates
- [`ops/public-readiness-smoke-checklist.md`](ops/public-readiness-smoke-checklist.md) — post-deploy smoke for participant app
- [`ops/participant-spa-deploy.md`](ops/participant-spa-deploy.md) — build, env, Supabase Auth URLs, hosting notes
- [`participant-data-contracts.md`](participant-data-contracts.md) — stability notes for participant data paths (Dev B handoff)

### `adr/`

Architecture decision records.

### `superpowers/specs/`

Approved implementation-driving specs.

Current primary spec:

- [`superpowers/specs/2026-04-18-near-term-buildout-foundation-design.md`](superpowers/specs/2026-04-18-near-term-buildout-foundation-design.md)

### `superpowers/plans/`

Execution plans derived from approved specs.

Current plan set:

- shared foundation normalization
- developer A participant workstream
- developer B host/admin workstream
- [`superpowers/plans/2026-04-19-dev-a-public-readiness-master-plan.md`](superpowers/plans/2026-04-19-dev-a-public-readiness-master-plan.md) — phased public-readiness plan (Dev A scope)
- [`superpowers/plans/2026-04-19-participant-fr-coverage-matrix.md`](superpowers/plans/2026-04-19-participant-fr-coverage-matrix.md) — FR-1…FR-35 vs participant implementation
- [`superpowers/plans/2026-04-21-dev-a-remaining-work-audit-and-plan.md`](superpowers/plans/2026-04-21-dev-a-remaining-work-audit-and-plan.md) — maintenance audit and gates

## Cleanup Rule

This docs folder should only contain purposeful documentation. Stray scratch
files, unnamed drafts, and local Finder artifacts should be removed or replaced
with properly named documents.
