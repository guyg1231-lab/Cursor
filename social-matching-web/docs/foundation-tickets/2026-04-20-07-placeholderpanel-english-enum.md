# F-7: `PlaceholderPanel` leaks English copy and raw `contractState` enum

- **Status:** in-progress
- **Raised by:** Developer A (participant workstream), 2026-04-20
- **PR:** _(add merge PR link)_
- **Impact:** Every placeholder-backed route (host workspace stubs, admin diagnostics, admin audit) renders English fallback copy AND a raw English enum label (`real`, `mixed`, `stubbed`) inside a `StatusBadge` to Hebrew users. Visible on every stubbed surface a user visits.
- **Blocking:** No, but embarrassing for any Hebrew user who opens a placeholder route.
- **Owner:** Foundation (TBD)

## Current state

`src/components/shared/PlaceholderPanel.tsx`:

```tsx
export function PlaceholderPanel({
  title,
  body,
  contractState,
}: {
  title: string;
  body: string;
  contractState: 'real' | 'mixed' | 'stubbed';
}) {
  return (
    <Card className={tokens.card.surface}>
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-xl">{title}</CardTitle>
          <StatusBadge
            label={contractState}
            tone={contractState === 'stubbed' ? 'muted' : 'default'}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>This surface is intentionally minimal for now.</p>
        <p>{body}</p>
      </CardContent>
    </Card>
  );
}
```

Two separate issues in the same file:

1. **Raw enum as label** (lines 19-22): `label={contractState}` passes the
   TypeScript union value directly to the badge. A Hebrew user sees the
   ASCII string `stubbed` (or `real` / `mixed`) in a UI pill.
2. **Hardcoded English fallback copy** (line 26): `<p>This surface is
   intentionally minimal for now.</p>` is rendered on every placeholder
   page above whatever Hebrew `body` prop the caller supplies.

## Why this is worth fixing

Callers like `HostEventWorkspacePage`, `HostEventRegistrationsPage`,
`HostEventCommunicationsPage`, `HostEventFollowUpPage`,
`OperatorEventDiagnosticsPage`, and `OperatorEventAuditPage` all funnel
through `PlaceholderPanel` for their primary surface. Every one of those
pages shows an English sentence and an English enum label to Hebrew users,
regardless of what the caller passes in `title` / `body`.

`body` is Hebrew (callers supply it); the enum label and fallback paragraph
are not. The primitive is actively working against its callers' i18n.

## Proposed change

Three coordinated edits inside `PlaceholderPanel`.

### 1. Translate `contractState` for display

Introduce a small Hebrew dictionary inside the component (or in a sibling
helper module) mapping the enum to human copy. A straw-man dictionary:

| `contractState` | Suggested Hebrew |
| --- | --- |
| `real` | `ממשק פעיל` |
| `mixed` | `ממשק חלקי` |
| `stubbed` | `ממשק זמני` |

Exact Hebrew copy to be agreed with product. The mapping can live as a
module-local constant.

### 2. Replace the English fallback paragraph

Two sub-options:

- **Option A:** Replace the literal with a Hebrew default (e.g.,
  `הדף הזה מצומצם כרגע בכוונה.`). Keeps callers ergonomic.
- **Option B:** Drop the default paragraph entirely and require callers to
  pass any intro copy via the existing `body` prop (or a new optional
  `intro` prop). Forces per-page context but means every placeholder caller
  needs to think about what to say.

Option A is lower-friction; Option B produces better per-page copy if
Foundation has the bandwidth.

### 3. Use `tone: 'warning'` for `stubbed` once F-6 lands

Today the component does `tone={contractState === 'stubbed' ? 'muted' : 'default'}`.
Once F-6 widens `StatusBadge`'s tone union, `stubbed` should probably
render as `warning` instead of `muted` — it signals "this surface is
incomplete", which is exactly what `warning` is for. This ticket should
NOT introduce `warning` ahead of F-6; flag it as a follow-up within the
same PR chain.

## Non-goals

- Not changing which callers use `PlaceholderPanel` or migrating any of
  them to richer components.
- Not changing the visual structure (card, header layout, spacing).
- Not adding i18n infrastructure or pulling Hebrew copy from an external
  locale file — the dictionary is small and the primitive is
  shared-component-owned.

## Acceptance criteria

- [ ] `contractState` values render as Hebrew strings inside
      `StatusBadge` (via a module-local or helper-module dictionary).
- [ ] No English strings remain in `PlaceholderPanel.tsx`.
- [ ] Every existing caller continues to compile and render without
      changes.
- [ ] If Option B wins for the fallback paragraph, every existing caller
      is audited and updated (or the default is preserved for
      back-compat).
- [ ] `npx tsc -b --noEmit` clean.
- [ ] `npx playwright test --project=chromium` still green.

## Open questions

1. Exact Hebrew dictionary for `contractState`. Straw-man:
   `real → ממשק פעיל`, `mixed → ממשק חלקי`, `stubbed → ממשק זמני`.
2. Option A (Hebrew default fallback copy) or Option B (caller-provided,
   no default)?
3. Should the `contractState` badge actually be visible to end users at
   all, or is it really developer-facing metadata that should be hidden
   behind a dev-tools flag?
