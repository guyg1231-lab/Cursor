#!/usr/bin/env node
/**
 * Grant global `admin` in public.user_roles for a user (creates auth user + profile if missing).
 *
 * Env (from .env.staging.local / .env.production.local / .env.ops.local loaded like other ops scripts):
 *   First argument: `staging` | `production` (default staging)
 *   Second argument: email (default circlesplatform@gmail.com)
 *
 * Uses STAGING_SUPABASE_URL + STAGING_SUPABASE_SERVICE_ROLE_KEY or
 *       SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY / PRODUCTION_* fallbacks.
 *
 * Usage:
 *   node scripts/ops/grant-admin-by-email.mjs staging circlesplatform@gmail.com
 */
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';
import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
for (const p of [join(root, '.env.staging.local'), join(root, '.env.production.local'), join(root, '.env.ops.local')]) {
  if (existsSync(p)) loadEnv({ path: p, override: p.includes('ops') });
}

const mode = (process.argv[2] || 'staging').toLowerCase();
const email = (process.argv[3] || 'circlesplatform@gmail.com').trim();

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Paginated scan (small projects); matches email case-insensitively. */
async function findAuthUserIdByEmail(supabase, targetEmail) {
  const want = targetEmail.toLowerCase();
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      throw new Error(`listUsers failed: ${error.message}`);
    }
    const hit = data.users.find((u) => (u.email || '').toLowerCase() === want);
    if (hit) {
      return hit.id;
    }
    if (data.users.length < 200) {
      return null;
    }
    page += 1;
  }
}

async function waitForProfileByUserId(supabase, userId, attempts = 15, delayMs = 400) {
  for (let i = 0; i < attempts; i += 1) {
    const { data, error } = await supabase.from('profiles').select('id, email').eq('id', userId).maybeSingle();
    if (error) {
      throw new Error(`profiles lookup: ${error.message}`);
    }
    if (data) {
      return data;
    }
    await sleep(delayMs);
  }
  return null;
}

async function ensureProfileForEmail(supabase, normalizedEmail) {
  const { data: byEmail } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', normalizedEmail)
    .maybeSingle();
  if (byEmail) {
    return byEmail;
  }

  let userId = await findAuthUserIdByEmail(supabase, normalizedEmail);

  if (!userId) {
    const password = randomBytes(24).toString('base64url');
    const { data: created, error: cErr } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: 'Circles Platform' },
    });
    if (cErr) {
      const msg = String(cErr.message || cErr).toLowerCase();
      if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
        userId = await findAuthUserIdByEmail(supabase, normalizedEmail);
      }
      if (!userId) {
        throw new Error(`createUser failed: ${cErr.message}`);
      }
    } else if (created?.user?.id) {
      userId = created.user.id;
    }
  }

  if (!userId) {
    throw new Error(`No auth user for ${normalizedEmail}`);
  }

  let profile = await waitForProfileByUserId(supabase, userId);
  if (!profile) {
    const { error: insErr } = await supabase.from('profiles').insert({
      id: userId,
      email: normalizedEmail,
      full_name: 'Circles Platform',
    });
    if (insErr) {
      throw new Error(`profiles insert failed: ${insErr.message}`);
    }
    profile = await waitForProfileByUserId(supabase, userId, 5, 200);
  }
  if (!profile) {
    throw new Error('Profile row still missing after provision');
  }
  return profile;
}

function resolveUrlAndServiceKey() {
  if (mode === 'production') {
    const url = (
      process.env.PRODUCTION_SUPABASE_URL
      || process.env.SUPABASE_URL
      || process.env.VITE_SUPABASE_URL
      || ''
    ).trim();
    const key = (
      process.env.PRODUCTION_SUPABASE_SERVICE_ROLE_KEY
      || process.env.SUPABASE_SERVICE_ROLE_KEY
      || ''
    ).trim();
    return { url, key };
  }
  const url = (process.env.STAGING_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const key = (process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY || '').trim();
  return { url, key };
}

async function main() {
  const { url, key } = resolveUrlAndServiceKey();
  if (!url || !key) {
    console.error('Missing Supabase URL or service_role key for mode:', mode);
    process.exit(2);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const normalized = email.toLowerCase();
  let profile;
  try {
    profile = await ensureProfileForEmail(supabase, normalized);
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exit(2);
  }

  const { error: rErr } = await supabase.from('user_roles').insert({ user_id: profile.id, role: 'admin' });
  if (rErr) {
    if (String(rErr.message || rErr).toLowerCase().includes('duplicate') || rErr.code === '23505') {
      console.log('Admin role already present for', email);
      process.exit(0);
    }
    console.error('Insert user_roles failed:', rErr.message);
    process.exit(1);
  }

  console.log('Granted admin to', email, 'user_id', profile.id);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
