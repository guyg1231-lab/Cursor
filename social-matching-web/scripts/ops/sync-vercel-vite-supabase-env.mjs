#!/usr/bin/env node
/**
 * Push Vite/Supabase browser env vars to a Vercel project so every build
 * (Production + Preview + Development) inlines the correct `import.meta.env`.
 *
 * Loads gitignored locals: `.env.staging.local`, then `.env.production.local` (override), then
 * `.env.ops.local` (override), so production and ops files win over staging. Variables already in
 * `process.env` are not replaced by staging; production and ops use dotenv `override` so they can
 * supersede earlier values for keys they define.
 *
 * Publishable / anon key (first match wins):
 *   1) Env / dotenv: `VITE_SUPABASE_PUBLISHABLE_KEY` when `VITE_SUPABASE_PROJECT_ID` or `VITE_SUPABASE_URL`
 *      host matches `SUPABASE_PROJECT_REF`; or `STAGING_SUPABASE_ANON_KEY` when `STAGING_PROJECT_REF` matches;
 *      or `PRODUCTION_SUPABASE_ANON_KEY` when `PRODUCTION_SUPABASE_PROJECT_REF` matches the target ref.
 *   2) Supabase Management API with `SUPABASE_ACCESS_TOKEN` or `~/.supabase/access-token`.
 *   3) `supabase projects api-keys --project-ref <ref> -o json` on PATH (macOS Keychain logins work;
 *      set `SUPABASE_SKIP_CLI=1` to disable).
 *
 * Vercel token (resolved in order):
 *   `process.env` / dotenv above, else Vercel CLI `auth.json` (macOS:
 *   `~/Library/Application Support/com.vercel.cli/auth.json`, Linux: `~/.local/share/com.vercel.cli/auth.json`).
 *
 * Optional (auto-filled from `vercel link` → `.vercel/project.json` if present):
 *   VERCEL_PROJECT_ID      — overrides linked `projectId`
 *   VERCEL_TEAM_ID         — overrides linked `orgId` when it is a team (team_…)
 *   SUPABASE_PROJECT_REF   — default nshgmuqlivuhlimwdwhe (production ref in this repo)
 *   DRY_RUN=1              — print actions only, no network writes to Vercel
 *
 * Usage:
 *   cp .env.ops.local.example .env.ops.local   # optional; vercel + supabase CLIs often enough on a dev Mac
 *   npm run ops:sync-vercel-vite-env
 */
