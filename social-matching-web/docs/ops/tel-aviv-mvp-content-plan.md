# Tel Aviv MVP Content Plan

This plan aligns with `docs/mvp-v1/02_MVP_SCOPE.md`:

- one city only
- 3-5 categories
- up to 5 concurrent events in MVP

## Locked city

- Tel Aviv only (`city = "Tel Aviv"`)

## Category set (4)

1. Coffee Meetup
2. Urban Walk
3. Community Sport
4. Urban Culture

## Activities set (5)

1. Coffee meetup in Florentin
2. Sunset walk on the promenade
3. Volleyball group kickoff in Hayarkon Park
4. Coffee + short Dizengoff walk
5. Urban gallery round + coffee stop

## Tagging model (operational)

- Every event has:
  - one `category`
  - 3-4 `tags`
- `upsert-content-bundle` writes category/tags into event description as structured lines:
  - `קטגוריה: ...`
  - `תיוגים: #... #...`

This gives immediate searchable/visible tagging without changing schema.

## I18N recommendation

- Keep Hebrew as default participant language in production launch.
- Keep English text available on legal/guidelines pages for bilingual trust.
- Next step: migrate legal/guidelines page copy into shared translation dictionaries (`src/locales/he.ts`, `src/locales/en.ts`) after copy freeze.

## Safety / trust baseline

- Public pages now include:
  - `/terms`
  - `/privacy`
  - `/guidelines`

This mirrors common trust expectations seen in social activity products, while staying inside MVP scope.
