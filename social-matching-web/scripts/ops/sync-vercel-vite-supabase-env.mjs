#!/usr/bin/env node
/**
 * Push Vite/Supabase browser env vars to a Vercel project so every build
 * (Production + Preview + Development) inlines the correct `import.meta.env`.
 *
 * Loads `social-matching-web/.env.ops.local` first (gitignored via `.env.*.local`) so you can
 * keep tokens in one file and run `npm run ops:sync-vercel-vite-env` without exporting vars.
 * Shell env still wins if set.
 *
 * Requires (resolved in order):
 *   VERCEL_TOKEN — `process.env` / `.env.ops.local`, else Vercel CLI `auth.json` (macOS:
 *   `~/Library/Application Support/com.vercel.cli/auth.json`, Linux: `~/.local/share/com.vercel.cli/auth.json`).
 *   SUPABASE_ACCESS_TOKEN — `process.env` / `.env.ops.local`, else plain file `~/.supabase/access-token`
 *   if present (CLI fallback; Keychain-only logins still need the env var).
 *
 * Optional (auto-filled from `vercel link` → `.vercel/project.json` if present):
 *   VERCEL_PROJECT_ID      — overrides linked `projectId`
 *   VERCEL_TEAM_ID         — overrides linked `orgId` when it is a team (team_…)
 *   SUPABASE_PROJECT_REF   — default nshgmuqlivuhlimwdwhe (production ref in this repo)
 *   DRY_RUN=1              — print actions only, no network writes to Vercel
 *
 * Usage:
 *   cp .env.ops.local.example .env.ops.local   # fill in, never commit
 *   npm run ops:sync-vercel-vite-env
 */
import { config as loadEnv } from 'dotenv';
import { existsSync, readFileSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
loadEnv({ path: join(root, '.env.ops.local') });

function defaultVercelAuthJsonPaths() {
  const h = homedir();
  if (platform() === 'darwin') {
    return [
      join(h, 'Library', 'Application Support', 'com.vercel.cli', 'auth.json'),
      join(h, '.config', 'vercel', 'auth.json'),
    ];
  }
  if (platform() === 'win32') {
    const appData = process.env.APPDATA || join(h, 'AppData', 'Roaming');
    return [join(appData, 'xdg.data', 'com.vercel.cli', 'auth.json')];
  }
  return [
    join(h, '.local', 'share', 'com.vercel.cli', 'auth.json'),
    join(h, '.config', 'vercel', 'auth.json'),
  ];
}

function resolveVercelTokenFromCli() {
  for (const p of defaultVercelAuthJsonPaths()) {
    if (!existsSync(p)) continue;
    try {
      const data = JSON.parse(readFileSync(p, 'utf8'));
      const t = typeof data.token === 'string' ? data.token.trim() : '';
      if (t) return t;
    } catch {
      /* ignore */
    }
  }
  return '';
}

function resolveSupabaseAccessToken() {
  const fromEnv = (process.env.SUPABASE_ACCESS_TOKEN || '').trim();
  if (fromEnv) return fromEnv;
  const p = join(homedir(), '.supabase', 'access-token');
  if (!existsSync(p)) return '';
  try {
    return readFileSync(p, 'utf8').trim();
  } catch {
    return '';
  }
}

function loadVercelLinkedProject() {
  const path = join(root, '.vercel', 'project.json');
  if (!existsSync(path)) {
    return { projectId: '', orgId: '' };
  }
  try {
    const data = JSON.parse(readFileSync(path, 'utf8'));
    return {
      projectId: typeof data.projectId === 'string' ? data.projectId.trim() : '',
      orgId: typeof data.orgId === 'string' ? data.orgId.trim() : '',
    };
  } catch {
    return { projectId: '', orgId: '' };
  }
}

const linked = loadVercelLinkedProject();
const ref = process.env.SUPABASE_PROJECT_REF || 'nshgmuqlivuhlimwdwhe';
const vercelToken = (process.env.VERCEL_TOKEN || '').trim() || resolveVercelTokenFromCli();
const projectId = (process.env.VERCEL_PROJECT_ID || linked.projectId || '').trim();
const teamIdRaw = (process.env.VERCEL_TEAM_ID || '').trim();
const teamId =
  teamIdRaw
  || (linked.orgId && linked.orgId.startsWith('team_') ? linked.orgId : '');
const supabasePat = resolveSupabaseAccessToken();
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
    console.error(
      'Missing Supabase access token. Set SUPABASE_ACCESS_TOKEN in .env.ops.local, export it, '
        + 'or run `supabase login` so ~/.supabase/access-token exists (Keychain-only logins need the env var).',
    );
    process.exit(2);
  }

  const anon = await fetchSupabaseAnon();
  const masked = `${anon.slice(0, 8)}…${anon.slice(-4)}`;

  if (!projectId) {
    console.error(
      'Missing Vercel project id. Set VERCEL_PROJECT_ID in .env.ops.local, or run `vercel link` in social-matching-web/ (creates .vercel/project.json).',
    );
    process.exit(2);
  }

  if (!vercelToken) {
    console.error(
      'Missing Vercel token. Log in with `vercel login` (stores auth.json), set VERCEL_TOKEN in .env.ops.local, '
        + 'or create a token at https://vercel.com/account/tokens',
    );
    console.log('Resolved from vercel link:', { projectId, teamId: teamId || '(none)' });
    console.log(`Would set VITE_SUPABASE_URL=${viteUrl}; VITE_SUPABASE_PUBLISHABLE_KEY=${masked}`);
    process.exit(2);
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