import { execFileSync } from 'node:child_process';
import { config as loadEnv } from 'dotenv';
import { existsSync, readFileSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function loadRepoDotenv() {
  const staging = join(root, '.env.staging.local');
  const production = join(root, '.env.production.local');
  const ops = join(root, '.env.ops.local');
  if (existsSync(staging)) loadEnv({ path: staging });
  if (existsSync(production)) loadEnv({ path: production, override: true });
  if (existsSync(ops)) loadEnv({ path: ops, override: true });
}

loadRepoDotenv();

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

function trimEnv(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function extractRefFromSupabaseUrl(url) {
  const u = trimEnv(url);
  if (!u) return '';
  try {
    const host = new URL(u).hostname.toLowerCase();
    const m = host.match(/^([a-z0-9]{20})\.supabase\.co$/);
    return m ? m[1] : '';
  } catch {
    return '';
  }
}

/** When ref matches documented env, return anon / publishable key without hitting Management API. */
function resolvePublishableKeyFromEnv(targetRef) {
  const r = trimEnv(targetRef);
  if (!r) return '';

  const viteKey = trimEnv(process.env.VITE_SUPABASE_PUBLISHABLE_KEY);
  const vitePid = trimEnv(process.env.VITE_SUPABASE_PROJECT_ID);
  const viteUrl = trimEnv(process.env.VITE_SUPABASE_URL);
  const viteRefFromUrl = extractRefFromSupabaseUrl(viteUrl);

  if (viteKey && (vitePid === r || viteRefFromUrl === r)) {
    return viteKey;
  }

  const stagingRef = trimEnv(process.env.STAGING_PROJECT_REF);
  const stagingAnon = trimEnv(process.env.STAGING_SUPABASE_ANON_KEY);
  if (stagingRef === r && stagingAnon) {
    return stagingAnon;
  }

  const prodRef = trimEnv(process.env.PRODUCTION_SUPABASE_PROJECT_REF);
  const prodAnon = trimEnv(process.env.PRODUCTION_SUPABASE_ANON_KEY);
  if (prodAnon && prodRef === r) {
    return prodAnon;
  }

  return '';
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

function fetchSupabaseAnonViaCli(projectRef) {
  const r = trimEnv(projectRef);
  if (!r) throw new Error('Missing project ref for Supabase CLI');

  try {
    const out = execFileSync(
      'supabase',
      ['projects', 'api-keys', '--project-ref', r, '-o', 'json'],
      {
        encoding: 'utf8',
        maxBuffer: 5 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'ignore'],
        env: process.env,
      },
    );
    const keys = JSON.parse((out || '').trim());
    const anon = pickAnonKey(keys);
    if (!anon) {
      throw new Error('Supabase CLI returned keys but none matched anon/publishable.');
    }
    return anon;
  } catch (e) {
    const err = /** @type {NodeJS.ErrnoException} */ (e);
    if (err && err.code === 'ENOENT') {
      throw new Error(
        'Supabase CLI not found on PATH (`supabase`). Install from https://supabase.com/docs/guides/cli',
      );
    }
    if (e instanceof SyntaxError) {
      throw new Error(
        `Supabase CLI returned non-JSON (is the CLI logged in?): ${e.message.slice(0, 200)}`,
      );
    }
    throw e;
  }
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
    console.log(`Would set VITE_SUPABASE_URL=${viteUrl} once a Vercel token is available.`);
    process.exit(2);
  }

  let anon;
  let keySource = '';
  const fromEnv = resolvePublishableKeyFromEnv(ref);
  if (fromEnv) {
    anon = fromEnv;
    keySource = 'local env';
  } else if (supabasePat) {
    anon = await fetchSupabaseAnon();
    keySource = 'Supabase Management API';
  } else if (process.env.SUPABASE_SKIP_CLI === '1' || process.env.SUPABASE_SKIP_CLI === 'true') {
    console.error(
      'Missing Supabase access token and SUPABASE_SKIP_CLI is set. Unset SUPABASE_SKIP_CLI, set SUPABASE_ACCESS_TOKEN, '
        + 'or add matching VITE_SUPABASE_* / STAGING_* / PRODUCTION_* keys for this ref in .env.*.local.',
    );
    process.exit(2);
  } else {
    try {
      anon = fetchSupabaseAnonViaCli(ref);
      keySource = 'Supabase CLI';
    } catch (e) {
      console.error(e instanceof Error ? e.message : e);
      console.error(
        'Could not resolve anon/publishable key. Options: (1) matching VITE_SUPABASE_PUBLISHABLE_KEY + '
          + 'VITE_SUPABASE_PROJECT_ID (or URL) for this ref in .env.production.local / .env.ops.local, '
          + '(2) SUPABASE_ACCESS_TOKEN or ~/.supabase/access-token, '
          + '(3) `supabase login` and ensure `supabase projects api-keys --project-ref '
          + ref
          + ' -o json` works on this machine.',
      );
      process.exit(2);
    }
  }

  const masked = `${anon.slice(0, 8)}…${anon.slice(-4)}`;
  console.log('Publishable key source:', keySource);

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
    comment: `Supabase anon/publishable key for browser (RLS); source: ${keySource}`,
  });
  console.log('OK VITE_SUPABASE_PUBLISHABLE_KEY (encrypted)');

  console.log('\nDone. Trigger a new deployment on Vercel so the SPA rebuilds with inlined env.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
