# Circles Language Guidelines (HE + EN)

## Purpose
This document defines the product language for this repository.
It is inspired by the style in `circles-connect-human/docs`, but adapted to this app's real flows, screens, and user context.

## Audience Focus
- Primary audience: adults ages 20-40.
- Life context assumption: busy schedule, limited social energy, high preference for meaningful time.
- Copy goal: help users quickly decide "Is this for me?" and "What happens next?"
- Tone range: warm, clear, and naturally flowing for people in their 20s and 30s, while staying grounded and respectful for early 40s.

## Core Voice
- Warm, human, and intentional.
- Clear and practical: every message should help users know what to do next.
- Respectful and trust-aware, especially around matching and gathering flows.
- Calm confidence, not corporate wording and not hype wording.
- Sound like a smart, warm peer, not an institution.

## Writing Principles
- Prefer invitation language over interrogation language.
- Keep one message per sentence when possible.
- Keep CTAs short, concrete, and action-first.
- Use reassurance in sensitive flows, and explain why we ask for data.
- Avoid buzzwords and avoid emotionally manipulative language.
- Prefer concrete activity language over abstract community promises.
- Normalize social friction without sounding therapeutic or dramatic.

## Terminology Consistency
- Use one term per concept across participant, host, and admin surfaces.
- Prefer "מפגש" / "gathering" over mixed alternatives unless context requires it.
- Prefer "מעגל" / "circle" for recurring small-group context.
- Prefer "פרופיל" / "profile" for participant questionnaire context.
- Keep internal enum values unchanged; only localize presentation labels.

## Hebrew Style
- Primary language baseline is Hebrew with RTL-first UX.
- Use natural spoken-product Hebrew, not legalistic or bureaucratic phrasing.
- Keep punctuation and structure simple and scannable.

## English Style
- English is a full product language, not a literal translation layer.
- Preserve the same tone and emotional intent from Hebrew.
- Prefer product-native English phrasing over word-for-word conversion.
- Avoid startup-jargon English ("platform", "revolutionary", "best-in-class") in participant-facing copy.

## Good Voice Examples
- "A small gathering that feels easy to join."
- "Tell us a little about the kind of room you want."
- "You’re one step away from your next gathering."

## Too Stiff Examples
- "Complete the onboarding process to continue."
- "Submit your profile for review."
- "This platform facilitates curated experiences."

## UI Copy Rules
- Titles: concise, intention-revealing.
- Subtitles: one clear benefit or explanation.
- Buttons: 1-4 words when possible.
- Errors: explain what happened + what the user can do now.
- Statuses: short labels, consistent wording across lists/cards/details.

## Landing And Marketing Rules
- Hero must focus on shared experiences, real gatherings, and real connections.
- Keep a single primary CTA and repeat it consistently.
- "How it works" uses exactly 3 short steps with action + outcome.
- During pilot phase, do not mention payment in hero, subtitle, or step copy.

## Language Anti-Patterns
- Do not use: "רנדום", "רנדומליות", "find your tribe", "life-changing", "best-in-class".
- Do not use pressure language: "hurry", "only today", "don't miss out".
- Do not use cynical/negative framing: "לא מחפשים פנפלס", "no drama".
- Avoid empty abstractions: "authentic community" without concrete mechanism.

## Trust-Critical Copy
- State expectations clearly for each step.
- Clarify sequence in plain words and name the immediate next action.
- Avoid hidden assumptions; say what users should do now.

## Accessibility Copy
- ARIA labels and hidden labels must match active language.
- Tone should stay consistent in visible and non-visible copy.

## Rollout Policy
- New user-facing strings should be added through locale keys (`he` + `en`) unless there is a documented exception.
- Hardcoded strings are temporary only and must be migrated.
- Every new copy block should pass the copy QA checklist before release.
