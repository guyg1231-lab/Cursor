# Mobile Discovery Map/Sheet Design

**Date:** 2026-04-21  
**Owner:** Codex  
**Status:** Proposed and user-aligned  
**Scope:** Participant-facing mobile discovery direction for `/events`, `/events/:eventId`, and the transition into `/events/:eventId/apply`.

---

## 1. Context

The discovery track already clarified the product intent:

- participant surfaces should feel warm, calm, human, intentional, and quietly premium
- discovery should answer the key questions quickly
- the product should not feel marketplace-like, operationally cold, or generic

During visual exploration, the chosen mobile direction is:

- **B — map + sheet**

with two explicit refinements from the user:

1. include **colored attendee circles** to show who is already in / already registered
2. keep the feeling closer to **Circles**, while borrowing later from the stronger **social feed** energy if useful

This spec defines the mobile interaction model and visual rules for that direction before implementation.

---

## 2. Decision Summary

The mobile discovery experience will use a **place-first map/sheet layout** as the main browse pattern.

### 2.1 Core interaction model

On mobile, the participant first sees:

1. a **sparse visual map layer**
2. a **bottom sheet** with the active event or event cluster
3. a clear route into the full event detail page

This makes discovery feel local and alive without becoming a noisy directory.

### 2.2 What stays from the selected direction

- map as the emotional entry point
- sheet as the information and action layer
- rounded, tactile surfaces
- warm gradients and soft indigo brand energy
- visible attendee circles as a light social signal

### 2.3 What does not carry over

- no dense pin explosion
- no feed that feels like infinite social content
- no loud “popular now” growth language
- no avatar wall that makes the experience feel dating-coded or status-driven

---

## 3. Product Feel Target

This direction must feel like:

- a thoughtful host helping you notice where something good is happening
- a small social pulse in the city
- a calm, beautiful product with real human presence

It must not feel like:

- a nightlife app
- a ticket marketplace
- a map full of promotions
- a utility app with cold geolocation UI

The closest shorthand is:

- **Circles first**
- **social energy second**

not the reverse.

---

## 4. Mobile Surface Model

### 4.1 `/events` — browse

The primary mobile browse screen is **map-first**.

Screen structure:

1. small status/top row
2. sparse map area
3. lifted bottom sheet
4. event summary inside the sheet
5. attendee circles inside the sheet
6. primary CTA into event detail

The sheet is the real content surface. The map is not a data viz product surface; it is contextual atmosphere plus locality.

### 4.2 `/events/:eventId` — event detail

The event detail page keeps some of the same visual DNA:

- warm atmospheric hero
- event-specific chips
- attendee circles
- structured “what matters” blocks
- strong CTA or status state

This page should feel like the natural next layer after the browse sheet, not like a different product.

### 4.3 `/events/:eventId/apply` — apply transition

Apply should not inherit the map.

It should inherit:

- the event identity
- the tone
- the small-group confidence
- the social signal that the event is real

The apply page may show the attendee circles or a lighter “already forming” signal near the top, but it should not become socially crowded. The form remains the main task.

---

## 5. Visual Structure Rules

### 5.1 Text alignment

This is locked now because it was explicitly called out.

#### Center-aligned text is allowed only in:

- hero/title moments
- map sheet title block
- high-level emotional framing lines
- CTA buttons

#### Text must remain reading-aligned, not centered, in:

- body copy
- explanatory paragraphs
- metadata rows
- step-by-step status text
- form labels and inputs

Reason:

Centered body text looks decorative but reduces readability and weakens the “quietly premium” feeling once the screen becomes information-heavy. Circles can use centered emphasis, but not centered reading blocks everywhere.

### 5.2 Typography lock

Typography must stay aligned with the existing design docs:

- **Primary UI font:** `Heebo`
- **Fallbacks:** `Assistant` -> `Noto Sans Hebrew` -> `Rubik` -> system sans

Semantic scale remains the existing platform definition:

- `xs`: 12/16
- `sm`: 14/20
- `md`: 16/24
- `lg`: 18/28
- `xl`: 20/30
- `2xl`: 24/34
- `3xl`: 30/40
- `4xl`: 36/46

No ad hoc font sizes should be introduced if a defined semantic step already fits.

### 5.3 Hierarchy rule

Each mobile screen should have only one visually dominant element at a time:

- browse: the map sheet
- detail: the hero/event identity block
- apply: the form block

If multiple sections compete equally, the screen will drift away from the calm Circles feel.

### 5.4 Color rule

Use the already-defined platform palette:

- warm neutral canvas
- soft indigo as primary action and key focus color
- sage only as supporting social/trust/organic accent

