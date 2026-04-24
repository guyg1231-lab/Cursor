# Circles Copy QA Checklist

Use this checklist before shipping any new or updated user-facing copy.

## 1) Message Clarity
- Can a 20-40 user understand what this section offers in under 3 seconds?
- Does the text answer at least one of: what is this, who is this for, what happens next?
- Is each sentence carrying one idea only?

## 2) Audience Fit (Ages 20-40)
- Does the tone feel warm, human, and naturally flowing, not trendy or performative?
- Does the language respect limited time and emotional bandwidth?
- Does it avoid hype, overpromises, and stiff institutional wording?

## 3) Circles Value Fit
- Does the copy mention shared experiences, real gatherings, or real connections where relevant?
- Is the value concrete (activity, circle, gathering) and not abstract ("community" only)?
- Is the CTA aligned with the section promise?

## 4) Pilot Constraints
- No payment messaging in landing hero/subtitle/how-it-works.
- No urgency gimmicks ("today only", "hurry", "last chance").

## 5) Language Consistency
- Terms are consistent with `circles-language-glossary-he-en.md`.
- Hebrew and English versions carry the same intent and emotional tone.
- ARIA labels and hidden text match the active language.

## 6) Technical Consistency
- New strings are in locale files (`he` and `en`) unless explicitly exempted.
- No new hardcoded user-facing text in components.
- Existing enums/contracts remain unchanged; localization is presentation-only.

## 7) Final Read Test
- Read aloud once in Hebrew and once in English.
- Remove jargon, cliches, and unnatural mixed-language phrasing.
- Confirm the final copy sounds like a calm human host, not a campaign.
