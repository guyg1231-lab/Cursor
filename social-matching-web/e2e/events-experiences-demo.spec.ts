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
});
