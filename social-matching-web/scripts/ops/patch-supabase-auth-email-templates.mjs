#!/usr/bin/env node
/**
 * Patch hosted Supabase Auth: Hebrew OTP-first email templates, OTP length, optional Gmail SMTP.
 *
 * Token resolution (first hit):
 *   SUPABASE_ACCESS_TOKEN, `.env.ops.local`, `~/.supabase/access-token`,
 *   or if USE_CURSOR_MCP_SUPABASE_TOKEN=1 — token from `~/.cursor/mcp.json` entry `mcpServers.supabase`.
 *
 * Optional Gmail SMTP (Circles official sender):
 *   APPLY_SUPABASE_SMTP=1
 *   SUPABASE_AUTH_SMTP_PASS or GMAIL_APP_PASSWORD (Gmail App Password for the mailbox)
 *   SUPABASE_AUTH_SMTP_USER or GMAIL_USER (default circlesplatform@gmail.com)
 *   SUPABASE_AUTH_SMTP_HOST (default smtp.gmail.com), SUPABASE_AUTH_SMTP_PORT (default 587)
 *   SUPABASE_AUTH_SMTP_SENDER_NAME (default Circles), SUPABASE_AUTH_SMTP_ADMIN_EMAIL (defaults to SMTP user)
 *
 * Targets default to staging + production refs; override with SUPABASE_EMAIL_PATCH_REFS="ref1,ref2".
 *
 *   DRY_RUN=1              — log payload keys only, no PATCH
 *
 * Usage:
 *   npm run ops:patch-supabase-auth-email-templates
 */
import { config as loadEnv } from 'dotenv';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
for (const p of [join(root, '.env.staging.local'), join(root, '.env.production.local'), join(root, '.env.ops.local')]) {
  if (existsSync(p)) loadEnv({ path: p, override: p.includes('ops') });
}

function resolveSupabasePatFromCursorMcp() {
  if (process.env.USE_CURSOR_MCP_SUPABASE_TOKEN !== '1' && process.env.USE_CURSOR_MCP_SUPABASE_TOKEN !== 'true') {
    return '';
  }
  const mcpPath = join(homedir(), '.cursor', 'mcp.json');
  if (!existsSync(mcpPath)) return '';
  try {
    const j = JSON.parse(readFileSync(mcpPath, 'utf8'));
    const args = j?.mcpServers?.supabase?.args;
    if (!Array.isArray(args)) return '';
    const i = args.indexOf('--access-token');
    if (i === -1 || i + 1 >= args.length) return '';
    return String(args[i + 1]).trim();
  } catch {
    return '';
  }
}

function resolveSupabaseAccessToken() {
  return (
    (process.env.SUPABASE_ACCESS_TOKEN || '').trim()
    || (() => {
      const p = join(homedir(), '.supabase', 'access-token');
      if (!existsSync(p)) return '';
      try {
        return readFileSync(p, 'utf8').trim();
      } catch {
        return '';
      }
    })()
    || resolveSupabasePatFromCursorMcp()
  );
}

const dryRun = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';
const pat = resolveSupabaseAccessToken();
const defaultRefs = 'huzcvjyyyuudchnrosvx,nshgmuqlivuhlimwdwhe';
const refs = (process.env.SUPABASE_EMAIL_PATCH_REFS || defaultRefs)
  .split(',')
  .map((r) => r.trim())
  .filter(Boolean);

