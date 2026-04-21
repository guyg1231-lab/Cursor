import { expect, type Page } from '@playwright/test';
import { ENV } from './env';

export const APPLY_PATH = `/events/${ENV.EVENT_ID}/apply`;
export const EVENT_PATH = `/gathering/${ENV.EVENT_ID}`;
export const TEAM_PATH = `/team/gathering/${ENV.EVENT_ID}`;

export type SliceParticipant = {
  label: 'P1' | 'P2' | 'P3' | 'P4';
  email: string;
  fullName: string;
  phone: string;
};

export function getSliceParticipants(): SliceParticipant[] {
  return [
    { label: 'P1', email: ENV.EMAILS.P1, fullName: 'P1 E2E', phone: '+972500000001' },
    { label: 'P2', email: ENV.EMAILS.P2, fullName: 'P2 E2E', phone: '+972500000002' },
    { label: 'P3', email: ENV.EMAILS.P3, fullName: 'P3 E2E', phone: '+972500000003' },
    { label: 'P4', email: ENV.EMAILS.P4, fullName: 'P4 E2E', phone: '+972500000004' },
  ];
}

/**
 * Fill and submit the canonical participant application form on /events/:eventId/apply.
 * Assumes the page is already authenticated for this participant.
 */
export async function submitApplicationViaUi(
  page: Page,
  fullName: string,
  phone: string,
  whyJoin: string,
): Promise<void> {
  await page.goto(APPLY_PATH);
  await expect(page.getByRole('heading', { level: 1, name: 'הגשה למפגש' })).toBeVisible();

  const whyJoinInput = page.locator('label:has-text("למה דווקא המפגש הזה מעניין אותך?") + textarea');
  const desiredOutcomeSelect = page.locator('label:has-text("מה היית רוצה לקבל מהמפגש הזה?") + select');
  const whatYouBringSelect = page.locator('label:has-text("מה היית רוצה להביא לקבוצה?") + select');
  const hostNoteInput = page.locator('label:has-text("יש משהו שחשוב למארגן לדעת?") + textarea');

  await expect(whyJoinInput).toBeVisible();
  await whyJoinInput.fill(whyJoin);
  await expect(desiredOutcomeSelect).toBeVisible();
  await desiredOutcomeSelect.selectOption('meet_new_people');
  await expect(whatYouBringSelect).toBeVisible();
  await whatYouBringSelect.selectOption('good_energy');
  await expect(hostNoteInput).toBeVisible();
  await hostNoteInput.fill(`${fullName} / ${phone}`);
  await page.getByRole('button', { name: 'שליחת הגשה' }).click();
  await expect(page.getByText('ההגשה נשמרה ונשלחה בהצלחה.')).toBeVisible();
}
