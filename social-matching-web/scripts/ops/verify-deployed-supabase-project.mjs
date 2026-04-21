#!/usr/bin/env node
/**
 * Fetches a deployed Vite bundle and asserts the baked-in Supabase project host.
 * Vite inlines import.meta.env at build time — this catches Production pointing at staging (or vice versa).
 *
 * Usage:
 *   node scripts/ops/verify-deployed-supabase-project.mjs --url https://social-matching-web.vercel.app --expect-ref nshgmuqlivuhlimwdwhe
 *
 * Env (optional):
 *   VERIFY_DEPLOY_URL, VERIFY_EXPECT_SUPABASE_REF
 */
let cliUrl;
let cliExpectRef;
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--url') cliUrl = argv[++i];
  if (argv[i] === '--expect-ref') cliExpectRef = argv[++i];
}

const baseUrl = (cliUrl || process.env.VERIFY_DEPLOY_URL || '').replace(/\/$/, '');
const expectRef = cliExpectRef || process.env.VERIFY_EXPECT_SUPABASE_REF || '';

if (!baseUrl || !expectRef) {
  console.error(
    'Missing --url / VERIFY_DEPLOY_URL or --expect-ref / VERIFY_EXPECT_SUPABASE_REF.\n' +
      'Example: node scripts/ops/verify-deployed-supabase-project.mjs --url https://app.example.com --expect-ref nshgmuqlivuhlimwdwhe',
  );
  process.exit(2);
}

const expectHost = `https://${expectRef}.supabase.co`;
const invalidFallback = 'https://invalid.supabase.co';

async function fetchText(url) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.text();
}

function extractAssetScripts(html) {
  const out = new Set();
  for (const m of html.matchAll(/src="(\/assets\/[^"]+\.js)"/g)) {
    out.add(m[1]);
  }
  return [...out];
}

function supabaseHostsInSource(js) {
  const hosts = new Set();
  for (const m of js.matchAll(/https:\/\/[a-z0-9]+\.supabase\.co/gi)) {
    hosts.add(m[0].toLowerCase());
  }
  return hosts;
}

const html = await fetchText(`${baseUrl}/`);
const scripts = extractAssetScripts(html);
if (!scripts.length) {
  console.error('No /assets/*.js script tags found in index.html — cannot verify bundle.');
  process.exit(1);
}

const allHosts = new Set();
for (const path of scripts) {
  const js = await fetchText(new URL(path, `${baseUrl}/`).toString());
  for (const h of supabaseHostsInSource(js)) {
    allHosts.add(h);
  }
}

const realHosts = [...allHosts].filter((h) => h !== invalidFallback);

if (realHosts.length === 0) {
  console.error('No Supabase project URLs found in fetched JS (unexpected for this app).');
  process.exit(1);
}

if (realHosts.length > 1) {
  console.error('Multiple distinct Supabase hosts in bundle:', [...realHosts].sort().join(', '));
  process.exit(1);
}

const [only] = realHosts;
if (only !== expectHost) {
  console.error(
    `Deployed bundle uses ${only}\n` +
      `Expected production project host ${expectHost}\n` +
      'Fix Vercel Production env (VITE_SUPABASE_URL, keys, VITE_SUPABASE_PROJECT_ID), redeploy, then re-run this script.',
  );
  process.exit(1);
}

console.log(`OK: ${baseUrl} bundle targets ${only}`);
