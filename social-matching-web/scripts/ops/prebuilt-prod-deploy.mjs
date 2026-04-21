#!/usr/bin/env node
/**
 * Production deploy when Vercel rejects remote CLI builds (git author not on team):
 * fetches the prod anon key via Supabase Management API, runs `npm run build` + `vercel build`,
 * then `vercel deploy --prebuilt --prod`.
 *
 * Requires: linked project (`vercel link`), logged-in CLI (`vercel whoami`).
 * Env:
 *   SUPABASE_ACCESS_TOKEN — Supabase personal access token (account → tokens)
 *   SUPABASE_PROJECT_REF    — optional, default nshgmuqlivuhlimwdwhe
 */
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL(import.meta.url)), '..', '..');
const ref = process.env.SUPABASE_PROJECT_REF || 'nshgmuqlivuhlimwdwhe';
const token = process.env.SUPABASE_ACCESS_TOKEN || '';

if (!token) {
  console.error('Set SUPABASE_ACCESS_TOKEN to a PAT with project read + auth write as needed.');
  process.exit(2);
}

const keysRes = await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys`, {
  headers: { Authorization: `Bearer ${token}` },
});
const keys = await keysRes.json();
if (!keysRes.ok) {
  console.error('api-keys failed', keysRes.status, JSON.stringify(keys).slice(0, 400));
  process.exit(1);
}
const anon = keys.find((k) => k.name === 'anon' && k.type === 'legacy')?.api_key;
if (!anon) {
  console.error('No legacy anon key in Management API response.');
  process.exit(1);
}

const env = {
  ...process.env,
  VITE_SUPABASE_URL: `https://${ref}.supabase.co`,
  VITE_SUPABASE_PUBLISHABLE_KEY: anon,
  VITE_SUPABASE_PROJECT_ID: ref,
};

execFileSync('npm', ['run', 'build'], { cwd: root, env, stdio: 'inherit' });
execFileSync('npx', ['--yes', 'vercel@latest', 'build', '--prod'], { cwd: root, env, stdio: 'inherit' });
execFileSync('npx', ['--yes', 'vercel@latest', 'deploy', '--prebuilt', '--prod', '--yes'], {
  cwd: root,
  env,
  stdio: 'inherit',
});
console.log('Done. Run: npm run ops:verify-deploy-supabase');
