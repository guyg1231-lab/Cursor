# Events Dense Browse - B2 Tighter Stack Design

**Date:** 2026-04-23  
**Status:** Proposed  
**Scope:** Participant-facing `/events` browse direction only, with continuity rules for `/events/:eventId` and `/events/:eventId/apply`  
**Audience:** Product, design, engineering, ops

---

## 1. What this document is for

This spec defines the new primary browse direction for `/events`.

The goal is to make the page feel more inventory-rich and faster to scan, while keeping the Circles identity intact:

- warm
- calm
- premium
- socially legible
- not marketplace-like

The chosen base direction is **B2. Tighter stack**.

That means:

- denser cards
- more events visible per screen
- softer layered depth
- rounded interactions
- attendee circles still visible on-card

This document is intentionally **not** a request to rebuild the whole participant journey. It is a browse-contract spec for the front door of the participant product.

---

## 2. Product intent

`/events` should answer, in one glance:

1. What is this event?
2. When is it?
3. Where is it roughly?
4. Is it open or closed?
5. Who else is already in or forming the room?

The page should help a participant decide whether to open detail, not force a decision immediately.

That is an important boundary:

- `/events` is for scanning and choosing
- `/events/:eventId` is for understanding
- `/events/:eventId/apply` is for committing

The browse page should feel like a calm front door, not a mini-application flow.

---

## 3. Decision summary

### Recommended direction: B2. Tighter stack

B2 is the best fit because it:

- keeps the soft, layered feel from Corner-like inspiration
- fits more cards on-screen than a deeper hero/object treatment
- preserves social proof without turning the page into a feed
- keeps the page premium rather than busy

### Why not the map-sheet-first base

The earlier map-sheet direction is not the primary browse contract anymore.

It remains useful as inspiration for:

- atmosphere
- soft layering
- rounded surfaces
- motion feel

But it should not define the main `/events` experience.

### Why this matters

The product needs more browse capacity without losing Circles calmness.

If the browse page becomes too large, too decorative, or too spatially dramatic, it stops helping participants compare options quickly.

If it becomes too utilitarian, it stops feeling like Circles.

This spec chooses the middle path.

---

## 4. Approaches considered

### Option A - Calm compact list

**What it is**

A single-column, highly restrained list with minimal controls and very little visual layering.

**Pros**

- safest and easiest to scan
- lowest design risk
- strongest readability on small screens

**Cons**

- underuses desktop width
- does not materially increase inventory density
- can feel too close to a plain directory

### Option B - Dense stack with soft filters

**What it is**

A compact, layered card grid with a small number of coarse filters and strong social proof on each card.

**Pros**

- best balance of density and calmness
- feels premium rather than transactional
- scales better across mobile and desktop
- keeps the page as a browse surface, not a marketplace

**Cons**

- requires discipline to avoid visual clutter
- filters must stay coarse or the page will drift

### Option C - Marketplace-style faceted grid

**What it is**

An aggressively configurable browse surface with many filters, sort controls, and highly dense inventory presentation.

**Pros**

- maximum scanning power
- best for large catalogs

**Cons**

- too close to marketplace energy
- hurts Circles calmness
- creates too many controls for the current product phase

### Recommendation

Choose **Option B**.

It gives us the inventory benefit the user wants, while still protecting the warm social tone that differentiates Circles.

---

## 5. Browse contract

### 5.1 Page role

`/events` is the participant front door.

It should:

- present only the currently visible participant events
- help people compare options quickly
- keep the next step simple and obvious
- avoid looking like an ops console or a classifieds page

It should not:

- act like a full search engine
- become a social feed
- replace the detail page
- surface admin-style sorting or diagnostics

### 5.2 Page header rule

The header should be short, calm, and useful.

It may explain:

- that these are open events
- how many are visible
- the general feeling of the catalog

It should not:

- tell a long brand story
- use marketing language
- occupy too much vertical space before the first card

### 5.3 Card destination rule

The primary action from browse cards is **open detail**.

The browse card should not become a direct apply surface.

Why:

- browse is for comparison
- detail is for confidence
- apply belongs one step deeper

If a future experiment adds a direct apply shortcut, it must stay secondary and never replace detail as the main browse affordance.

---

## 6. Card structure

The browse card is the most important unit in this spec.

It must feel like a tighter version of the existing event identity language, not a new object type.

### 6.1 Required card anatomy

Each card should include, in this order:

1. **State and status**
   - open / closed / deadline context
   - capacity context if useful
