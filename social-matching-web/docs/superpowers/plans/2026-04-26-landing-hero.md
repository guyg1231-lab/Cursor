# Landing Hero (Reference-Light) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the landing page’s first “hero” experience with a reference-light RTL hero (badge, two-line headline with highlight, body, dual CTAs, soft blurred blobs) while keeping `AppHeader` unchanged and staying on design tokens.

**Architecture:** `LandingPage` stops passing `title`/`subtitle` into `PageShell` (so the shell does not render its own `h1`). A new top-level `<section>` implements the hero with decorative `absolute` layers and token-based colors. Copy lives in `he.ts` / `en.ts`. The secondary CTA scrolls to an in-page anchor on the existing “how it works” block; the profile questionnaire remains reachable from content below the hero so behavior stays discoverable. E2E assertions that assumed the old two-card hero are updated once.

**Tech Stack:** React 18, React Router, Tailwind, existing `Button` / `PageShell`, Playwright (`e2e/participant-foundation.spec.ts`), locale objects + `TranslationKey` inference from `he`.

---

### Task 1: Locale strings for the new hero (Hebrew + English)

**Files:**

- Modify: `src/locales/he.ts` (add keys after existing `landing*` block)
- Modify: `src/locales/en.ts` (mirror every new key with English copy)

- [ ] **Step 1: Add new keys to `he.ts`**

Insert after `landingCtaProfile` (or grouped with other `landing*` keys):

```ts
  landingHeroBadge: 'הגיע הזמן להתחבר מחדש',
  landingHeroHeadlineBefore: 'לחזור',
  landingHeroHeadlineHighlight: 'להיפגש',
  landingHeroBody:
    'Circles היא פלטפורמה שמחזירה את החיבור האנושי האמיתי לחיים. מעגלים לחוויות משותפות. קהילות קטנות, מפגשים משמעותיים, פנים אל פנים.',
  landingHeroCtaPrimary: 'לצפייה במפגשים',
  landingHeroCtaSecondary: 'איך זה עובד?',
```

Rationale: `landingHeroBody` intentionally includes the phrase `מעגלים לחוויות משותפות.` so the existing test `landing: page body includes Hebrew brand copy` keeps passing without coupling to removed `PageShell` title.

- [ ] **Step 2: Mirror keys in `en.ts`**

Use natural English equivalents, and include a recognizable English brand fragment if you add an English-specific body test later (optional). Example:

```ts
  landingHeroBadge: 'Time to reconnect',
  landingHeroHeadlineBefore: 'Get back to',
  landingHeroHeadlineHighlight: 'meeting in person',
  landingHeroBody:
    'Circles brings real human connection back into everyday life. Small communities, meaningful gatherings, face to face.',
  landingHeroCtaPrimary: 'Browse gatherings',
  landingHeroCtaSecondary: 'How it works?',
```

- [ ] **Step 3: Typecheck**

Run: `npm run build`  
Expected: PASS (no missing keys; `TranslationKey` is `keyof typeof he`).

- [ ] **Step 4: Commit**

```bash
git add src/locales/he.ts src/locales/en.ts
git commit -m "feat(i18n): add landing hero copy for reference-light layout"
```

---

### Task 2: Playwright — assert new hero semantics and CTAs

**Files:**

- Modify: `e2e/participant-foundation.spec.ts` (landing-related tests near lines 1725–1779)

- [ ] **Step 1: Replace the CTA visibility test with hero-aware expectations**

Find `test('landing page primary CTAs link to events and questionnaire'` and replace the body with:

```ts
  test('landing page hero CTAs: events and how-it-works anchor', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      await page.goto('/');
      const events = page.getByRole('link', { name: 'לצפייה במפגשים' });
      const how = page.getByRole('link', { name: 'איך זה עובד?' });
      await expect(events).toBeVisible();
      await expect(how).toBeVisible();
      await expect(events).toHaveAttribute('href', '/events');
      await expect(how).toHaveAttribute('href', /#landing-how-it-works$/);
    } finally {
      await ctx.close();
    }
  });
```

- [ ] **Step 2: Update the narrow viewport smoke test**

Replace `test('landing: narrow viewport keeps primary CTAs visible'` inner expectations with the same two link names as Step 1 (`לצפייה במפגשים`, `איך זה עובד?`).

- [ ] **Step 3: Add questionnaire link still on page**

Append a new test after the hero CTA test:

```ts
  test('landing page still exposes profile entry below hero', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      await page.goto('/');
      const profile = page.getByRole('link', { name: 'להתחיל פרופיל' });
      await expect(profile).toBeVisible();
      await expect(profile).toHaveAttribute('href', '/questionnaire');
    } finally {
      await ctx.close();
    }
  });
```

Implementation note: Task 3 must render `להתחיל פרופיל` as a `Link` (or `RouterLinkButton`) somewhere below the hero (e.g. in or beside the “how it works” card).

- [ ] **Step 4: Run the focused Playwright file**

