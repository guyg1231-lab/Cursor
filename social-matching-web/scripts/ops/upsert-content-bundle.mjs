#!/usr/bin/env node
/**
 * Content ops bootstrap/update:
 * - upsert operator users + roles
 * - upsert published/active events
 * - upsert email templates
 *
 * Usage:
 *   node scripts/ops/upsert-content-bundle.mjs staging scripts/ops/content/production-bootstrap.sample.json
 *   node scripts/ops/upsert-content-bundle.mjs production /absolute/path/to/content.json
 */
import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import { existsSync, readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const VALID_ROLES = new Set(['participant', 'admin']);
const VALID_TEMPLATE_KEYS = new Set([
  'registration_received',
  'approved',
  'rejected',
  'reminder_evening_before',
  'location_morning_of',
  'temporary_offer',
]);

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
for (const p of [join(root, '.env.staging.local'), join(root, '.env.production.local'), join(root, '.env.ops.local')]) {
  if (existsSync(p)) {
    loadEnv({ path: p, override: p.includes('ops') });
  }
}

const mode = (process.argv[2] || 'staging').toLowerCase();
const contentPathArg = process.argv[3] || 'scripts/ops/content/production-bootstrap.sample.json';
const contentPath = isAbsolute(contentPathArg) ? contentPathArg : resolve(root, contentPathArg);

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

function parseJson(pathname) {
  if (!existsSync(pathname)) {
    throw new Error(`Content file not found: ${pathname}`);
  }
  const raw = readFileSync(pathname, 'utf8');
  return JSON.parse(raw);
}

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

async function ensureProfileByEmail(supabase, email, fullName) {
  const normalizedEmail = email.trim().toLowerCase();
  const { data: profileByEmail, error: byEmailError } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('email', normalizedEmail)
    .maybeSingle();
  if (byEmailError) {
    throw new Error(`profiles lookup failed: ${byEmailError.message}`);
  }
  if (profileByEmail) {
    return profileByEmail;
  }

  let userId = await findAuthUserIdByEmail(supabase, normalizedEmail);
  if (!userId) {
    const password = randomBytes(24).toString('base64url');
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName || normalizedEmail },
    });
    if (createError) {
      throw new Error(`createUser failed for ${normalizedEmail}: ${createError.message}`);
    }
    userId = created?.user?.id || null;
  }

  if (!userId) {
    throw new Error(`No auth user id found for ${normalizedEmail}`);
  }

  const { data: inserted, error: insertError } = await supabase
    .from('profiles')
    .upsert(
      { id: userId, email: normalizedEmail, full_name: fullName || normalizedEmail },
      { onConflict: 'id' },
    )
    .select('id, email, full_name')
    .single();
  if (insertError) {
    throw new Error(`profiles upsert failed for ${normalizedEmail}: ${insertError.message}`);
  }
  return inserted;
}

async function upsertOperatorUsers(supabase, operators = []) {
  const index = new Map();
  for (const operator of operators) {
    const email = String(operator.email || '').trim().toLowerCase();
    const fullName = String(operator.full_name || '').trim();
    const role = String(operator.role || 'participant').trim();
    if (!email) {
      throw new Error('operator.email is required');
    }
    if (!VALID_ROLES.has(role)) {
      throw new Error(`Unsupported role "${role}" for ${email}`);
    }

    const profile = await ensureProfileByEmail(supabase, email, fullName);
    index.set(email, profile.id);

    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({ user_id: profile.id, role }, { onConflict: 'user_id,role' });
    if (roleError) {
      throw new Error(`user_roles upsert failed for ${email}: ${roleError.message}`);
    }
  }
  return index;
}

function parseRequiredDate(value, label) {
  const iso = String(value || '').trim();
  if (!iso) {
    throw new Error(`${label} is required`);
  }
  const millis = Date.parse(iso);
  if (Number.isNaN(millis)) {
    throw new Error(`${label} must be a valid ISO date string`);
  }
  return new Date(millis).toISOString();
}

