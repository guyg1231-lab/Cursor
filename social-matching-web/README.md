# Social Matching Web

`social-matching-web` is the current web implementation surface for Circles, a
platform for curated small-group in-person social experiences.

This repository contains the product-facing app, host and admin/operator
surfaces, Supabase schema and functions, end-to-end test harnesses, and the
working product/spec documentation used to guide implementation.

## Current Status

The project is past pure scaffold stage and already includes:

- public and participant route surfaces
- host and admin/operator route surfaces
- Supabase-backed data access and migrations
- an end-to-end validated slice around gathering and operator flows
- current buildout specs and implementation plans under `docs/superpowers/`

The current near-term buildout direction is documented in:

- [`docs/superpowers/specs/2026-04-18-near-term-buildout-foundation-design.md`](docs/superpowers/specs/2026-04-18-near-term-buildout-foundation-design.md)

## Tech Stack

- React 18
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Supabase
- Playwright

## Getting Started

Install dependencies:

```bash
npm install
```

Start the app locally (defaults to **Vite mode `staging`**, so variables from **`.env.staging.local`** are picked up — same Supabase project as in [`.env.staging.example`](.env.staging.example)):

```bash
cp .env.staging.example .env.staging.local
# fill in VITE_SUPABASE_* and any other keys, then:
npm run dev
```

To use plain Vite `development` mode instead (only `.env`, `.env.local`, `.env.development*`), run:

```bash
npm run dev:development
```

Production-shaped build + static preview (needs **`.env.production.local`** or **`.env.local`** with `VITE_*` before `npm run build`, because values are inlined at build time):

```bash
npm run build
npm run preview
```

To build + preview against **staging** env files only:

```bash
npm run preview:staging
```

Typecheck:

```bash
npm run typecheck
```

Build:

```bash
npm run build
```

Run end-to-end tests:

```bash
npm run e2e
```

Install Playwright browsers once if needed:

```bash
npm run e2e:install
```

## Environment Files

Committed examples:

- `.env.example`
- `.env.production.example`
- `.env.staging.example`
- `e2e/.env.e2e.example`

Local machine-specific secrets should stay untracked, for example:

- `.env.staging.local` (used by `npm run dev` via `--mode staging`, and by `npm run build:staging` / `preview:staging`)
- `.env.production.local` (used by default `npm run build` / `vite preview` after a production build)
- `.env.local` (optional overrides; Vite merges this file in every mode)
- `e2e/.env.e2e`

## Project Structure

```text
src/                  App routes, features, shared components, contexts, utils
supabase/             Migrations, seed files, edge functions, config
e2e/                  Playwright specs and fixtures
scripts/              Project utility scripts
docs/                 Product specs, ops docs, ADRs, and execution plans
```

## Docs Guide

Start with:

- [`docs/README.md`](docs/README.md)

Important documentation groups:

- `docs/mvp-v1/` — product baseline and MVP definitions
- `docs/ops/` — operational notes, slices, and runbooks
- `docs/adr/` — architecture decisions
- `docs/superpowers/specs/` — current implementation-driving specs
- `docs/superpowers/plans/` — execution plans derived from approved specs

## Repo Notes

- Generated output and local machine artifacts should not be committed.
- Treat this project as the active implementation surface, not as a donor copy.
- Keep placeholder routes and shared foundations aligned with the current build
  spec rather than inventing parallel local conventions.
