import { expect, test } from '@playwright/test';
import { authenticateAs } from './fixtures/auth';
import { ENV } from './fixtures/env';

test.describe('host/admin MVP-critical workflows', () => {
  test('host can enter event workspace from host events list', async ({ browser }) => {
    const ctx = await browser.newContext();
    try {
      await authenticateAs(ctx, ENV.EMAILS.HOST1);
      const page = await ctx.newPage();

      await page.goto('/host/events');
      await page.getByRole('link', { name: 'לניהול האירוע' }).first().click();
      await expect(page).toHaveURL(/\/host\/events\/.+$/);
      await expect(
        page.getByText('המסך שמור להצגת תמונת מצב למארח/ת, אבני דרך, וניווט לפעולות הבאות.'),
      ).toBeVisible();
    } finally {
      await ctx.close();
    }
  });

  test('admin event dashboard shows lifecycle actions region', async ({ browser }) => {
    const ctx = await browser.newContext();
    try {
      await authenticateAs(ctx, ENV.EMAILS.ADMIN1);
      const page = await ctx.newPage();

      await page.goto(`/admin/events/${ENV.EVENT_ID}`);
      await expect(page.getByTestId('admin-event-lifecycle-actions')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'פעולות מחזור חיים' })).toBeVisible();
    } finally {
      await ctx.close();
    }
  });

  test('admin dashboard exposes diagnostics and audit routes', async ({ browser }) => {
    const ctx = await browser.newContext();
    try {
      await authenticateAs(ctx, ENV.EMAILS.ADMIN1);
      const page = await ctx.newPage();

      await page.goto(`/admin/events/${ENV.EVENT_ID}`);
      await page.getByRole('link', { name: 'Diagnostics' }).click();
      await expect(page).toHaveURL(new RegExp(`/admin/events/${ENV.EVENT_ID}/diagnostics`));
      await expect(
        page.getByText('המסלול הזה שמור ליומני מערכת פנימיים, בדיקות מצב, ודיאגנוסטיקה לצוות התפעול בלבד.'),
      ).toBeVisible();

      await page.goto(`/admin/events/${ENV.EVENT_ID}`);
      await page.getByRole('link', { name: 'Audit' }).click();
      await expect(page).toHaveURL(new RegExp(`/admin/events/${ENV.EVENT_ID}/audit`));
      await expect(
        page.getByText('המסלול הזה שמור לעקבות ביקורת תפעוליות, היסטוריית שינויים, ובדיקות תאימות.'),
      ).toBeVisible();
    } finally {
      await ctx.close();
    }
  });

  test('host workspace links to registrations, communications, and follow-up placeholders', async ({ browser }) => {
    const ctx = await browser.newContext();
    try {
      await authenticateAs(ctx, ENV.EMAILS.HOST1);
      const page = await ctx.newPage();

      await page.goto('/host/events');
      await page.getByRole('link', { name: 'לניהול האירוע' }).first().click();

      await page.getByRole('link', { name: 'לתמונת ההרשמות' }).click();
      await expect(page).toHaveURL(/\/host\/events\/.+\/registrations$/);
      await expect(
        page.getByText('אין כאן שמות משתתפים או שליטה בבחירה. המסך הזה שמור לסיכום ספירות ומצב כללי בלבד.'),
      ).toBeVisible();

      await page.goto('/host/events');
      await page.getByRole('link', { name: 'לניהול האירוע' }).first().click();
      await page.getByRole('link', { name: 'לתקשורת' }).click();
      await expect(page).toHaveURL(/\/host\/events\/.+\/communications$/);
      await expect(page.getByText('המסך הזה שומר מקום לעדכונים עתידיים מהמארח/ת בלי לרמוז שיש כרגע מערכת הודעות פעילה.')).toBeVisible();

      await page.goto('/host/events');
      await page.getByRole('link', { name: 'לניהול האירוע' }).first().click();
      await page.getByRole('link', { name: 'למעקב אחרי האירוע' }).click();
      await expect(page).toHaveURL(/\/host\/events\/.+\/follow-up$/);
      await expect(page.getByText('המסך הזה שומר מקום לסיכום ופולואפ אחרי האירוע, אבל עדיין לא מבצע פעולות כתיבה.')).toBeVisible();
    } finally {
      await ctx.close();
    }
  });

  test('signed-out user is redirected from admin diagnostics and audit routes', async ({ browser }) => {
    const ctx = await browser.newContext();
    try {
      const page = await ctx.newPage();

      await page.goto(`/admin/events/${ENV.EVENT_ID}/diagnostics`);
      await expect(page).toHaveURL(
        new RegExp(`/auth\\?returnTo=%2Fadmin%2Fevents%2F${ENV.EVENT_ID}%2Fdiagnostics$`),
      );

      await page.goto(`/admin/events/${ENV.EVENT_ID}/audit`);
      await expect(page).toHaveURL(
        new RegExp(`/auth\\?returnTo=%2Fadmin%2Fevents%2F${ENV.EVENT_ID}%2Faudit$`),
      );
    } finally {
      await ctx.close();
    }
  });

  test('admin review queue exposes stable contract selectors', async ({ browser }) => {
    const ctx = await browser.newContext();
    try {
      await authenticateAs(ctx, ENV.EMAILS.ADMIN1);
      const page = await ctx.newPage();

      await page.goto('/admin/event-requests');
      await expect(page.getByTestId('admin-event-requests-review-queue')).toBeVisible();
      await expect(page.getByTestId('admin-event-requests-queue-description')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'נשלח לבדיקה' })).toBeVisible();

      const approveButtons = page.getByRole('button', { name: 'אישור ופרסום' });
      const emptyQueue = page.getByText('אין כרגע בקשות ממתינות', { exact: true });
      // Avoid racing the initial fetch: count can be 0 while loading even when requests exist.
      await expect(approveButtons.first().or(emptyQueue)).toBeVisible();
      if ((await approveButtons.count()) > 0) {
        await expect(approveButtons.first()).toBeEnabled();
      }
    } finally {
      await ctx.close();
    }
  });
});
