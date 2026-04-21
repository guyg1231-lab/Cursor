import { test, expect } from '@playwright/test';
import { routeManifest } from '../src/app/router/routeManifest';
import { parseSafeReturnTo } from '../src/lib/authReturnTo';
import { authenticateAs } from './fixtures/auth';
import { ENV } from './fixtures/env';

test.describe('foundation routes', () => {
  test('ProtectedRoute uses shared Hebrew loading state while auth resolves', async ({ browser }) => {
    const ctx = await browser.newContext();
    try {
      await authenticateAs(ctx, ENV.EMAILS.P1);
      const page = await ctx.newPage();

      let releaseRolesRequest: (() => void) | null = null;
      const rolesRequestReleased = new Promise<void>((resolve) => {
        releaseRolesRequest = resolve;
      });

      await page.route('**/rest/v1/user_roles*', async (route) => {
        await rolesRequestReleased;
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      });

      await page.goto('/dashboard');

      await expect(page.getByText('טוענים…', { exact: true })).toBeVisible();
      await expect(page.getByText('המערכת טוענת את הדף, רק רגע.', { exact: true })).toBeVisible();

      if (!releaseRolesRequest) {
        throw new Error('Expected user_roles request interception for ProtectedRoute.');
      }
      releaseRolesRequest();

      await expect(page.getByRole('heading', { level: 1, name: 'האזור האישי שלך' })).toBeVisible();
    } finally {
      await ctx.close();
    }
  });

  test('AdminRoute uses shared Hebrew loading state while auth resolves', async ({ browser }) => {
    const ctx = await browser.newContext();
    try {
      await authenticateAs(ctx, ENV.EMAILS.ADMIN1);
      const page = await ctx.newPage();

      let releaseRolesRequest: (() => void) | null = null;
      const rolesRequestReleased = new Promise<void>((resolve) => {
        releaseRolesRequest = resolve;
      });

      await page.route('**/rest/v1/user_roles*', async (route) => {
        await rolesRequestReleased;
        await route.continue();
      });

      await page.goto('/admin/events/future-event/diagnostics');

      await expect(page.getByText('טוענים…', { exact: true })).toBeVisible();
      await expect(page.getByText('המערכת טוענת את הדף, רק רגע.', { exact: true })).toBeVisible();

      if (!releaseRolesRequest) {
        throw new Error('Expected user_roles request interception for AdminRoute.');
      }
      releaseRolesRequest();

      await expect(page.getByRole('heading', { level: 1, name: 'Operator diagnostics' })).toBeVisible();
    } finally {
      await ctx.close();
    }
  });

  test('signed-out admin route preserves returnTo through sign-in', async ({ page }) => {
    await page.goto('/admin/events/future-event/diagnostics');
    await expect(page).toHaveURL(/\/(sign-in|auth)(\?|$)/);
    await expect(page).toHaveURL(/returnTo=.*admin.*events.*future-event.*diagnostics/);
    await expect(page.getByText(/כניסה|אימות/i).first()).toBeVisible();
  });

  test('signed-out proposal route preserves returnTo through sign-in', async ({ page }) => {
    await page.goto('/events/propose');
    await expect(page).toHaveURL(/\/(sign-in|auth)(\?|$)/);
    await expect(page).toHaveURL(/returnTo=.*events.*propose/);
    await expect(page.getByText(/כניסה|אימות/i).first()).toBeVisible();
  });

  test('auth return allows canonical participant routes and blocks unknown paths', () => {
    expect(parseSafeReturnTo('/events')).toBe('/events');
    expect(parseSafeReturnTo(`/events/${ENV.EVENT_ID}`)).toBe(`/events/${ENV.EVENT_ID}`);
    expect(parseSafeReturnTo('/questionnaire')).toBe('/questionnaire');
    expect(parseSafeReturnTo(`/events/${ENV.EVENT_ID}/apply`)).toBe(`/events/${ENV.EVENT_ID}/apply`);
    expect(parseSafeReturnTo('/events/propose')).toBe('/events/propose');
    expect(parseSafeReturnTo('/events/unknown/path')).toBeNull();
    expect(parseSafeReturnTo('https://evil.com')).toBeNull();
    expect(parseSafeReturnTo('//evil.com')).toBeNull();
    expect(parseSafeReturnTo('%2F%2Fevil.com')).toBeNull();
    expect(parseSafeReturnTo('/events/%0Aadmin')).toBeNull();
    expect(parseSafeReturnTo('javascript:alert(1)')).toBeNull();
  });

  test('proposal route shows readiness-gated branch when signed-in user is not ready', async ({ browser }) => {
    const ctx = await browser.newContext();
    try {
      await authenticateAs(ctx, ENV.EMAILS.P1);
      const page = await ctx.newPage();

      await page.route('**/rest/v1/matching_responses**', async (route) => {
        if (route.request().method() !== 'GET') return route.continue();
        return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      });
      await page.route('**/rest/v1/profiles**', async (route) => {
        if (route.request().method() !== 'GET') return route.continue();
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{ funnel_status: 'needs_questionnaire' }]),
        });
      });

      await page.goto('/events/propose');

      await expect(page.getByRole('heading', { level: 1, name: 'בקשת אירוע' })).toBeVisible();
      await expect(page.getByRole('heading', { level: 3, name: 'עוד רגע אפשר לפתוח בקשת אירוע' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'להשלמת השאלון' })).toHaveAttribute('href', '/questionnaire');
      await expect(page.getByRole('button', { name: 'טיוטה חדשה' })).toHaveCount(0);
    } finally {
      await ctx.close();
    }
  });

  test('gathering signed-out branch preserves returnTo through sign-in CTA', async ({ page }) => {
    await page.goto(`/gathering/${ENV.EVENT_ID}`);
    await expect(page.getByRole('link', { name: 'להיכנס להגשה ולסטטוס' })).toBeVisible();
    await page.getByRole('link', { name: 'להיכנס להגשה ולסטטוס' }).click();
    await expect(page).toHaveURL(/\/(sign-in|auth)(\?|$)/);
    await expect(page).toHaveURL(new RegExp(`returnTo=.*gathering.*${ENV.EVENT_ID}`));
    await expect(page.getByText(/כניסה|אימות/i).first()).toBeVisible();
  });

  test('signed-in non-admin sees an explicit denied state on admin routes', async ({ browser }) => {
    const ctx = await browser.newContext();
    try {
      await authenticateAs(ctx, ENV.EMAILS.P1);
      const page = await ctx.newPage();

      await page.goto('/admin/events/future-event/diagnostics');

      await expect(page).toHaveURL(/\/admin\/events\/future-event\/diagnostics$/);
      await expect(page.getByText('אין לך גישה לעמוד הזה', { exact: true })).toBeVisible();
      await expect(page.getByText('העמוד הזה זמין רק לצוות התפעול.', { exact: true })).toBeVisible();
      await expect(page.getByRole('link', { name: 'חזרה לדף הבית' })).toHaveAttribute('href', '/');
    } finally {
      await ctx.close();
    }
  });

  test('host placeholder routes render a stable heading and placeholder panel', async ({ browser }) => {
    const ctx = await browser.newContext();
    try {
      await authenticateAs(ctx, ENV.EMAILS.HOST1);
      const page = await ctx.newPage();

      await page.goto('/host/events/future-workspace');
      await expect(page.getByRole('heading', { level: 1, name: 'Host event workspace' })).toBeVisible();
      await expect(page.getByText('הדף הזה מצומצם כרגע בכוונה.', { exact: true })).toBeVisible();
    } finally {
      await ctx.close();
    }
  });

  test('admin placeholder routes render expected copy when signed in as admin', async ({ browser }) => {
    const ctx = await browser.newContext();
    try {
      await authenticateAs(ctx, ENV.EMAILS.ADMIN1);
      const page = await ctx.newPage();

      await page.goto('/admin/events/future-event/diagnostics');
      await expect(page.getByRole('heading', { level: 1, name: 'Operator diagnostics' })).toBeVisible();
      await expect(page.getByText('הדף הזה מצומצם כרגע בכוונה.', { exact: true })).toBeVisible();
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
        expect.objectContaining({ path: '/terms', workstream: 'participant', auth: 'public' }),
        expect.objectContaining({ path: '/privacy', workstream: 'participant', auth: 'public' }),
        expect.objectContaining({ path: '/questionnaire', workstream: 'participant', auth: 'preview' }),
        expect.objectContaining({ path: '/auth/callback', workstream: 'participant', auth: 'preview' }),
        expect.objectContaining({ path: '/events/propose', workstream: 'participant', auth: 'protected' }),
        expect.objectContaining({ path: '/events/:eventId/apply', workstream: 'participant', auth: 'protected' }),
        expect.objectContaining({ path: '/host/events', workstream: 'host', auth: 'protected' }),
        expect.objectContaining({ path: '/host/events/:eventId', workstream: 'host', auth: 'protected' }),
        expect.objectContaining({ path: '/admin/event-requests', workstream: 'admin', auth: 'admin' }),
        expect.objectContaining({ path: '/admin/events/:eventId/diagnostics', workstream: 'admin', auth: 'admin' }),
      ]),
    );
    expect(routeManifest.find((route) => route.path === '/host/settings')).toBeUndefined();
  });
});
