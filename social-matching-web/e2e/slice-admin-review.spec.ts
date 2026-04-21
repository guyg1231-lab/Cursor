import { test, expect, type Page } from '@playwright/test';
import { authenticateAs } from './fixtures/auth';
import { deleteEventsForCreator, fetchEventById } from './fixtures/db';
import { ENV } from './fixtures/env';
import { createServiceRoleClient } from './fixtures/supabase';

/**
 * Admin-review slice: host submits via /host/events (draft → submitted_for_review),
 * then admin approves via /admin/event-requests (→ active + is_published=true,
 * host_user_id = created_by_user_id).
 *
 * Uses existing events_update_admin RLS via approveSubmittedEventRequest. No new
 * RPCs, no new DB surface, no changes to the validated participant/operator slice.
 */

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

async function findEventIdByTitleAndCreator(title: string, email: string): Promise<string | null> {
  const admin = createServiceRoleClient();
  const { data: profile, error: profErr } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  if (profErr) throw new Error(`profile lookup failed: ${profErr.message}`);
  if (!profile) return null;
  const { data, error } = await admin
    .from('events')
    .select('id')
    .eq('created_by_user_id', profile.id)
    .eq('title', title)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`event lookup failed: ${error.message}`);
  return data?.id ?? null;
}

async function fillDateTimeLocal(page: Page, label: string, value: string): Promise<void> {
  const input = page.getByLabel(label);
  await input.fill(value);
}

test.describe('Circles admin-review slice', () => {
  test.beforeAll(async () => {
    await deleteEventsForCreator(ENV.EMAILS.HOST1);
  });

  test('host submits a draft, admin approves, event becomes active+published', async ({ browser }) => {
    const uniqueTitle = `AR-slice ${Date.now()}`;
    // 150+ chars so the /events preview truncates with an ellipsis.
    const longDescription =
      'A calm, small gathering for people who prefer depth over small talk and want to spend an evening around one topic with four curated guests, plus coffee.';
    const previewPrefix = longDescription.slice(0, 40);
    const now = new Date();
    const starts = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    starts.setHours(19, 0, 0, 0);
    const deadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    deadline.setHours(19, 0, 0, 0);

    // Step 1: host fills draft + submits to review.
    {
      const ctx = await browser.newContext();
      try {
        await authenticateAs(ctx, ENV.EMAILS.HOST1);
        const page = await ctx.newPage();
        await page.goto('/host/events');
        await expect(page.getByRole('button', { name: 'טיוטה חדשה' })).toBeVisible();

        await page.getByLabel('כותרת האירוע').fill(uniqueTitle);
        await page.getByLabel('תיאור קצר').fill(longDescription);
        await page.getByLabel('עיר / אזור').fill('Tel Aviv');
        await page.getByLabel('קיבולת רצויה').fill('5');
        await fillDateTimeLocal(page, 'מועד האירוע', toLocalInputValue(starts));
        await fillDateTimeLocal(page, 'דדליין להגשה', toLocalInputValue(deadline));

        await page.getByRole('button', { name: 'שליחה לבדיקה מנהלית' }).click();
        await expect(page.getByText('בקשת האירוע נשלחה לבדיקה מנהלית.')).toBeVisible();
      } finally {
        await ctx.close();
      }
    }

    const submittedEventId = await findEventIdByTitleAndCreator(uniqueTitle, ENV.EMAILS.HOST1);
    expect(submittedEventId, 'submitted event row exists').toBeTruthy();

    const afterSubmit = await fetchEventById(submittedEventId!);
    expect(afterSubmit, 'event snapshot after submit').toBeTruthy();
    expect(afterSubmit!.status, 'status after host submit').toBe('submitted_for_review');
    expect(afterSubmit!.is_published, 'is_published after host submit').toBe(false);
    expect(afterSubmit!.host_user_id, 'host_user_id still null pre-approve').toBeNull();

    // Step 2: admin approves via /admin/event-requests.
    {
      const ctx = await browser.newContext();
      try {
        await authenticateAs(ctx, ENV.EMAILS.ADMIN1);
        const page = await ctx.newPage();
        await page.goto('/admin/event-requests');
        await expect(page.getByRole('heading', { name: 'נשלח לבדיקה' })).toBeVisible();

        // Card title is rendered as its own element with the exact title, while the
        // post-approve banner wraps it in quotes. Use exact match so the row-title
        // locator stops matching once the card is removed.
        const rowTitle = page.getByText(uniqueTitle, { exact: true });
        await expect(rowTitle).toBeVisible();
        const row = page.locator('div').filter({ has: rowTitle }).last();
        await row.getByRole('button', { name: 'אישור ופרסום' }).click();

        await expect(page.getByText(`Approved and published: "${uniqueTitle}".`)).toBeVisible();
        await expect(rowTitle).toHaveCount(0);
      } finally {
        await ctx.close();
      }
    }

    const afterApprove = await fetchEventById(submittedEventId!);
    expect(afterApprove, 'event snapshot after approve').toBeTruthy();
    expect(afterApprove!.status, 'status after admin approve').toBe('active');
    expect(afterApprove!.is_published, 'is_published after admin approve').toBe(true);
    expect(
      afterApprove!.host_user_id,
      'host_user_id set to creator after approve',
    ).toBe(afterApprove!.created_by_user_id);

    // Step 3: host sees shareable link after approval.
    {
      const ctx = await browser.newContext();
      try {
        await authenticateAs(ctx, ENV.EMAILS.HOST1);
        const hostPage = await ctx.newPage();
        await hostPage.goto('/host/events');
        await expect(hostPage.getByText('/gathering/')).toBeVisible();
      } finally {
        await ctx.close();
      }
    }

    // Step 4: /events exposes the truncated public description preview
    // (proves authoring -> admin approval -> public render, reusing the
    // existing events.description field, no applicant data).
    {
      const ctx = await browser.newContext();
      try {
        const page = await ctx.newPage();
        await page.goto('/events');
        await expect(page.getByText(previewPrefix, { exact: false })).toBeVisible();
        await expect(page.getByText(longDescription, { exact: true })).toHaveCount(0);
      } finally {
        await ctx.close();
      }
    }
  });
});
