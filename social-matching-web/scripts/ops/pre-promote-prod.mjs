#!/usr/bin/env node
/**
 * Gate before promoting code to production: verify live bundles + local build, print reminders for DB/Git.
 *
 * Usage (from social-matching-web/):
 *   npm run ops:pre-promote-prod
 *
 * Does NOT deploy — only checks. Fails fast on verification errors.
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function run(label, cmd, args, opts = {}) {
  console.log(`\n→ ${label}`);
  execFileSync(cmd, args, { stdio: 'inherit', cwd: root, ...opts });
}

try {
  run('Staging bundle → staging Supabase ref', 'npm', ['run', 'ops:verify-staging-deploy-supabase']);
  run('Prod bundle → prod Supabase ref', 'npm', ['run', 'ops:verify-deploy-supabase']);
  run('SPA bundle text / asset sanity (staging vs prod)', 'npm', ['run', 'ops:compare-staging-prod-spa-bundles']);
  run('Typecheck', 'npm', ['run', 'typecheck']);
  run('Production build (local)', 'npm', ['run', 'build']);
} catch {
  process.exit(1);
}

console.log(`
✓ Pre-promote checks passed.

Next (human / CI):
1. Merge the same commit you verified on staging into the branch connected to the **production** Vercel project.
2. Trigger a **Production** deployment (Git push to that branch, or Vercel Dashboard → Redeploy with Production).
3. Database: apply **migrations from git** to the **prod** Supabase project in order — do NOT copy staging data/schema blindly.
   Re-check §8 acceptance SQL + docs/specs/2026-04-24-dev-staging-vs-prod-environment-parity-spec.md §12 (incl. migration-history / \`supabase db push\` notes).
4. Smoke: docs/ops/public-readiness-smoke-checklist.md

If \`vercel deploy --prod\` is blocked by team/git-author rules, use scripts/ops/prebuilt-prod-deploy.mjs (see header there).
`);
