import { test, expect } from '@playwright/test';
import { authenticateAs } from './fixtures/auth';
import { ENV } from './fixtures/env';

test.describe('participant foundation', () => {
  test('discovery links into canonical event detail before apply', async ({ page }) => {
    await page.goto('/events');
    await page.locator(`a[href="/events/${ENV.EVENT_ID}"]`).first().click();
    await expect(page).toHaveURL(new RegExp(`/events/${ENV.EVENT_ID}`));
    await expect(
      page.getByRole('link', {
        name: /להגיש מועמדות|להגיש שוב|לסטטוס ההרשמה|למקום הזמני ולתגובה|לצפייה בסטטוס ההרשמה|חזרה למפגשים/i,
      }).first(),
    ).toBeVisible();
  });

  test('authenticated participant sees a readiness message before applying when blocked', async ({ browser }) => {
    const ctx = await browser.newContext();
    await authenticateAs(ctx, ENV.EMAILS.P1);
    const page = await ctx.newPage();

    await page.goto(`/events/${ENV.EVENT_ID}/apply`);
    await expect(
      page.getByRole('heading', { level: 1, name: /הגשה למפגש|סטטוס ההרשמה/i }),
    ).toBeVisible();
    await expect(page.getByText(/צריך להשלים את הפרופיל|המקום שלך במפגש נשמר|כבר קיימת הגשה/i)).toBeVisible();

    await ctx.close();
  });

  test('dashboard exposes participant next steps with a questionnaire handoff', async ({ browser }) => {
    const ctx = await browser.newContext();
    await authenticateAs(ctx, ENV.EMAILS.P1);
    const page = await ctx.newPage();

    await page.goto('/dashboard');
    await expect(page.getByRole('link', { name: 'לשאלון הפרופיל' })).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 3, name: /לפני ההגשה הבאה/i }),
    ).toBeVisible();

    await ctx.close();
  });

  test('dashboard shows profile readiness as ready', async ({ browser }) => {
    const ctx = await browser.newContext();
    await authenticateAs(ctx, ENV.EMAILS.P1);
    const page = await ctx.newPage();

    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { level: 1, name: 'האזור האישי שלך' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'מוכנות להגשה' })).toBeVisible();
    await expect(page.getByText('מוכנים להגיש למפגשים', { exact: true })).toBeVisible();
    await expect(page.getByText('מוכן להגשה', { exact: true })).toBeVisible();

    await ctx.close();
  });

  test('unauthenticated apply preserves returnTo through sign-in', async ({ page }) => {
    await page.goto(`/events/${ENV.EVENT_ID}/apply`);
    await expect(page).toHaveURL(/\/(sign-in|auth)(\?|$)/);
    await expect(page).toHaveURL(new RegExp(`returnTo=.*events.*${ENV.EVENT_ID}.*apply`));
    await expect(page.getByText(/כניסה|אימות/i).first()).toBeVisible();
  });

  test('auth callback keeps a visible loading state before redirect completes', async ({ page }) => {
    const sawLoading = page.waitForFunction(
      () => /loading|טוענים|מאמתים/i.test(document.body.innerText),
      { timeout: 15_000 },
    );
    await Promise.all([page.goto('/auth/callback'), sawLoading]);
  });
});
