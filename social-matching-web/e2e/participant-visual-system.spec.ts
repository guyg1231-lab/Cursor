import { expect, test } from '@playwright/test';

test.describe('participant visual system', () => {
  test('events exposes participant shell, hero, and action rail semantics', async ({ page }) => {
    await page.goto('/events');

    await expect(page.getByTestId('participant-page-shell')).toBeVisible();
    await expect(page.getByTestId('participant-page-hero')).toBeVisible();
    const actionRail = page.getByTestId('participant-page-actions');
    await expect(actionRail).toBeVisible();
    await expect(actionRail.getByRole('link', { name: 'להציע מפגש חדש' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'להציע מפגש חדש' })).toHaveCount(1);
  });

  test('events exposes the participant route state test id on error', async ({ page }) => {
    await page.route('**/rest/v1/events*', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'playwright forced error' }),
      });
    });

    await page.goto('/events');

    await expect(page.getByTestId('participant-route-state')).toBeVisible();
    await expect(page.getByText('שגיאת טעינה', { exact: true })).toBeVisible();
  });
});
