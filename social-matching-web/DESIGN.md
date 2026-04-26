---
version: alpha
name: Circles
description: Hebrew-first design system for a warm, calm, socially alive platform for discovering gatherings, activities, and circles.
colors:
  primary: "#5D68F2"
  primary-strong: "#4B55D8"
  on-primary: "#FAFAF8"
  primary-soft: "#E8EAFF"
  sage: "#6B7F5E"
  sage-soft: "#E9EEE4"
  periwinkle: "#9BA8C4"
  neutral: "#FAF9F7"
  surface: "#FDFBF7"
  surface-elevated: "#FFFEFC"
  ink: "#1A1A1A"
  text-muted: "#5C6168"
  border: "#E7E1D8"
  border-strong: "#D6CFC5"
  destructive: "#A34545"
  success: "#55664A"
typography:
  display-xl:
    fontFamily: Heebo
    fontSize: 64px
    fontWeight: 600
    lineHeight: 0.98
    letterSpacing: -0.03em
  display-lg:
    fontFamily: Heebo
    fontSize: 48px
    fontWeight: 600
    lineHeight: 1.04
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Heebo
    fontSize: 36px
    fontWeight: 600
    lineHeight: 1.18
    letterSpacing: -0.02em
  title-md:
    fontFamily: Heebo
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.34
    letterSpacing: -0.015em
  body-md:
    fontFamily: Heebo
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: Heebo
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.45
  label-md:
    fontFamily: Heebo
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.2
  label-sm:
    fontFamily: Heebo
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0.02em
rounded:
  sm: 12px
  md: 20px
  lg: 28px
  pill: 999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  2xl: 24px
  3xl: 32px
  4xl: 40px
  5xl: 48px
  6xl: 64px
components:
  button-primary:
    backgroundColor: "{colors.primary-strong}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.pill}"
    padding: 12px
    height: 44px
  button-secondary:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.primary-strong}"
    typography: "{typography.label-md}"
    rounded: "{rounded.pill}"
    padding: 12px
    height: 44px
  surface-default:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 24px
  hero-shell:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 24px
  event-card:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 20px
  status-badge:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary-strong}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.pill}"
    padding: 8px
  status-badge-success:
    backgroundColor: "{colors.sage-soft}"
    textColor: "{colors.success}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.pill}"
    padding: 8px
  status-badge-danger:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.destructive}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.pill}"
    padding: 8px
  input-default:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 16px
    height: 52px
  page-canvas:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.ink}"
    padding: 24px
  supporting-surface:
    backgroundColor: "{colors.periwinkle}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: 16px
  brand-accent-dot:
    backgroundColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    height: 10px
    width: 10px
  organic-accent-dot:
    backgroundColor: "{colors.sage}"
    rounded: "{rounded.pill}"
    height: 10px
    width: 10px
  divider-subtle:
    backgroundColor: "{colors.border}"
    height: 1px
    width: 100px
  divider-strong:
    backgroundColor: "{colors.border-strong}"
    height: 1px
    width: 100px
  copy-muted:
    textColor: "{colors.text-muted}"
    typography: "{typography.body-sm}"
---

# Circles DESIGN.md

## Overview

Circles is a Hebrew-first social product for discovering gatherings, activities,
and circles that feel worth leaving the house for.

The interface should feel:

- warm
- calm
- human
- quietly premium
- socially alive
- easy to enter

The interface should not feel:

- corporate
- marketplace-like
- dating-coded
- bureaucratic
- growth-hacky
- operationally cold

The emotional model is not "feed" and not "dashboard first". It is a curated
social shelf with a real sense that something is happening now.

The product is aimed at adults ages 20-40 with limited time and limited social
bandwidth. Every surface should help them answer, quickly and calmly:

- What is this?
- Is it for me?
- What happens next?

Hebrew and RTL are not adaptations. They are the native baseline for the
system.

## Colors

The Circles palette is built from warm neutrals, one confident indigo action
color, and a restrained sage support tone.

- **Primary (`#5D68F2`)** is the main brand and recognition color. It should
  lead active moments, highlight paths, and visible product identity.
- **Primary Strong (`#4B55D8`)** is the accessible action tone used when indigo
  carries text or button emphasis.
- **Primary Soft (`#E8EAFF`)** is the quiet supporting layer for badges, soft
  highlights, and selected states.
- **Sage (`#6B7F5E`)** is supportive and organic. It is for approved, calm, or
  trust-supporting signals. It is not the global CTA color.
- **Periwinkle (`#9BA8C4`)** is secondary and atmospheric. It can help with
  depth, gradients, and supporting metadata surfaces.
- **Neutral (`#FAF9F7`)** and **Surface (`#FDFBF7`)** create the warm, editorial
  canvas. Pure white should be used sparingly.
- **Ink (`#1A1A1A`)** keeps text grounded and legible.
- **Text Muted (`#5C6168`)** is for subtitles, metadata, and secondary support
  copy.
- **Border (`#E7E1D8`)** and **Border Strong (`#D6CFC5`)** create hierarchy
  without harshness.

Color use rules:

- Participant surfaces stay warm and layered.
- Admin surfaces reduce gradients and decorative color usage.
- Status colors never communicate meaning without text.
- Indigo leads action. Sage supports trust. Do not swap them casually.

## Typography

Typography should feel calm, legible, and native to Hebrew product UI.

- **Primary UI font:** `Heebo`
- **Fallback order:** `Assistant`, `Noto Sans Hebrew`, `Rubik`, system sans
- **Display and headings:** strong, soft, and confident, never aggressive
- **Body:** easy to scan, clean line lengths, no ornamental treatments
- **Labels and metadata:** compact, precise, still human

