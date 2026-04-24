#!/usr/bin/env node
/**
 * Compare deployed Vite SPA bundles (staging vs prod): main JS asset name + optional substring probes.
 * Different asset hashes usually mean different builds (commits). Substrings help catch copy drift in minified JS.
 *
 * Usage:
 *   node scripts/ops/compare-vercel-spa-bundles.mjs
 *   STAGING_URL=… PROD_URL=… node scripts/ops/compare-vercel-spa-bundles.mjs
 */
const stagingUrl = (process.env.STAGING_URL || 'https://social-matching-web-staging.vercel.app').replace(/\/$/, '');
const prodUrl = (process.env.PROD_URL || 'https://social-matching-web.vercel.app').replace(/\/$/, '');

/** Hebrew / mixed probes useful for nav + Auth copy drift (extend as needed). */
const DEFAULT_PROBES = [
  'שאלון',
  'פרופיל',
  'נשלח לך קוד',
  'נשלח קוד חד-פעמי',
  'אליכם',
  'עבורכם',
  'לא לוחצים על קישור',
  'ישירות ליעד',
];

function parseMainScriptPath(html) {
  const m = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
  return m ? m[1] : '';
}

async function loadText(url) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.text();
}

async function inspect(label, baseUrl, probes) {
  const html = await loadText(`${baseUrl}/`);
  const path = parseMainScriptPath(html);
  if (!path) {
    console.log(`${label}: no /assets/index-*.js in index.html`);
    return { label, baseUrl, path: '', js: '' };
  }
  const jsUrl = new URL(path, `${baseUrl}/`).toString();
  const js = await loadText(jsUrl);
  console.log(`${label}: ${path} (${(js.length / 1024).toFixed(1)} KiB)`);
  for (const p of probes) {
    const hit = js.includes(p);
    if (hit) console.log(`  ✓ contains: ${p}`);
  }
  const misses = probes.filter((p) => !js.includes(p));
  if (misses.length === probes.length) {
    console.log(`  (none of the default probes matched — strings may be split by minification)`);
  }
  return { label, baseUrl, path, js };
}

const probes = (process.env.BUNDLE_PROBES || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const effectiveProbes = probes.length ? probes : DEFAULT_PROBES;

const a = await inspect('STAGING', stagingUrl, effectiveProbes);
const b = await inspect('PROD', prodUrl, effectiveProbes);

console.log('');
if (a.path && b.path && a.path !== b.path) {
  console.log('Note: different main chunk filenames → almost certainly different builds (different deploy / commit).');
} else if (a.path === b.path) {
  console.log('Note: same chunk filename — still compare content or deployment timestamps if copy differs.');
}