Run: `npx playwright test e2e/participant-foundation.spec.ts -g "landing"`  
Expected: new/changed tests FAIL until Task 3 implements the UI.

- [ ] **Step 5: Commit**

```bash
git add e2e/participant-foundation.spec.ts
git commit -m "test(e2e): align landing assertions with reference-light hero"
```

---

### Task 3: Implement hero section and wire `LandingPage`

**Files:**

- Modify: `src/pages/landing/LandingPage.tsx`

- [ ] **Step 1: Stop passing built-in `PageShell` hero title**

Change the opening `PageShell` usage from:

```tsx
    <PageShell
      title={t('landingTitle')}
      subtitle={t('landingSubtitle')}
      headerTransparent
    >
```

to:

```tsx
    <PageShell headerTransparent>
```

This prevents `PageShell` from rendering a second hero `h1` (see `PageShell.tsx` conditional on `title || subtitle`).

- [ ] **Step 2: Add hero `<section>` as the first child inside `PageShell`**

Immediately after `<PageShell ...>`, insert a structure like:

```tsx
      <section
        className="relative overflow-hidden rounded-3xl border border-border/50 bg-card/40 px-4 py-16 text-center md:px-8 md:py-24"
        aria-labelledby="landing-hero-heading"
      >
        <div
          className="pointer-events-none absolute -top-32 end-0 h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-40 start-0 h-[24rem] w-[24rem] rounded-full bg-sage/10 blur-3xl"
          aria-hidden
        />
        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-accent/40 px-3 py-1 text-sm font-medium text-primary">
            {t('landingHeroBadge')}
          </p>
          <h1
            id="landing-hero-heading"
            className="text-4xl font-semibold leading-[0.95] tracking-tight text-foreground md:text-6xl md:leading-[0.92]"
          >
            <span className="block">{t('landingHeroHeadlineBefore')}</span>
            <span className="block text-primary">{t('landingHeroHeadlineHighlight')}</span>
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg md:leading-relaxed">
            {t('landingHeroBody')}
          </p>
          <div className="flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:flex-row-reverse">
            <Button asChild variant="primary" size="lg" className="rounded-full px-8">
              <Link to="/events">{t('landingHeroCtaPrimary')}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-8">
              <Link to="#landing-how-it-works">{t('landingHeroCtaSecondary')}</Link>
            </Button>
          </div>
        </div>
      </section>
```

Adjust Tailwind classes only within token families (`primary`, `sage`, `foreground`, `muted-foreground`, `border`, `card`, `accent`) — do not introduce arbitrary hex colors.

- [ ] **Step 3: Anchor the existing “how it works” block**

On the wrapper around the current right-hand “how it works” `Card` (the grid’s second column), add:

```tsx
        <div id="landing-how-it-works" className="scroll-mt-24">
          <Card className={tokens.card.surface}>
```

Wrap only that card so the hash scroll lands correctly.

- [ ] **Step 4: Expose profile CTA below hero (for Task 2 test)**

Inside that same card’s header or content top, add a visible link:

```tsx
            <RouterLinkButton to="/questionnaire" variant="ghost" size="sm" className="text-primary">
              {t('landingCtaProfile')}
            </RouterLinkButton>
```

Import `RouterLinkButton` from `@/components/ui/router-link-button` if not already imported.

- [ ] **Step 5: Remove duplicate primary CTA from old left card**

The first column `Card` currently duplicates “לצפייה במפגשים” / “להתחיל פרופיל”. Remove that inner `flex` of buttons from the first card (hero now owns primary + secondary). Keep eyebrow/title/body or trim if redundant — minimal change: remove only the duplicate button row.

- [ ] **Step 6: Run Playwright landing grep again**

Run: `npx playwright test e2e/participant-foundation.spec.ts -g "landing"`  
Expected: PASS.

- [ ] **Step 7: Run full unit/type pipeline**

Run: `npm run build`  
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/pages/landing/LandingPage.tsx
git commit -m "feat(landing): add reference-light hero with token blobs and anchors"
```

---

### Task 4: Spec alignment self-check (no code)

- [ ] **Step 1: Re-read** `docs/superpowers/specs/2026-04-26-landing-hero-design.md` **against the merged UI**

Confirm: single `h1`, navbar untouched, primary `/events`, secondary `#landing-how-it-works`, i18n-only strings, token-only colors.

- [ ] **Step 2: Note any intentional deviation**

If product wants the secondary CTA to go to `/questionnaire` instead, update the spec file in a follow-up commit before changing code again.

---

## Plan self-review (internal)

**Spec coverage:** Goal, guardrails, IA, visual mapping, interaction, a11y, i18n, responsive, files, risks, acceptance — each maps to Tasks 1–3 and Task 4 checklist.

**Placeholder scan:** None intended; all keys and test snippets are concrete.

**Type consistency:** New locale keys must exist in both `he` and `en` with identical property names.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-26-landing-hero.md`. Two execution options:

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach do you want?
