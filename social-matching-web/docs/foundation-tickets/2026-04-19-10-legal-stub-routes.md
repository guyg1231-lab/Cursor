# F-10: Legal stub routes (`/terms`, `/privacy`)

- **Status:** done
- **Raised by:** Dev A (participant / public trust)
- **Impact:** Low — unblocks landing footer and smoke checklist until final copy exists.

## Current state (before)

No participant routes for terms or privacy; landing had no policy links.

## Proposed change

- Add `TermsPage` and `PrivacyPage` under `src/pages/legal/` with Hebrew-first placeholder copy.
- Register `/terms` and `/privacy` in `AppRouter.tsx` and `routeManifest.ts` (`auth: public`, `dataStatus: stubbed`).
- Link from `LandingPage` footer.

## Non-goals

- Final legal text (product + counsel).
- i18n keys for placeholder copy (inline Hebrew matches nearby landing copy).

## Acceptance criteria

- [x] `/terms` and `/privacy` render without auth.
- [x] Manifest documents both routes.
- [x] Landing exposes visible links to both routes.

## Open questions

- Replace stubs when approved copy is ready (product ticket).