async function upsertEvents(supabase, events = [], operatorEmailToId = new Map()) {
  for (const event of events) {
    const id = String(event.id || '').trim();
    const title = String(event.title || '').trim();
    const city = String(event.city || '').trim();
    const status = String(event.status || 'active').trim();
    const isPublished = event.is_published !== false;
    const creatorEmail = String(event.created_by_email || '').trim().toLowerCase();
    const hostEmail = String(event.host_email || '').trim().toLowerCase();

    if (!id || !title || !city) {
      throw new Error(`event requires id/title/city. got: ${JSON.stringify({ id, title, city })}`);
    }
    const startsAt = parseRequiredDate(event.starts_at, `events[${id}].starts_at`);
    const registrationDeadline = event.registration_deadline
      ? parseRequiredDate(event.registration_deadline, `events[${id}].registration_deadline`)
      : null;

    const createdByUserId = creatorEmail ? operatorEmailToId.get(creatorEmail) || null : null;
    const hostUserId = hostEmail ? operatorEmailToId.get(hostEmail) || null : null;
    if (creatorEmail && !createdByUserId) {
      throw new Error(`event ${id}: created_by_email "${creatorEmail}" is not in operators list`);
    }
    if (hostEmail && !hostUserId) {
      throw new Error(`event ${id}: host_email "${hostEmail}" is not in operators list`);
    }

    const payload = {
      id,
      title,
      description: event.description || null,
      city,
      venue_hint: event.venue_hint || null,
      starts_at: startsAt,
      registration_deadline: registrationDeadline,
      max_capacity: Number.isFinite(event.max_capacity) ? Number(event.max_capacity) : null,
      status,
      is_published: isPublished,
      created_by_user_id: createdByUserId,
      host_user_id: hostUserId,
    };

    const { error } = await supabase.from('events').upsert(payload, { onConflict: 'id' });
    if (error) {
      throw new Error(`events upsert failed for ${id}: ${error.message}`);
    }
  }
}

async function upsertEmailTemplates(supabase, templates = [], operatorEmailToId = new Map()) {
  for (const tpl of templates) {
    const key = String(tpl.key || '').trim();
    if (!VALID_TEMPLATE_KEYS.has(key)) {
      throw new Error(`Unsupported template key "${key}"`);
    }
    const subject = String(tpl.subject || '').trim();
    const htmlBody = String(tpl.html_body || '').trim();
    if (!subject || !htmlBody) {
      throw new Error(`template "${key}" requires subject + html_body`);
    }

    const updatedByEmail = String(tpl.updated_by_email || '').trim().toLowerCase();
    const updatedBy = updatedByEmail ? operatorEmailToId.get(updatedByEmail) || null : null;
    if (updatedByEmail && !updatedBy) {
      throw new Error(`template "${key}": updated_by_email "${updatedByEmail}" missing in operators list`);
    }

    const { error } = await supabase.from('email_templates').upsert(
      {
        key,
        subject,
        html_body: htmlBody,
        updated_by: updatedBy,
      },
      { onConflict: 'key' },
    );
    if (error) {
      throw new Error(`email_templates upsert failed for ${key}: ${error.message}`);
    }
  }
}

async function main() {
  const { url, key } = resolveUrlAndServiceKey();
  if (!url || !key) {
    console.error(`Missing Supabase URL/service_role key for mode: ${mode}`);
    process.exit(2);
  }

  const content = parseJson(contentPath);
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const operators = Array.isArray(content.operators) ? content.operators : [];
  const events = Array.isArray(content.events) ? content.events : [];
  const emailTemplates = Array.isArray(content.email_templates) ? content.email_templates : [];

  const operatorEmailToId = await upsertOperatorUsers(supabase, operators);
  await upsertEvents(supabase, events, operatorEmailToId);
  await upsertEmailTemplates(supabase, emailTemplates, operatorEmailToId);

  console.log(
    JSON.stringify(
      {
        mode,
        content_path: contentPath,
        operators: operators.length,
        events: events.length,
        email_templates: emailTemplates.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