/** OTP-first bodies: include {{ .Token }}; do not claim digit count (server uses mailer_otp_length). */
function buildAuthMailerPatch() {
  const confirmationSubject = 'אישור ההרשמה — Circles';
  const magicSubject = 'קוד כניסה ל־Circles';

  const confirmationHtml = `
<h2>ברוכים הבאים ל־Circles</h2>
<p>זהו הקוד לאימות — הזינו אותו במסך ההתחברות:</p>
<p style="font-size:22px;font-weight:700;letter-spacing:0.25em">{{ .Token }}</p>
<p>אפשר גם לאמת דרך הקישור (אם ספק הדוא"ל חותך קישורים, השתמשו בקוד למעלה):</p>
<p><a href="{{ .ConfirmationURL }}">המשך לאימות</a></p>
`.trim();

  const magicHtml = `
<h2>כניסה ל־Circles</h2>
<p>קוד האימות שלכם:</p>
<p style="font-size:22px;font-weight:700;letter-spacing:0.25em">{{ .Token }}</p>
<p>או לחצו על הקישור:</p>
<p><a href="{{ .ConfirmationURL }}">המשך לאימות</a></p>
`.trim();

  return {
    mailer_subjects_confirmation: confirmationSubject,
    mailer_templates_confirmation_content: confirmationHtml,
    mailer_subjects_magic_link: magicSubject,
    mailer_templates_magic_link_content: magicHtml,
  };
}

function buildSmtpPatch() {
  const want = process.env.APPLY_SUPABASE_SMTP === '1' || process.env.APPLY_SUPABASE_SMTP === 'true';
  if (!want) return {};
  const pass = (process.env.SUPABASE_AUTH_SMTP_PASS || process.env.GMAIL_APP_PASSWORD || '').trim();
  if (!pass) {
    throw new Error(
      'APPLY_SUPABASE_SMTP=1 requires SUPABASE_AUTH_SMTP_PASS or GMAIL_APP_PASSWORD (Gmail App Password).',
    );
  }
  const user = (process.env.SUPABASE_AUTH_SMTP_USER || process.env.GMAIL_USER || 'circlesplatform@gmail.com').trim();
  const admin = (process.env.SUPABASE_AUTH_SMTP_ADMIN_EMAIL || user).trim();
  const sender = (process.env.SUPABASE_AUTH_SMTP_SENDER_NAME || 'Circles').trim();
  return {
    smtp_host: (process.env.SUPABASE_AUTH_SMTP_HOST || 'smtp.gmail.com').trim(),
    smtp_port: String(process.env.SUPABASE_AUTH_SMTP_PORT || '587').trim(),
    smtp_user: user,
    smtp_pass: pass,
    smtp_admin_email: admin,
    smtp_sender_name: sender,
  };
}

function buildBody() {
  return {
    ...buildAuthMailerPatch(),
    /** Keeps OTP numeric length consistent with the login UI (avoids accidental 8-digit config). */
    mailer_otp_length: 6,
    ...buildSmtpPatch(),
  };
}

async function patchRef(ref) {
  const body = buildBody();
  const url = `https://api.supabase.com/v1/projects/${encodeURIComponent(ref)}/config/auth`;
  if (dryRun) {
    console.log(`[DRY_RUN] Would PATCH ${ref} keys:`, Object.keys(body));
    return;
  }
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${pat}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`PATCH ${ref} failed ${res.status}: ${text.slice(0, 800)}`);
  }
  console.log(`OK ${ref} (${res.status})`);
}

async function main() {
  if (!pat) {
    console.error(
      'Missing Supabase PAT. Set SUPABASE_ACCESS_TOKEN, add ~/.supabase/access-token, '
        + 'use .env.ops.local, or USE_CURSOR_MCP_SUPABASE_TOKEN=1 with ~/.cursor/mcp.json (supabase entry).',
    );
    process.exit(2);
  }
  if (!refs.length) {
    console.error('No project refs in SUPABASE_EMAIL_PATCH_REFS');
    process.exit(2);
  }

  const smtpKeys = Object.keys(buildSmtpPatch());
  console.log('Patching Auth config for refs:', refs.join(', '));
  if (smtpKeys.length) {
    console.log('Including SMTP fields:', smtpKeys.join(', '));
  } else {
    console.log('SMTP: skipped (set APPLY_SUPABASE_SMTP=1 + app password to enable Gmail sender).');
  }

  for (const ref of refs) {
    await patchRef(ref);
  }
  if (!dryRun) {
    console.log('\nDone. OTP length set to 6; templates updated. Send a test OTP to verify.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
