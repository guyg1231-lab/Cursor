#!/usr/bin/env node
/**
 * Read-only smoke against the deployed participant SPA (no local dev server).
 * Usage: node scripts/ops/production-browser-smoke.mjs [baseUrl]
 */
import { chromium } from '@playwright/test';

const base = (process.argv[2] || 'https://social-matching-web.vercel.app').replace(/\/$/, '');
const supabaseHosts = new Set();

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ baseURL: base });
const page = await context.newPage();

page.on('request', (req) => {
  try {
    const h = new URL(req.url()).host;
    if (h.endsWith('.supabase.co')) supabaseHosts.add(h);
  } catch {
    /* ignore */
  }
});

const fail = (msg) => {
  console.error(msg);
  process.exitCode = 1;
};

try {
  await page.goto('/events', { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.getByText('טוענים…', { exact: true }).waitFor({ state: 'hidden', timeout: 25_000 }).catch(() => {
    fail('events: loading copy did not disappear within 25s');
  });
  const eventLink = page.locator('a[href^="/events/"]:not([href="/events/propose"])').first();
  const count = await eventLink.count();
  if (count < 1) {
    console.log('events: no /events/:id links found (empty discovery is OK if copy renders)');
  } else {
    await eventLink.click();
    await page.waitForURL(/\/events\/[^/]+$/, { timeout: 20_000 });
    const applyHref = page.locator(`a[href^="/events/"][href$="/apply"]`).first();
    if ((await applyHref.count()) > 0) {
      await applyHref.waitFor({ state: 'visible', timeout: 20_000 });
      console.log('events → detail → apply link: OK', page.url());
    } else {
      console.log(
        'events → detail: OK (registration may be closed — no /apply link on this event)',
        page.url(),
      );
    }
  }

  await page.goto('/auth', { waitUntil: 'domcontentloaded', timeout: 30_000 });
  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.waitFor({ state: 'visible', timeout: 15_000 });
  console.log('auth: email field visible (OTP send/verify not executed — needs a real mailbox)');

  await page.goto('/host/events', { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForURL(/\/auth(\?|$)/, { timeout: 25_000 });
  const u = new URL(page.url());
  if (!u.searchParams.get('returnTo')?.includes('/host/events')) {
    fail(`host guard: expected /auth?returnTo=.../host/events..., got: ${page.url()}`);
  } else {
    console.log('host /host/events signed-out redirect: OK');
  }
} catch (e) {
  fail(String(e?.stack || e));
} finally {
  await browser.close();
}

const bad = [...supabaseHosts].filter((h) => h.includes('huzcvjyyyuudchnrosvx'));
if (bad.length) fail(`unexpected staging supabase host in network: ${bad.join(', ')}`);
if (![...supabaseHosts].some((h) => h.includes('nshgmuqlivuhlimwdwhe')))
  console.warn('warn: no requests to prod supabase host observed (SPA may have cached or no fetch yet)');
else console.log('network: prod supabase host seen:', [...supabaseHosts].filter((h) => h.includes('nshgmuqlivuhlimwdwhe')).join(', '));

process.exit(process.exitCode || 0);