Attendee circles may use a small, curated set of warm and cool accent fills, but they should sit inside the existing palette family. They are decorative-social signals, not random rainbow badges.

---

## 6. Map/Sheet Layout Contract

### 6.1 Map behavior

The map layer on mobile should be:

- sparse
- quiet
- readable
- more scenic than analytical

Pins should be few and intentional.

The map is there to say:

- “this is happening in the city”

not:

- “analyze 17 options”

### 6.2 Bottom sheet behavior

The bottom sheet is the primary decision surface.

It should include:

1. neighborhood / local context title
2. event title
3. one-line event feel
4. time and rough location
5. attendee circles
6. CTA

It should not include:

- long trust essays
- full logistics
- too many secondary actions

### 6.3 Cluster state

If multiple events are relevant in one area, the sheet can show a lightweight cluster state:

- one main card
- one or two secondary compact cards below it
- pager dots or another subtle indicator

This is acceptable only if the sheet remains easy to parse in one glance.

---

## 7. Attendee Circles Contract

The attendee circles are approved as a product signal, but they need constraints.

### 7.1 Purpose

They communicate:

- this event is socially real
- other people are already in
- the room is beginning to form

### 7.2 They should not communicate

- popularity ranking
- status competition
- dating energy
- individual identity disclosure beyond light abstract presence

### 7.3 Visual rules

- circles are colored and warm, but not photo-real by default
- use 3–5 visible circles before collapsing into count text
- always pair circles with text like:
  - `4 כבר בפנים`
  - `3 נרשמו`
  - `2 כבר הצטרפו`

### 7.4 Privacy / tone rule

For MVP, circles should feel more like **friendly placeholders of real presence** than full public rosters. This keeps the product socially alive without over-exposing identity or creating social pressure.

---

## 8. Detailed Screen Contracts

### 8.1 Browse screen

Must communicate, above the fold:

- where in the city
- what the event is
- whether it is open
- whether people are already in
- what to tap next

### 8.2 Event detail screen

Must communicate:

- what this event feels like
- when it happens
- roughly where it is
- what happens after applying
- whether the event is still open

Attendee circles here move from “social spark” to “room is forming.”

### 8.3 Closed-event detail state

The closed event should remain visible with dignity.

In this direction, the closed state should still feel like:

- part of the same beautiful event page

not:

- a dead system notice

This is especially important because the map/sheet direction is visually emotional. If the event closes and the UI suddenly turns cold, trust breaks.

### 8.4 Apply screen

The apply screen should stay lighter and more focused:

- event identity at top
- short trust/status reminder
- attendee circles only if they support confidence without distracting from the form

The user should feel:

- “this is already becoming real”

not:

- “I am competing for attention in a social room”

---

## 9. Relationship To Social Feed

The user explicitly liked parts of the stronger social feed energy.

That energy should be treated as a **secondary influence**, not the chosen architecture.

Allowed future borrowings:

- stronger hero confidence
- slightly more alive thumbnail/cover treatment
- more momentum in the first card

Not allowed to borrow blindly:

- endless feed behavior
- overly busy social signals
- heavy popularity framing

If future iterations blend in more social-feed energy, the question should always be:

- does this still feel like Circles?

If the answer becomes “not really,” the blend has gone too far.

---

## 10. Accessibility and Readability

### 10.1 Text

- body copy must preserve the defined semantic sizes
- center alignment must not be used for paragraph-length content
- contrast must remain AA-safe on gradients and translucent sheets

### 10.2 Tap targets

- all main actions should stay comfortably thumb-sized
- chips are not the primary tap targets unless explicitly interactive
- bottom sheet CTA should be obvious and easy to reach

### 10.3 Motion

Map/sheet transitions should feel calm and spatial, not flashy. Motion is for orientation only.

---

## 11. Testing / Validation Expectations

Before implementation is considered complete, the UI should be checked for:

1. mobile browse readability
2. correct text alignment behavior
3. typography consistency against the platform scale
4. closed-event clarity
5. attendee-circle tone and restraint
6. RTL naturalness

This slice should also be visually checked against the existing `docs/design/visual-language-board.html` and the live Circles reference, to make sure it still belongs to the same family.

---

## 12. Final Direction Lock

The mobile discovery direction is now:

- **B / map + sheet**

with these locked refinements:

1. **attendee circles are included**
2. **text centering is limited to hero/title moments**
3. **fonts and sizes stay locked to the existing design-system spec**
4. **the UI must continue feeling like Circles first, not a generic social product**

This is the design baseline to plan and implement next.