Typography rules:

- Use sans-only hierarchy across the product.
- Landing and participant discovery can use larger display scale for warmth and
  momentum.
- Metadata should stay compact and low-drama.
- Avoid all-caps as a dominant pattern in Hebrew-first surfaces.

## Layout

Circles uses a calm density model: enough information to make decisions quickly,
but never so much that the screen feels like work.

Layout principles:

- Use a 4px spacing rhythm.
- Prefer grouped, rounded surfaces over long flat stacks.
- Discovery pages should feel like shelves, not feeds.
- Cards should carry the essential decision data.
- Sections should have visible rhythm and breathing room, but not empty luxury.

Content density rules:

- One primary promise per section.
- One main CTA per block.
- Remove repeated explanations if the state, badge, or layout already says it.
- Convert operational text into badges, chips, or compact metadata when
  possible.
- Default to short labels over explanatory paragraphs.

Landing page rule:

- The landing page should behave like a live homepage, not a brochure.
- Events should appear high on the page and act as proof, not as a later detail.
- The scroll should alternate between emotional pull, live proof, and simple
  explanation.

## Elevation & Depth

Circles uses soft depth, not heavy shadow drama.

Hierarchy should come from:

- warm tonal layering
- rounded containment
- subtle borders
- restrained shadows
- light atmospheric gradients

Depth rules:

- Participant pages can use ambient gradients and layered cards.
- Admin pages should rely more on structure and less on atmosphere.
- Shadows should feel soft and quiet, never glossy or floating.
- Motion and depth should guide attention, not decorate empty surfaces.

## Shapes

The shape language is rounded, tactile, and approachable.

- Large cards and shells use generous radii.
- Inputs and secondary surfaces are slightly tighter.
- Pills remain fully rounded.

Shape rules:

- Use rounded forms to create warmth and ease.
- Avoid sharp, rigid corners in participant-facing flows.
- Do not mix too many corner systems on the same screen.
- Circles should feel soft with confidence, not cute and not toy-like.

## Components

Components should feel like one family across landing, browse, detail, apply,
and dashboard.

### Primary Button

The primary button is rounded, confident, and easy to spot without shouting. It
should sound like the next natural step in a social experience.

Good examples:

- "לצפייה במפגשים"
- "להגשה"
- "להמשך"

Avoid:

- checkout language
- urgency gimmicks
- generic SaaS wording

### Secondary Button

Secondary actions stay present but quiet. They should never compete visually
with the primary next step.

### Event Card

The event card is one of the most important product surfaces. It should make a
decision feel easy.

Every event card should prioritize:

1. title
2. time and place
3. group feel or size
4. live social signal
5. status or deadline
6. one clear action

An event card should not include repeated explanatory copy if the user can
already understand the event from the metadata and visual hierarchy.

### Hero Shell

Hero sections should feel editorial and alive, but not oversized for the sake
of drama. A hero should combine:

- one clear promise
- one short support line
- one main CTA
- visible proof that gatherings are real and current

### Status Badge

Badges carry lightweight meaning quickly. They should be short, consistent, and
useful.

Use badges for:

- open / closed
- reviewing
- few spots left
- small group
- host-led

Do not use badges as decoration only.

### Input and Form Surfaces

Forms should feel guided and respectful, never like an assessment center.

Rules:

- keep one idea per field
- explain why sensitive data is asked when needed
- use short labels
- avoid walls of helper text
- preserve warmth even in gated or review states

## Do's and Don'ts

Do:

- design participant pages as warm editorial product surfaces
- show that something real is happening now
- keep copy short, clear, and low-pressure
- use cards, chips, and status markers to reduce reading load
- make browse, detail, and apply feel like the same world
- use motion to support orientation and confidence

Don't:

- turn the landing page into a text-heavy explanation page
- repeat the same promise in headline, paragraph, and card copy
- make participant flows feel admin-like
- use hype, pressure, or dating-coded language
- let secondary actions become louder than the main action
- overload event cards with paragraphs

## Motion

Motion should feel smooth, soft, and intentional.

- **Fast:** 120ms
- **Base:** 200ms
- **Slow:** 320ms

Motion rules:

- use subtle reveal and lift on cards and shelves
- let hover and press states feel tactile, not bouncy
- keep page transitions calm and orientation-first
- respect reduced motion settings everywhere

Good motion feels like the interface is helping the user move forward, not
performing for attention.

## Screen Archetypes

### Landing

Landing is a living homepage. It should combine:

- emotional invitation
- live event proof
- a simple "how it works"
- trust signals
- one repeated primary CTA

### Events Browse

Browse is a curated shelf. It should feel scan-friendly, socially alive, and
compact enough to compare options easily.

### Event Detail

Detail is the room. It gives confidence, clarity, and a slightly deeper
emotional read of the experience without changing visual language.

### Apply

Apply is the threshold. It should feel light, honest, and reassuring about what
happens next.

### Dashboard

Dashboard is personal follow-through. It should feel calm and status-aware, not
administrative by default.

## Voice Alignment

Visual language and copy must support the same tone.

- warm
- specific
- low-pressure
- trust-aware
- concrete

Preferred product words:

- `מעגל`
- `מפגש`
- `חוויה משותפת`
- `חיבור אמיתי`

Avoid:

- empty community abstractions
- startup jargon
- pressure language
- institutional phrasing

If the UI already communicates the state visually, the copy should become
shorter, not longer.
