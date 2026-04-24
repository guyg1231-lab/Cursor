# Circles Copy Workflow

## Goal
Keep copy quality and tone consistent across all product surfaces (participant, host, admin) with bilingual parity.

## Workflow
1. Define section intent
   - What action should the user take after reading this section?
   - Which audience state are we addressing (new visitor, returning user, admin)?

2. Draft in Hebrew first
   - Write clear, concrete, low-pressure copy.
   - Use glossary-approved terms.

3. Translate to English by intent
   - Preserve tone and function, not literal syntax.
   - Keep sentence length and clarity equivalent.

4. Run QA checklist
   - Validate with `circles-copy-qa-checklist.md`.
   - Fix any failures before code review.

5. Implement in i18n
   - Add keys in `src/locales/he.ts` and `src/locales/en.ts`.
   - Replace hardcoded UI text.

6. Verify in UI
   - Check both HE and EN in the same flow.
   - Validate RTL/LTR layout and ARIA labels.

## Review Rules
- No merge for copy changes without glossary and QA alignment.
- If new terminology is introduced, update glossary in same PR.
- If tone conflicts are found, follow `circles-language-guidelines.md` as source of truth.

## Definition Of Done
- Section text is clear and audience-fit (20-40 adults).
- HE and EN are both complete and equivalent in intent.
- No forbidden wording patterns are present.
- No hardcoded strings remain in updated surfaces.
