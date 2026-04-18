import { test, expect } from '@playwright/test';
import { ENV } from './fixtures/env';

test.describe('participant foundation', () => {
  test('discovery links into canonical event detail before apply', async ({ page }) => {
    await page.goto('/events');
    await page.getByRole('link', { name: /לפרטי המפגש/i }).first().click();
    await expect(page).toHaveURL(new RegExp(`/events/`));
    await expect(page.getByRole('button', { name: /להגיש מועמדות|לסטטוס ההרשמה|למקום הזמני ולתגובה/i })).toBeVisible();
  });
});
