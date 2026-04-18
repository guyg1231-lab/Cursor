import { test, expect } from '@playwright/test';
import { authenticateAs } from './fixtures/auth';
import { ENV } from './fixtures/env';

test.describe('foundation routes', () => {
  test('host placeholder routes render a stable heading and placeholder panel', async ({ browser }) => {
    const ctx = await browser.newContext();
    await authenticateAs(ctx, ENV.EMAILS.HOST1);
    const page = await ctx.newPage();

    await page.goto('/host/events/future-workspace');
    await expect(page.getByRole('heading', { name: 'Host event workspace' })).toBeVisible();
    await expect(page.getByText('This surface is intentionally minimal for now.')).toBeVisible();

    await ctx.close();
  });

  test('admin placeholder routes render behind admin guard', async ({ browser }) => {
    const ctx = await browser.newContext();
    await authenticateAs(ctx, ENV.EMAILS.ADMIN1);
    const page = await ctx.newPage();

    await page.goto('/admin/events/future-event/diagnostics');
    await expect(page.getByRole('heading', { name: 'Operator diagnostics' })).toBeVisible();
    await expect(page.getByText('This surface is intentionally minimal for now.')).toBeVisible();

    await ctx.close();
  });
});
