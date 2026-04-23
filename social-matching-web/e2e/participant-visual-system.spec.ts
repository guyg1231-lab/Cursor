import { expect, test } from '@playwright/test';
import { authenticateAs } from './fixtures/auth';
import { ENV } from './fixtures/env';

test.describe('participant visual system', () => {
  test('events exposes participant shell, hero, and action rail semantics', async ({ page }) => {
    const eventId = '44444444-4444-4444-8444-444444444444';

    await page.route('**/rest/v1/rpc/get_public_event_social_signals', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            event_id: eventId,
            attendee_count: 0,
          },
        ]),
      });
    });

    await page.route('**/rest/v1/events*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: eventId,
            title: 'ערב שיחה קטן למי שמעדיף להתחבר לאט',
            description: 'מפגש רגוע, חם ומדויק עם מקום להיכנס לשיחה בלי לחץ.',
            city: 'תל אביב',
            starts_at: '2026-05-08T17:30:00.000Z',
            registration_deadline: '2026-05-05T17:30:00.000Z',
            venue_hint: 'נווה צדק',
            max_capacity: 8,
            status: 'active',
            is_published: true,
            created_at: '2026-04-01T10:00:00.000Z',
            updated_at: '2026-04-01T10:00:00.000Z',
            created_by_user_id: null,
            host_user_id: null,
            payment_required: false,
            price_cents: 0,
            currency: 'ILS',
          },
        ]),
      });
    });

    await page.goto('/events');

    await expect(page.getByTestId('participant-page-shell')).toBeVisible();
    await expect(page.getByTestId('participant-page-hero')).toBeVisible();
    const actionRail = page.getByTestId('participant-page-actions');
    await expect(actionRail).toBeVisible();
    await expect(actionRail.getByRole('link', { name: 'להציע מפגש חדש' })).toBeVisible();
    await expect(actionRail.getByRole('link', { name: 'להציע מפגש חדש' })).toHaveAttribute('href', '/events/propose');
    await expect(page.getByRole('link', { name: 'להציע מפגש חדש' })).toHaveCount(1);

    const firstSummaryCard = page.getByTestId('event-summary-card').first();
    await expect(firstSummaryCard).toBeVisible();
    await expect(firstSummaryCard.getByTestId('event-attendee-circles')).toBeVisible();
    await expect(firstSummaryCard.getByText('עדיין אין בפנים')).toBeVisible();
    await expect(firstSummaryCard.getByText(/החדר נבנה בקצב רגוע/)).toBeVisible();
    await expect(firstSummaryCard.getByTestId('event-summary-card-action')).toHaveAttribute('href', `/events/${eventId}`);
  });

  test('detail and apply keep participant continuity semantics across the flow', async ({ browser }) => {
    const eventId = '55555555-5555-4555-8555-555555555555';
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });

    try {
      await authenticateAs(ctx, ENV.EMAILS.P1);
      const page = await ctx.newPage();

      await page.route('**/rest/v1/rpc/get_public_event_social_signals', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              event_id: eventId,
              attendee_count: 3,
            },
          ]),
        });
      });

      await page.route('**/rest/v1/events*', async (route) => {
        const event = {
          id: eventId,
          title: 'ערב שיחה קטן למי שמעדיף להתחבר לאט',
          description: 'מפגש רגוע, חם ומדויק עם מקום להיכנס לשיחה בלי לחץ.',
          city: 'תל אביב',
          starts_at: '2026-05-08T17:30:00.000Z',
          registration_deadline: '2026-05-05T17:30:00.000Z',
          venue_hint: 'נווה צדק',
          max_capacity: 8,
          status: 'active',
          is_published: true,
          created_at: '2026-04-01T10:00:00.000Z',
          updated_at: '2026-04-01T10:00:00.000Z',
          created_by_user_id: null,
          host_user_id: null,
          payment_required: false,
          price_cents: 0,
          currency: 'ILS',
        };
        const isSingleEventRequest = route.request().url().includes(`id=eq.${eventId}`);

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(isSingleEventRequest ? event : [event]),
        });
      });
      await page.route('**/rest/v1/event_registrations*', async (route) => {
        if (route.request().method() !== 'GET') return route.continue();
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      });
      await page.route('**/rest/v1/matching_responses*', async (route) => {
        if (route.request().method() !== 'GET') return route.continue();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'participant-visual-matching-response',
              user_id: 'participant-visual-user',
              birth_date: '1995-05-05',
              social_link: 'https://example.com/p1',
            },
          ]),
        });
      });

      await page.goto('/events');
      await page.getByTestId('event-summary-card-action').first().click();

      await expect(page).toHaveURL(`/events/${eventId}`);
      await expect(page.getByTestId('event-identity-hero')).toBeVisible();
      await expect(page.getByTestId('participant-page-actions')).toBeVisible();
      await expect(page.getByTestId('participant-surface-panel').first()).toBeVisible();

      await page.getByRole('link', { name: /להגשה למפגש|להגיש שוב|להגשה ולסטטוס|למקום הזמני ולתגובה|לצפייה בסטטוס ההרשמה/i }).first().click();

      await expect(page).toHaveURL(`/events/${eventId}/apply`);
      await expect(page.getByTestId('event-identity-hero')).toBeVisible();
      await expect(page.getByTestId('participant-page-actions')).toBeVisible();
      await expect(page.getByTestId('participant-surface-panel').first()).toBeVisible();
    } finally {
      await ctx.close();
    }
  });

  test('events exposes the participant route state test id on error', async ({ page }) => {
    await page.route('**/rest/v1/events*', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'playwright forced error' }),
      });
    });

    await page.goto('/events');

    await expect(page.getByTestId('participant-route-state')).toBeVisible();
    await expect(page.getByText('שגיאת טעינה', { exact: true })).toBeVisible();
  });
});
