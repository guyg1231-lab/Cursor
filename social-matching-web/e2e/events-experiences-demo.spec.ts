import { expect, test } from '@playwright/test';

test.describe('events experiences demo', () => {
  test('renders 4-across and 6-across shelf comparisons plus a mobile fallback', async ({ page }) => {
    await page.goto('/events/demo-experiences');

    await expect(page).toHaveURL(/\/events\/demo-experiences$/);
    await expect(page.getByRole('heading', { name: 'השוואת מדף אירועים' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '4 בשורה' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '6 בשורה' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'fallback למובייל' })).toBeVisible();
    await expect(page.getByText('עיגולי המשתתפים נשארים גלויים')).toBeVisible();

    const section4 = page.getByTestId('experiences-demo-grid-4');
    const section6 = page.getByTestId('experiences-demo-grid-6');
    const mobile = page.getByTestId('experiences-demo-mobile');

    await expect(section4.getByTestId('experience-demo-card')).toHaveCount(6);
    await expect(section6.getByTestId('experience-demo-card')).toHaveCount(6);
    await expect(mobile.getByTestId('experience-demo-card')).toHaveCount(3);

    await expect(section4.getByRole('heading', { name: 'פיקניק בפארק' })).toBeVisible();
    await expect(section4.getByRole('heading', { name: 'קבוצת כדורעף חופים' })).toBeVisible();
    await expect(section6.getByRole('heading', { name: 'קפה בכיכר' })).toBeVisible();
    await expect(section6.getByRole('heading', { name: 'ערב סרט והרצאה בסינמטק' })).toBeVisible();
  });

  test('keeps the recommended 4-across shelf aligned and free of horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1600 });
    await page.goto('/events/demo-experiences');

    const section4 = page.getByTestId('experiences-demo-grid-4');
    const cards = section4.getByTestId('experience-demo-card');

    await expect(cards).toHaveCount(6);

    const layout = await cards.evaluateAll((nodes) =>
      nodes.map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          height: Math.round(rect.height),
          width: Math.round(rect.width),
        };
      }),
    );

    const rowTops = [...new Set(layout.map((card) => card.y))].sort((a, b) => a - b);
    const firstRow = layout.filter((card) => card.y === rowTops[0]);
    const secondRow = layout.filter((card) => card.y === rowTops[1]);
    const firstRowHeights = [...new Set(firstRow.map((card) => card.height))];

    expect(rowTops.length).toBe(2);
    expect(firstRow).toHaveLength(4);
    expect(secondRow).toHaveLength(2);
    expect(firstRowHeights.length).toBe(1);

    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasOverflow).toBe(false);
  });

  test('uses only the mobile fallback on narrow screens', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 1200 });
    await page.goto('/events/demo-experiences');

    await expect(page.getByTestId('experiences-demo-mobile')).toBeVisible();
    await expect(page.getByTestId('experiences-demo-grid-4')).toBeHidden();
    await expect(page.getByTestId('experiences-demo-grid-6')).toBeHidden();

    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasOverflow).toBe(false);
  });
});
