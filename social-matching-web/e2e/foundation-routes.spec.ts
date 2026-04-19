import { test, expect } from '@playwright/test';
import { routeManifest } from '../src/app/router/routeManifest';
import { authenticateAs } from './fixtures/auth';
import { ENV } from './fixtures/env';

test.describe('foundation routes', () => {
  test('host placeholder routes render a stable heading and placeholder panel', async ({ browser }) => {
    const ctx = await browser.newContext();
    try {
      await authenticateAs(ctx, ENV.EMAILS.HOST1);
      const page = await ctx.newPage();

      await page.goto('/host/events/future-workspace');
      await expect(page.getByRole('heading', { level: 1, name: 'Host event workspace' })).toBeVisible();
      await expect(page.getByText('This surface is intentionally minimal for now.')).toBeVisible();
    } finally {
      await ctx.close();
    }
  });

  // NOTE: does not verify the guard rejects non-admins — AdminRoute currently
  // silently redirects to /, which makes a positive denial assertion hard.
  // See foundation ticket F-5 (docs/foundation-tickets/2026-04-20-05-*).
  test('admin placeholder routes render expected copy when signed in as admin', async ({ browser }) => {
    const ctx = await browser.newContext();
    try {
      await authenticateAs(ctx, ENV.EMAILS.ADMIN1);
      const page = await ctx.newPage();

      await page.goto('/admin/events/future-event/diagnostics');
      await expect(page.getByRole('heading', { level: 1, name: 'Operator diagnostics' })).toBeVisible();
      await expect(page.getByText('This surface is intentionally minimal for now.')).toBeVisible();
    } finally {
      await ctx.close();
    }
  });

  test('placeholder routes expose a consistent back-link and purpose copy', async ({ browser }) => {
    const ctx = await browser.newContext();
    try {
      await authenticateAs(ctx, ENV.EMAILS.ADMIN1);
      const page = await ctx.newPage();

      await page.goto('/admin/events/future-event/audit');
      await expect(page.getByRole('link', { name: 'Back to event dashboard' })).toBeVisible();
      await expect(page.getByText('Reserved for a later implementation pass.')).toBeVisible();
    } finally {
      await ctx.close();
    }
  });

  test('route manifest tracks host and admin placeholder ownership', () => {
    expect(routeManifest).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: '/auth', workstream: 'participant', auth: 'public' }),
        expect.objectContaining({ path: '/events/:eventId/apply', workstream: 'participant', auth: 'protected' }),
        expect.objectContaining({ path: '/host/events', workstream: 'host', auth: 'protected' }),
        expect.objectContaining({ path: '/host/events/:eventId', workstream: 'host', auth: 'protected' }),
        expect.objectContaining({ path: '/admin/event-requests', workstream: 'admin', auth: 'admin' }),
        expect.objectContaining({ path: '/admin/events/:eventId/diagnostics', workstream: 'admin', auth: 'admin' }),
      ]),
    );
  });
});