2. **Title**
   - the event title must remain the visual anchor
3. **Short vibe or preview**
   - one short line of atmosphere or description
4. **Key facts**
   - when
   - rough where
5. **Social proof**
   - attendee circles if available
6. **Single primary action**
   - open detail

### 6.2 Card density rule

The card should remain compact enough that a participant can compare multiple events without expanding anything.

Rules:

- keep the card to one primary surface and, at most, one nested inner surface
- do not stack many framed boxes inside one card
- do not add a second action row
- do not add category forests, review stars, or promotional banners

### 6.3 Copy rule

The card must sound like Circles, not like a marketplace.

Use:

- warm
- specific
- low-pressure
- human

Avoid:

- trending / popular / recommended language
- sales copy
- operational jargon
- status language without explanation

### 6.4 Title and preview rule

The title should stay dominant.

The description preview should be short enough to help scanning, not long enough to become a mini-article.

Rules:

- one short preview only
- truncate before the card becomes text-heavy
- the preview should support the decision, not replace detail

---

## 7. Density and spacing

### 7.1 Density goal

The page should show more events per screen without feeling cramped.

The right mental model is:

- shelf of curated cards
- not billboard wall
- not endless feed

### 7.2 Spacing rule

Use the compact end of the platform spacing scale.

Guidelines:

- card-to-card spacing should be visibly tighter than the detail page
- inner sections should stay breathable, not crowded
- the card should never feel like a form

### 7.3 Shape and depth rule

Keep the visual softness, but tighten the stack.

That means:

- rounded corners remain
- soft shadows remain subtle
- layered depth remains
- heavy elevation does not

The page should feel tactile, not floaty.

### 7.4 Surface count rule

One event card should not contain too many distinct visual shells.

Preferred structure:

- one outer card
- one inner utility panel at most
- one social proof region
- one action

If the card starts looking like a dashboard, the density has gone too far.

---

## 8. Filters

Filters are allowed, but they must stay calm and coarse.

### 8.1 Filter philosophy

The browse page should help people narrow choices without turning into a configurable marketplace.

The filter layer should feel like:

- gentle guidance
- not a control panel

### 8.2 Recommended filter set

Use only high-level filters that match how participants actually choose:

- time window
- rough area
- broad format or vibe

Do not add a long faceted system in this phase.

### 8.3 Filter rules

- keep the number of visible filters small
- do not require a modal or deep drawer to understand the page
- avoid sort controls that imply ranking or price comparison
- keep filter labels in Hebrew-first product language

### 8.4 Explicit exclusions

Do not add:

- search-first UI
- price filters
- popularity sorting
- review-score sorting
- host analytics filters
- advanced map toggles

If inventory becomes large enough later, filter depth can expand. That is a later-phase problem, not this spec.

---

## 9. Social proof

Social proof is non-negotiable on the browse card.

It is part of what makes Circles feel social rather than transactional.

### 9.1 Purpose

The social proof block should communicate:

- this event is real
- other people are already forming the room
- the room feels human, not empty

### 9.2 Required treatment

Use attendee circles on-card whenever the data exists.

Rules:

- show the circles directly on the card
- show a short human label alongside them
- limit visible circles to a small number
- use overflow treatment for larger counts

### 9.3 Tone rule

The social proof language should be warm and calm.

Prefer language like:

- already forming
- the room is taking shape
- small group, calm pace

Avoid:

- popular
- trending
- most booked
- social bragging

### 9.4 No avatar wall rule

Attendee circles are a social signal, not a social wall.

Do not:

- make the card mostly avatars
- show long lists of names on browse
- turn social proof into a feed mechanic

### 9.5 Fallback rule

If attendee count is unavailable, keep the social slot calm and informative.

Do not invent a count.
Do not remove the social meaning entirely.

---

## 10. Mobile vs desktop behavior

The browse contract should stay semantically the same across breakpoints.

Only the density changes.

### 10.1 Mobile behavior

Mobile should be:

- one column
- tight but breathable
- easy to scan with one thumb
- fully card-based

Rules:

- cards stack vertically
- the first screen should show meaningful inventory, not a large intro block
- attendee circles remain visible inside the card
- no hover-dependent information
- no alternate map-first experience

Mobile should feel like a compact shelf, not a tiny desktop grid.

### 10.2 Desktop behavior

Desktop should increase scanability, not complexity.

Rules:

- use a true grid, not a masonry feed
- 2 columns should be the default comfortable density
- 3 columns are allowed only when readability remains strong
- cards may have slightly richer spacing, but not richer logic

