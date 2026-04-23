import { expect, test } from '@playwright/test';

test.describe('events experiences demo', () => {
  test('renders a production-like shelf display with minimal framing', async ({ page }) => {
    await page.goto('/events/demo-experiences');

    await expect(page).toHaveURL(/\/events\/demo-experiences$/);
    await expect(page.getByRole('heading', { name: 'אירועים' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '4 בשורה' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '3 בשורה' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'fallback למובייל' })).toBeVisible();
    await expect(page.getByText('מה בודקים')).toHaveCount(0);
    await expect(page.getByText('מה נשאר')).toHaveCount(0);
    await expect(page.getByText('מה משתנה')).toHaveCount(0);
    await expect(page.getByText('אנחנו לא משווים כאן 4 מול 3 בשורה.')).toHaveCount(0);

    const section4 = page.getByTestId('experiences-demo-grid-4');
    const section3 = page.getByTestId('experiences-demo-grid-3');
    const mobile = page.getByTestId('experiences-demo-mobile');

    await expect(section4.getByTestId('experience-demo-card')).toHaveCount(6);
    await expect(section3.getByTestId('experience-demo-card')).toHaveCount(6);
    await expect(mobile.getByTestId('experience-demo-card')).toHaveCount(3);

    await expect(section4.getByRole('heading', { name: 'פיקניק בפארק' })).toBeVisible();
    await expect(section4.getByRole('heading', { name: 'קבוצת כדורעף חופים' })).toBeVisible();
    await expect(section3.getByRole('heading', { name: 'קפה בכיכר' })).toBeVisible();
    await expect(section3.getByRole('heading', { name: 'ערב סרט והרצאה בסינמטק' })).toBeVisible();
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
          right: Math.round(rect.right),
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
    expect(Math.min(...firstRow.map((card) => card.x))).toBeGreaterThanOrEqual(0);
    expect(Math.max(...firstRow.map((card) => card.right))).toBeLessThanOrEqual(1600);

    const sectionTop = await section4.evaluate((node) => Math.round(node.getBoundingClientRect().top));
    expect(sectionTop).toBeLessThan(320);

    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasOverflow).toBe(false);
  });

  test('card and primary CTA react on hover to feel interactive', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1400 });
    await page.goto('/events/demo-experiences');

    const card = page.getByTestId('experiences-demo-grid-4').getByTestId('experience-demo-card').first();
    const button = card.getByRole('button', { name: 'לפרטי הערב' });

    const beforeCard = await card.evaluate((node) => {
      const styles = getComputedStyle(node);
      return { transform: styles.transform, shadow: styles.boxShadow };
    });

    await card.hover();
    await page.waitForTimeout(120);

    const afterCard = await card.evaluate((node) => {
      const styles = getComputedStyle(node);
      return { transform: styles.transform, shadow: styles.boxShadow };
    });

    expect(afterCard.transform).not.toBe(beforeCard.transform);
    expect(afterCard.shadow).not.toBe(beforeCard.shadow);

    const beforeButton = await button.evaluate((node) => {
      const styles = getComputedStyle(node);
      return { transform: styles.transform, shadow: styles.boxShadow };
    });

    await button.hover();
    await page.waitForTimeout(120);

    const afterButton = await button.evaluate((node) => {
      const styles = getComputedStyle(node);
      return { transform: styles.transform, shadow: styles.boxShadow };
    });

    expect(afterButton.transform).not.toBe(beforeButton.transform);
    expect(afterButton.shadow).not.toBe(beforeButton.shadow);
  });

  test('lays out the 3-across shelf in two clean rows of three on wide screens', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1600 });
    await page.goto('/events/demo-experiences');

    const section3 = page.getByTestId('experiences-demo-grid-3');
    const cards = section3.getByTestId('experience-demo-card');

    await expect(cards).toHaveCount(6);

    const layout = await cards.evaluateAll((nodes) =>
      nodes.map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          y: Math.round(rect.y),
          height: Math.round(rect.height),
          width: Math.round(rect.width),
        };
      }),
    );

    const rowTops = [...new Set(layout.map((card) => card.y))].sort((a, b) => a - b);
    const firstRow = layout.filter((card) => card.y === rowTops[0]);
    const secondRow = layout.filter((card) => card.y === rowTops[1]);
    const firstRowWidths = [...new Set(firstRow.map((card) => card.width))];

    expect(rowTops.length).toBe(2);
    expect(firstRow).toHaveLength(3);
    expect(secondRow).toHaveLength(3);
    expect(firstRowWidths.length).toBe(1);
  });

  test('uses only the mobile fallback on narrow screens', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 1200 });
    await page.goto('/events/demo-experiences');

    await expect(page.getByTestId('experiences-demo-mobile')).toBeVisible();
    await expect(page.getByTestId('experiences-demo-grid-4')).toBeHidden();
    await expect(page.getByTestId('experiences-demo-grid-3')).toBeHidden();

    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasOverflow).toBe(false);
  });
});
