import { test, expect } from '@playwright/test';
import { authenticateAs } from './fixtures/auth';
import { fetchStatusForEmail, resetEventRegistrations } from './fixtures/db';
import { ENV } from './fixtures/env';
import { EVENT_PATH, TEAM_PATH, getSliceParticipants, submitApplicationViaUi } from './fixtures/ui';

test.describe('Circles vertical slice - decline path', () => {
  test.beforeAll(async () => {
    await resetEventRegistrations();
  });

  test('participant in awaiting_response declines and row becomes rejected with expires_at=null', async ({ browser }) => {
    const participants = getSliceParticipants();

    for (const p of participants) {
      const ctx = await browser.newContext();
      try {
        await authenticateAs(ctx, p.email);
        const page = await ctx.newPage();
        await submitApplicationViaUi(page, p.fullName, p.phone, `I want to join ${p.label} decline.`);
      } finally {
        await ctx.close();
      }
    }

    {
      const ctx = await browser.newContext();
      try {
        await authenticateAs(ctx, ENV.EMAILS.ADMIN1);
        const page = await ctx.newPage();
        await page.goto(TEAM_PATH);
        await page.getByRole('button', { name: 'שליחת הזמנות' }).click();
        await expect(page.getByText('ההזמנות נשלחו')).toBeVisible();
      } finally {
        await ctx.close();
      }
    }

    {
      const ctx = await browser.newContext();
      try {
        await authenticateAs(ctx, ENV.EMAILS.P1);
        const page = await ctx.newPage();
        await page.goto(EVENT_PATH);
        await expect(page.getByText('נשמר עבורך מקום במפגש')).toBeVisible();
        await page.getByRole('button', { name: 'לא אוכל להגיע' }).click();
        await expect(page.getByText('הפעם זה לא יצא')).toBeVisible();
      } finally {
        await ctx.close();
      }
    }

    const p1Snap = await fetchStatusForEmail(ENV.EMAILS.P1);
    expect(p1Snap, 'P1 row').toBeTruthy();
    expect(p1Snap!.status, 'P1 status after decline').toBe('rejected');
    expect(p1Snap!.expires_at, 'P1 expires_at cleared').toBeNull();
  });
});
