import { test, expect } from '@playwright/test';
import { authenticateAs } from './fixtures/auth';
import { fetchRegistrationsByEmail, resetEventRegistrations } from './fixtures/db';
import { ENV } from './fixtures/env';
import { APPLY_PATH, TEAM_PATH, getSliceParticipants, submitApplicationViaUi } from './fixtures/ui';

test.describe('Circles vertical slice - happy path', () => {
  test.beforeAll(async () => {
    await resetEventRegistrations();
  });

  test('4 participants submit, operator invites, all accept, operator marks attended', async ({ browser }) => {
    const participants = getSliceParticipants();

    // Discovery: /events lists the active+published fixture with an entry button.
    {
      const ctx = await browser.newContext();
      try {
        const page = await ctx.newPage();
        await page.goto('/events');
        await expect(page.getByRole('link', { name: 'לפרטים ולהרשמה' }).first()).toBeVisible();
      } finally {
        await ctx.close();
      }
    }

    // Step 1: four participants submit applications via UI.
    for (const p of participants) {
      const ctx = await browser.newContext();
      try {
        await authenticateAs(ctx, p.email);
        const page = await ctx.newPage();
        await submitApplicationViaUi(page, p.fullName, p.phone, `I want to join ${p.label} slice.`);
      } finally {
        await ctx.close();
      }
    }

    const afterSubmit = await fetchRegistrationsByEmail();
    expect(afterSubmit.length).toBe(4);
    for (const p of participants) {
      const snap = afterSubmit.find((r) => r.user_email.toLowerCase() === p.email.toLowerCase());
      expect(snap, `DB row for ${p.label}`).toBeTruthy();
      expect(snap!.status, `${p.label} status`).toBe('pending');
    }

    // Step 2: operator sends invitations via UI.
    {
      const ctx = await browser.newContext();
      try {
        await authenticateAs(ctx, ENV.EMAILS.ADMIN1);
        const page = await ctx.newPage();
        await page.goto(TEAM_PATH);
        await expect(page.getByRole('heading', { name: 'רשימת הנרשמים' })).toBeVisible();
        const sendBtn = page.getByRole('button', { name: 'שליחת הזמנות' });
        await expect(sendBtn).toBeEnabled();
        await sendBtn.click();
        await expect(page.getByText('ההזמנות נשלחו')).toBeVisible();
      } finally {
        await ctx.close();
      }
    }

    const afterInvites = await fetchRegistrationsByEmail();
    for (const p of participants) {
      const snap = afterInvites.find((r) => r.user_email.toLowerCase() === p.email.toLowerCase());
      expect(snap!.status, `${p.label} after invite`).toBe('awaiting_response');
      expect(snap!.expires_at, `${p.label} expires_at set`).not.toBeNull();
    }

    // Step 3: all four accept via UI.
    for (const p of participants) {
      const ctx = await browser.newContext();
      try {
        await authenticateAs(ctx, p.email);
        const page = await ctx.newPage();
        await page.goto(APPLY_PATH);
        await expect(page.getByRole('button', { name: 'אישור המקום הזמני' })).toBeVisible();
        await page.getByRole('button', { name: 'אישור המקום הזמני' }).click();
        await expect(page.getByText('המקום הזמני אושר ונשמר עבורך.')).toBeVisible();
      } finally {
        await ctx.close();
      }
    }

    const afterAccept = await fetchRegistrationsByEmail();
    for (const p of participants) {
      const snap = afterAccept.find((r) => r.user_email.toLowerCase() === p.email.toLowerCase());
      expect(snap!.status, `${p.label} after accept`).toBe('confirmed');
    }

    // Step 4: operator marks attended via UI.
    {
      const ctx = await browser.newContext();
      try {
        await authenticateAs(ctx, ENV.EMAILS.ADMIN1);
        const page = await ctx.newPage();
        await page.goto(TEAM_PATH);
        const markBtn = page.getByRole('button', { name: 'סימון הגעה' });
        await expect(markBtn).toBeEnabled();
        await markBtn.click();
        await expect(page.getByText('כל 4 ההרשמות סומנו כהגיעו.', { exact: true })).toBeVisible();
      } finally {
        await ctx.close();
      }
    }

    const final = await fetchRegistrationsByEmail();
    for (const p of participants) {
      const snap = final.find((r) => r.user_email.toLowerCase() === p.email.toLowerCase());
      expect(snap!.status, `${p.label} final`).toBe('attended');
    }
  });
});