Desktop should feel like a broader shelf, not a dashboard.

### 10.3 Tablet rule

Tablet should interpolate between mobile and desktop rather than inventing a separate pattern.

Do not add a third browsing metaphor just for mid-size screens.

### 10.4 Hover and interaction rule

On desktop, hover may add a subtle lift or depth cue.

Do not use hover to hide essential information.

The participant should not need to hover in order to understand the card.

---

## 11. What stays from B1/B2 inspiration

The new direction borrows selectively.

### 11.1 Keep

- corner softness
- layered cards
- soft depth
- rounded interactions
- calm motion
- visible social presence
- premium warmth
- a clear hierarchy between card zones

### 11.2 Keep from B2 specifically

B2 is the chosen base because it:

- feels tighter and more inventory-rich
- still feels soft
- supports scanning
- avoids over-heroing the page

### 11.3 Keep from B1 only as influence

B1 can still inform:

- richness of depth
- tactile layering
- softness at the card edges

But B1 should not become the dominant layout idea.

### 11.4 Exclude

Exclude any influence that pulls the page toward:

- oversized single-object composition
- overly deep hero treatment
- too much white space between cards
- a showcase page rather than a browse page

---

## 12. What gets excluded

These are explicit non-goals for the primary `/events` browse contract.

- map-first browse as the default
- giant editorial hero blocks
- feed-like endless social content
- market-style pricing language
- popularity and ranking language
- crowded avatar walls
- too many filter controls
- multiple primary CTAs on one card
- a separate browse mode for each breakpoint
- a utilitarian list that loses softness

If any of those become necessary later, they should be introduced as separate decisions, not silently folded into this spec.

---

## 13. Consistency with detail and apply

The browse page must stay visually and semantically connected to:

- `/events/:eventId`
- `/events/:eventId/apply`

### 13.1 Shared language

The same event should feel like the same object across all three surfaces.

That means the browse card, detail hero, and apply header should all agree on:

- title
- tone
- time
- rough location
- openness / closed state
- social presence

### 13.2 Shared tone

The participant should feel a single story:

1. browse a calm, dense catalog
2. open a detail page for confidence
3. apply through a calm, event-specific route

### 13.3 What browse should not do

Browse should not:

- duplicate the full detail narrative
- explain the entire process
- try to sell the applicant on every possible point

That work belongs on detail and apply.

---

## 14. Hebrew-first and platform rules

This spec must stay aligned with the platform design system.

### 14.1 Language

- participant copy remains Hebrew-first
- English leakage should not appear in participant-facing browse labels
- tone should stay warm, specific, and low-pressure

### 14.2 Typography

- keep the platform typography hierarchy
- do not introduce a special browse-only typographic language
- titles should remain readable at a glance

### 14.3 Color and surfaces

- keep the warm canvas
- keep the soft indigo primary family
- use sage only as a supporting accent
- keep shadows and gradients subtle

### 14.4 Role separation

Participant browse must not borrow admin voice.

The page should never sound like an internal operations table.

---

## 15. Success criteria

This browse direction is successful if all of the following are true:

1. more events fit on the page without making it feel loud
2. attendee circles remain visible on-card
3. the page still feels warm and premium
4. the page does not feel marketplace-like
5. `/events` stays clearly distinct from `/events/:eventId`
6. `/events/:eventId/apply` remains the canonical action surface
7. mobile and desktop feel like the same product, not different products
8. the design stays aligned with Hebrew-first platform rules

---

## 16. Implementation guardrails for later

This section is intentionally not a build plan. It is only a boundary reminder for the next step after approval.

- do not widen scope into new screens
- do not reintroduce map-first as the primary model
- do not add filters that behave like marketplace controls
- do not remove social proof from browse cards
- do not let density erase softness

---

## 17. Source references

- `docs/superpowers/specs/2026-04-21-platform-design-system-spec.md`
- `docs/superpowers/specs/2026-04-21-circles-mvp-progress-and-audit-spec.md`
- `docs/superpowers/specs/2026-04-21-mobile-discovery-map-sheet-design.md`
- `docs/superpowers/specs/2026-04-21-design-vision-visual-companion.md`
- `docs/superpowers/specs/2026-04-20-dev-a-lifecycle-and-route-boundary-design.md`
- `docs/mvp-v1/10_EVENT_DISCOVERY_AND_DETAIL_SPEC.md`
- `docs/superpowers/specs/2026-04-20-dev-a-non-admin-flows-design.md`

