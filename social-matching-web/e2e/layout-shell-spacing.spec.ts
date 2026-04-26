import { test, expect, type Page } from '@playwright/test';
import { authenticateAs } from './fixtures/auth';
import { ENV } from './fixtures/env';

async function assertPageStartsBelowHeader(page: Page, route: string) {
  await page.goto(route);
  await expect(page.locator('#main-content')).toBeVisible();

  const metrics = await page.evaluate(() => {
    const header = document.querySelector('header');
    const main = document.querySelector('#main-content');
    if (!header || !main) return null;

    const headerRect = header.getBoundingClientRect();
    const mainRect = main.getBoundingClientRect();
    const firstBlock = main.firstElementChild as HTMLElement | null;
    const firstBlockRect = firstBlock?.getBoundingClientRect() ?? null;
    const firstHeading = main.querySelector('h1, h2, h3');
    const headingRect = firstHeading?.getBoundingClientRect() ?? null;

    return {
      headerBottom: Math.round(headerRect.bottom),
      mainTop: Math.round(mainRect.top),
      firstBlockTop: firstBlockRect ? Math.round(firstBlockRect.top) : null,
      headingTop: headingRect ? Math.round(headingRect.top) : null,
    };
  });

  expect(metrics, `expected page shell metrics for route ${route}`).not.toBeNull();
  if (!metrics) return;

  if (metrics.firstBlockTop !== null) {
    expect(
      metrics.firstBlockTop,
      `first content block overlaps header on route ${route} (firstBlockTop=${metrics.firstBlockTop}, headerBottom=${metrics.headerBottom})`,
    ).toBeGreaterThanOrEqual(metrics.headerBottom - 1);
  }

  if (metrics.headingTop !== null) {
    expect(
      metrics.headingTop,
      `first heading overlaps header on route ${route} (headingTop=${metrics.headingTop}, headerBottom=${metrics.headerBottom})`,
    ).toBeGreaterThanOrEqual(metrics.headerBottom - 1);
  }
}

test.describe('layout shell spacing', () => {
  test('public participant routes start below fixed header on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const publicRoutes = ['/', '/events', `/events/${ENV.EVENT_ID}`, '/auth', '/privacy', '/terms'];
    for (const route of publicRoutes) {
      await assertPageStartsBelowHeader(page, route);
    }
  });

  test('authenticated participant routes start below fixed header on mobile', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    try {
      await authenticateAs(ctx, ENV.EMAILS.P1);
      const page = await ctx.newPage();

      const participantRoutes = ['/dashboard', '/questionnaire', `/events/${ENV.EVENT_ID}/apply`, `/gathering/${ENV.EVENT_ID}`];
      for (const route of participantRoutes) {
        await assertPageStartsBelowHeader(page, route);
      }
    } finally {
      await ctx.close();
    }
  });

  test('host and admin routes start below fixed header on mobile', async ({ browser }) => {
    const hostCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const adminCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });

    try {
      await authenticateAs(hostCtx, ENV.EMAILS.P1);
      const hostPage = await hostCtx.newPage();
      const hostRoutes = ['/host/events', `/host/events/${ENV.EVENT_ID}`];
      for (const route of hostRoutes) {
        await assertPageStartsBelowHeader(hostPage, route);
      }

      await authenticateAs(adminCtx, ENV.EMAILS.ADMIN1);
      const adminPage = await adminCtx.newPage();
      const adminRoutes = ['/admin', '/admin/events', `/admin/events/${ENV.EVENT_ID}`, `/team/gathering/${ENV.EVENT_ID}`];
      for (const route of adminRoutes) {
        await assertPageStartsBelowHeader(adminPage, route);
      }
    } finally {
      await hostCtx.close();
      await adminCtx.close();
    }
  });
});
