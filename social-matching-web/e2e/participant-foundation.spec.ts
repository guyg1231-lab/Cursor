import { test, expect } from '@playwright/test';
import { authenticateAs } from './fixtures/auth';
import { ENV } from './fixtures/env';
import { createServiceRoleClient } from './fixtures/supabase';

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

  test('dashboard lifecycle list shows reserved status chip for confirmed application', async ({ browser }) => {
    const admin = createServiceRoleClient();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id')
      .eq('email', ENV.EMAILS.P1)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile?.id) throw new Error('E2E missing P1 profile');

    const { data: registration, error: regReadError } = await admin
      .from('event_registrations')
      .select('status')
      .eq('event_id', ENV.EVENT_ID)
      .eq('user_id', profile.id)
      .maybeSingle();
    if (regReadError) throw regReadError;
    if (!registration) throw new Error('E2E missing P1 registration for E2E_EVENT_ID');

    const previousStatus = registration.status;
    const { error: confirmError } = await admin
      .from('event_registrations')
      .update({ status: 'confirmed' })
      .eq('event_id', ENV.EVENT_ID)
      .eq('user_id', profile.id);
    if (confirmError) throw confirmError;

    const ctx = await browser.newContext();
    try {
      await authenticateAs(ctx, ENV.EMAILS.P1);
      const page = await ctx.newPage();

      await page.goto('/dashboard');
      const appsCard = page.getByRole('heading', { level: 3, name: 'ההגשות שלך' }).locator('..').locator('..');
      await expect(appsCard.getByText('המקום שלך שמור', { exact: true })).toBeVisible();
    } finally {
      try {
        await ctx.close();
      } catch {
        // Ignore browser context close failures during teardown.
      }
      try {
        const { error: restoreError } = await admin
          .from('event_registrations')
          .update({ status: previousStatus })
          .eq('event_id', ENV.EVENT_ID)
          .eq('user_id', profile.id);
        if (restoreError) throw restoreError;
      } catch (restoreError) {
        // eslint-disable-next-line no-console
        console.error('Failed to restore P1 application status', restoreError);
        throw restoreError;
      }
    }
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

  test('dashboard shows empty applications state with CTA to events', async ({ browser }) => {
    const ctx = await browser.newContext();
    // Staging: P1–P4 each have ≥1 registration; ADMIN1 has zero event_registrations (see plan Task 3).
    await authenticateAs(ctx, ENV.EMAILS.ADMIN1);
    const page = await ctx.newPage();

    await page.goto('/dashboard');
    await expect(page.getByText('אין עדיין הגשות', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'למפגשים פתוחים' })).toBeVisible();

    await ctx.close();
  });

  test('regression: dashboard readiness and applications render together', async ({ browser }) => {
    const ctx = await browser.newContext();
    await authenticateAs(ctx, ENV.EMAILS.P1);
    const page = await ctx.newPage();

    await page.goto('/dashboard');

    await expect(page.getByRole('heading', { level: 1, name: 'האזור האישי שלך' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'מוכנות להגשה' })).toBeVisible();
    await expect(page.getByText('מוכן להגשה', { exact: true })).toBeVisible();

    await expect(page.getByRole('heading', { level: 3, name: 'ההגשות שלך' })).toBeVisible();
    const appsCard = page.getByRole('heading', { level: 3, name: 'ההגשות שלך' }).locator('..').locator('..');
    await expect(appsCard.locator(`a[href="/events/${ENV.EVENT_ID}"]`).first()).toBeVisible();

    await ctx.close();
  });
});
