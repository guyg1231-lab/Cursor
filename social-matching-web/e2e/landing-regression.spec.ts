import { expect, test, type Page } from '@playwright/test';

async function fulfillEventsList(page: Page, rows: unknown[]) {
  await page.route('**/rest/v1/rpc/get_public_event_social_signals', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.route('**/rest/v1/events*', async (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(rows),
    });
  });
}

test.describe('landing regression', () => {
  test('events shelf shows curated fallback when browse API returns no rows', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await fulfillEventsList(page, []);

    await page.goto('/');
    await expect(page.getByTestId('events-discovery-grid')).toHaveCount(0);
    await expect(page.getByTestId('event-summary-card').first()).toBeVisible();
    await expect(page.getByTestId('landing-events-skeleton')).toHaveCount(0);
  });

  test('events shelf shows error state when API fails', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route('**/rest/v1/rpc/get_public_event_social_signals', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/rest/v1/events*', async (route) => {
      if (route.request().method() !== 'GET') return route.continue();
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'forced landing events failure' }),
      });
    });

    await page.goto('/');
    await expect(page.getByText('שגיאת טעינה', { exact: true })).toBeVisible();
  });

  test('propose gathering CTA navigates to propose flow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await fulfillEventsList(page, []);

    await page.goto('/');
    await page.getByRole('link', { name: 'להציע מפגש חדש' }).click();
    await expect(page).toHaveURL(/\/(sign-in|auth)(\?|$)/);
    await expect(page).toHaveURL(/returnTo=.*events.*propose/);
  });

  test('deep hash navigation lands how-it-works below fixed header', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await fulfillEventsList(page, []);

    await page.goto('/#landing-how-it-works');

    const metrics = await page.evaluate(() => {
      const header = document.querySelector('header');
      const target = document.querySelector('#landing-how-it-works');
      if (!header || !target) return null;

      const headerRect = header.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const heading = target.querySelector('h2, h3');
      const headingRect = heading?.getBoundingClientRect() ?? null;

      return {
        headerBottom: Math.round(headerRect.bottom),
        targetTop: Math.round(targetRect.top),
        headingTop: headingRect ? Math.round(headingRect.top) : null,
      };
    });

    expect(metrics).not.toBeNull();
    if (!metrics) return;

    if (metrics.headingTop !== null) {
      expect(metrics.headingTop).toBeGreaterThanOrEqual(metrics.headerBottom - 1);
      return;
    }

    expect(metrics.targetTop).toBeGreaterThanOrEqual(metrics.headerBottom - 1);
  });
});
