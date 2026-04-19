# F-8: `AppHeader` mixes `t()` calls with hardcoded Hebrew literals

- **Status:** in-progress
- **Raised by:** Developer A (participant workstream), 2026-04-20
- **PR:** _(add merge PR link)_
- **Impact:** The single most-viewed component in the app (renders on every page) uses `t(...)` from the language context for some nav labels but falls back to hardcoded Hebrew string literals for the host CTA and the auth controls. Defeats the purpose of routing copy through a central i18n layer: any future translation effort will miss the hardcoded strings and leave the header half-translated.
- **Blocking:** No — all user-facing strings are currently Hebrew as expected, so there is no visible bug today. Leaves a landmine for the day the product ships an English (or any other) locale.
- **Owner:** Foundation (TBD)

## Current state

`src/components/shared/AppHeader.tsx` mixes two string sources.

### `t(...)` calls (via `useLanguage`), 5 distinct keys

```tsx
aria-label={t('navHome')}         // line 47
<Link to="/events">{t('navEvents')}</Link>           // line 54
<Link to="/questionnaire">{t('navQuestionnaire')}</Link>  // line 57
<Link to="/dashboard">{t('navDashboard')}</Link>     // line 60
<Link to="/admin/events">{t('navAdmin')}</Link>      // line 74
```

### Hardcoded Hebrew literals, 3 spots

```tsx
<Link to="/host/events">בקשת אירוע</Link>   // line 64
// signed-in sign-out button body:
יציאה                                         // line 90
// signed-out sign-in link body:
<Link to="/auth">כניסה</Link>                // line 94
```

`src/locales/he.ts` and `src/locales/en.ts` already exist, so the i18n
plumbing is in place; three string keys are simply missing.

## Why this is worth fixing

Today the header is half-translated and half-inlined. That is the worst
possible state: no one can grep `locales/` to see what the header says,
and anyone adding a new language will end up shipping a mixed-locale
header until someone notices the three literals.

It also sets a bad precedent. Any new workstream that reads `AppHeader.tsx`
as a template for their own top-level component will copy the "use
`t()` for some strings and not others" pattern.

## Proposed change

Pure i18n consistency. Zero behavior change.

1. Add three new keys to `src/locales/he.ts`:

   ```ts
   navHostRequest: 'בקשת אירוע',
   navSignOut: 'יציאה',
   navSignIn: 'כניסה',
   ```

2. Add the same three keys to `src/locales/en.ts` with English copy:

   ```ts
   navHostRequest: 'Request an event',
   navSignOut: 'Sign out',
   navSignIn: 'Sign in',
   ```

   Exact English copy to be agreed with product if this is user-facing
   English (it may not be — see open question 1 below).

3. Replace the three literals in `AppHeader.tsx`:

   ```tsx
   <Link to="/host/events">{t('navHostRequest')}</Link>
   // and
   {t('navSignOut')}
   // and
   <Link to="/auth">{t('navSignIn')}</Link>
   ```

That's the entire change. No new infrastructure, no visual change, no
routing change.

## Non-goals

- Not introducing a new i18n library or switching translation systems.
- Not changing which languages are supported.
- Not auditing every other component for mixed i18n — this ticket is
  narrowly scoped to the most-viewed header. A sweep can follow.
- Not changing the header's layout, behavior, or conditional rendering
  (signed-in vs. signed-out).

## Acceptance criteria

- [ ] `src/locales/he.ts` has keys `navHostRequest`, `navSignOut`,
      `navSignIn` with the Hebrew values above.
- [ ] `src/locales/en.ts` has the same three keys with English values.
- [ ] `AppHeader.tsx` contains zero inline Hebrew string literals.
- [ ] Every visible string in `AppHeader.tsx` is routed through
      `t(...)`.
- [ ] Every `t(...)` call resolves to the existing Hebrew string (no
      user-visible copy change). Verify by rendering `AppHeader` in a
      Vitest test under the default Hebrew locale and asserting the
      three previously-hardcoded strings (`בקשת אירוע`, `יציאה`,
      `כניסה`) still appear.
- [ ] `npx tsc -b --noEmit` clean.
- [ ] `npx playwright test --project=chromium` still green (existing
      selectors that match the literal Hebrew text continue to match,
      since the Hebrew locale emits the same strings the literals did).

## Open questions

1. Does the English locale need real translations for these three keys,
   or is English still a dev-tooling-only fallback? (Today the app runs
   Hebrew-only in production; the English file may be stubs only.)
2. Should the sign-out button's body go through `t()` only, or also its
   `aria-label` (currently absent)?
3. Are there other header-level copy strings we are forgetting — e.g.,
   the `ThemeToggle` or `LanguageToggle` internal labels? (Out of scope
   for this ticket but worth a note.)
