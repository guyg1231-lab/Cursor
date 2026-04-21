#!/usr/bin/env node
/**
 * Push Vite/Supabase browser env vars to a Vercel project so every build
 * (Production + Preview + Development) inlines the correct `import.meta.env`.
 *
 * Loads `social-matching-web/.env.ops.local` first (gitignored via `.env.*.local`) so you can
 * keep tokens in one file and run `npm run ops:sync-vercel-vite-env` without exporting vars.
 * Shell env still wins if set.
 *
 * Requires (in process.env or .env.ops.local):
 *   VERCEL_TOKEN           — https://vercel.com/account/tokens
 *   VERCEL_PROJECT_ID      — Project → Settings → General → Project ID (prj_… or slug)
 *   SUPABASE_ACCESS_TOKEN  — Supabase account PAT (reads API keys)
 *
 * Optional:
 *   VERCEL_TEAM_ID         — Team id (team_…) if the project is under a team
 *   SUPABASE_PROJECT_REF   — default nshgmuqlivuhlimwdwhe (production ref in this repo)
 *   DRY_RUN=1              — print actions only, no network writes to Vercel
 *
 * Usage:
 *   cp .env.ops.local.example .env.ops.local   # fill in, never commit
 *   npm run ops:sync-vercel-vite-env
 */
import { config as loadEnv } from 'dotenv';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
loadEnv({ path: join(root, '.env.ops.local') });

const ref = process.env.SUPABASE_PROJECT_REF || 'nshgmuqlivuhlimwdwhe';
const vercelToken = process.env.VERCEL_TOKEN || '';
const projectId = process.env.VERCEL_PROJECT_ID || '';
const teamId = process.env.VERCEL_TEAM_ID || '';
const supabasePat = process.env.SUPABASE_ACCESS_TOKEN || '';
const dryRun = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';

const targets = ['production', 'preview', 'development'];

function pickAnonKey(keysJson) {
  const keys = Array.isArray(keysJson) ? keysJson : [];
  return (
    keys.find((k) => k.name === 'anon' && k.type === 'legacy')?.api_key
    || keys.find((k) => k.name === 'anon')?.api_key
    || keys.find((k) => k.type === 'publishable')?.api_key
    || keys[0]?.api_key
  );
}

async function fetchSupabaseAnon() {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys`, {
    headers: { Authorization: `Bearer ${supabasePat}` },
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`Supabase api-keys failed ${res.status}: ${JSON.stringify(body).slice(0, 500)}`);
  }
  const anon = pickAnonKey(body);
  if (!anon) {
    throw new Error('Could not resolve anon/publishable key from Supabase Management API response.');
  }
  return anon;
}

async function vercelUpsertEnv({ key, value, type, comment }) {
  const q = new URLSearchParams({ upsert: 'true' });
  if (teamId) q.set('teamId', teamId);
  const url = `https://api.vercel.com/v10/projects/${encodeURIComponent(projectId)}/env?${q}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${vercelToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key,
      value,
      type,
      target: targets,
      comment,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Vercel env upsert failed for ${key}: ${res.status} ${JSON.stringify(body).slice(0, 800)}`);
  }
  return body;
}

async function main() {
  const viteUrl = `https://${ref}.supabase.co`;
  const viteProjectId = ref;

  if (!supabasePat) {
    console.error('Missing SUPABASE_ACCESS_TOKEN (Supabase PAT with project read).');
    process.exit(2);
  }

  const anon = await fetchSupabaseAnon();
  const masked = `${anon.slice(0, 8)}…${anon.slice(-4)}`;

  if (!vercelToken || !projectId) {
    console.log('Dry info (missing VERCEL_TOKEN or VERCEL_PROJECT_ID — not calling Vercel):');
    console.log(`  VITE_SUPABASE_URL=${viteUrl}`);
    console.log(`  VITE_SUPABASE_PROJECT_ID=${viteProjectId}`);
    console.log(`  VITE_SUPABASE_PUBLISHABLE_KEY=${masked}`);
    console.log('\nSet VERCEL_TOKEN + VERCEL_PROJECT_ID (and optional VERCEL_TEAM_ID), then re-run without DRY_RUN.');
    process.exit(0);
  }

  if (dryRun) {
    console.log('[DRY_RUN] Would upsert on Vercel project', projectId, ':');
    console.log('  ', 'VITE_SUPABASE_URL', '=', viteUrl, '(plain)');
    console.log('  ', 'VITE_SUPABASE_PROJECT_ID', '=', viteProjectId, '(plain)');
    console.log('  ', 'VITE_SUPABASE_PUBLISHABLE_KEY', '=', masked, '(encrypted)');
    process.exit(0);
  }

  console.log('Upserting Vercel env for project', projectId, 'targets:', targets.join(', '));

  await vercelUpsertEnv({
    key: 'VITE_SUPABASE_URL',
    value: viteUrl,
    type: 'plain',
    comment: 'Supabase project URL for Vite (public)',
  });
  console.log('OK VITE_SUPABASE_URL');

  await vercelUpsertEnv({
    key: 'VITE_SUPABASE_PROJECT_ID',
    value: viteProjectId,
    type: 'plain',
    comment: 'Supabase project ref for diagnostics/links',
  });
  console.log('OK VITE_SUPABASE_PROJECT_ID');

  await vercelUpsertEnv({
    key: 'VITE_SUPABASE_PUBLISHABLE_KEY',
    value: anon,
    type: 'encrypted',
    comment: 'Supabase anon/publishable key for browser (RLS); from Management API',
  });
  console.log('OK VITE_SUPABASE_PUBLISHABLE_KEY (encrypted)');

  console.log('\nDone. Trigger a new deployment on Vercel so the SPA rebuilds with inlined env.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
