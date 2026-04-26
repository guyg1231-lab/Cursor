import { expect, test } from '@playwright/test';

test.describe('events retry regression', () => {
  test('events error state can retry and recover without manual refresh', async ({ page }) => {
    let requestCount = 0;
    await page.route('**/rest/v1/events*', async (route) => {
      requestCount += 1;
      if (requestCount === 1) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'forced failure for retry flow' }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '6eb9833c-8f6a-4b31-b42f-7e0b39e9d2de',
            title: 'ערב משחקים שכונתי',
            city: 'תל אביב',
            starts_at: '2030-02-14T18:30:00.000Z',
            status: 'active',
            is_published: true,
            description: 'מפגש קטן באווירה קלילה.',
          },
        ]),
      });
    });

    await page.goto('/events');
    await expect(page.getByTestId('participant-route-state')).toBeVisible();
    await expect(page.getByRole('button', { name: 'לנסות שוב' })).toBeVisible();

    await page.getByRole('button', { name: 'לנסות שוב' }).click();
    await expect(page.getByTestId('events-discovery-grid')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'ערב משחקים שכונתי' })).toBeVisible();
  });
});
