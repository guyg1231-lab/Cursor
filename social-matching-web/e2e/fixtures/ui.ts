import { expect, type Page } from '@playwright/test';
import { ENV } from './env';

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
 * Fill and submit the participant intake form on /gathering/:eventId.
 * Assumes the page is already authenticated for this participant.
 */
export async function submitApplicationViaUi(
  page: Page,
  fullName: string,
  phone: string,
  whyJoin: string,
): Promise<void> {
  await page.goto(EVENT_PATH);
  await expect(page.getByRole('textbox', { name: 'שם מלא' })).toBeVisible();
  await page.getByRole('textbox', { name: 'שם מלא' }).fill(fullName);
  await page.getByRole('textbox', { name: 'טלפון' }).fill(phone);
  await page.getByRole('textbox', { name: 'למה להצטרף למפגש הזה?' }).fill(whyJoin);
  await page.getByRole('button', { name: 'שליחת בקשה' }).click();
  await expect(page.getByText('הבקשה שלך נשמרה')).toBeVisible();
}
