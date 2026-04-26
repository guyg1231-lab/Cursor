import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { authenticateAs } from './fixtures/auth';
import { ENV } from './fixtures/env';

/** Browse grid merges localhost curated rows; scope to the stubbed event card by its detail link href. */
function eventSummaryCardFor(page: Page, eventId: string) {
  return page.getByTestId('event-summary-card').filter({ has: page.locator(`a[href="/events/${eventId}"]`) });
}

const APPLY_OR_STATUS_LINK =
  /להגשה למפגש|להגיש שוב|להגשה ולסטטוס|להרשמה וסטטוס|למקום הזמני ולתגובה|לצפייה בסטטוס ההרשמה/i;

test.describe('participant visual system', () => {
  test('participant action rails stay compact across browse, detail, and apply', async ({ browser }) => {
    const eventId = '66666666-6666-4666-8666-666666666666';
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
              id: 'participant-visual-matching-response-compact',
              user_id: 'participant-visual-user-compact',
              birth_date: '1995-05-05',
              social_link: 'https://example.com/p1',
            },
          ]),
        });
      });

      const expectCompactActionRail = async () => {
        const width = await page.getByTestId('participant-page-actions').evaluate((node) =>
          Math.round(node.getBoundingClientRect().width),
        );
        expect(width).toBeLessThan(760);
      };

      await page.goto('/events');
      await expectCompactActionRail();

      await eventSummaryCardFor(page, eventId).getByTestId('event-summary-card-action').click();
      await expect(page).toHaveURL(`/events/${eventId}`);
      await expectCompactActionRail();

      await page.getByRole('link', { name: APPLY_OR_STATUS_LINK }).first().click();
      await expect(page).toHaveURL(`/events/${eventId}/apply`);
      await expectCompactActionRail();
    } finally {
      await ctx.close();
    }
  });

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

    const targetCard = eventSummaryCardFor(page, eventId);
    await expect(targetCard).toBeVisible();
    await expect(targetCard.getByTestId('event-attendee-circles')).toBeVisible();
    await expect(targetCard.getByText('מעגל חדש נפתח עכשיו')).toBeVisible();
    await expect(targetCard.getByText(/הזדמנות להצטרף מההתחלה/)).toBeVisible();
    await expect(targetCard.getByTestId('event-summary-card-action')).toHaveAttribute('href', `/events/${eventId}`);
  });

  test('browse cards surface event-specific identity cues without breaking the calm shelf', async ({ page }) => {
    const eventId = '99999999-9999-4999-8999-999999999991';

    await page.route('**/rest/v1/rpc/get_public_event_social_signals', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            event_id: eventId,
            attendee_count: 4,
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
            title: 'פיקניק בפארק',
            description: 'שמיכה גדולה, פירות קיץ ושיחה פתוחה עם אנשים שבאים בנחת.',
            city: 'תל אביב',
            starts_at: '2026-05-08T17:30:00.000Z',
            registration_deadline: '2026-05-05T17:30:00.000Z',
            venue_hint: 'פארק הירקון',
            max_capacity: 12,
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

    const firstSummaryCard = page.getByTestId('event-summary-card').first();
    const symbol = firstSummaryCard.getByTestId('event-presentation-symbol');

    await expect(symbol).toBeVisible();
    await expect(symbol).toHaveAttribute('data-presentation-key', 'picnic');
    await expect(symbol.locator('svg')).toBeVisible();
    await expect(firstSummaryCard.getByText('אחר צהריים רגוע')).toBeVisible();
  });

  test('browse cards stay compact enough to avoid tall empty shelves on desktop', async ({ page }) => {
    const eventId = '88888888-8888-4888-8888-888888888888';

    await page.route('**/rest/v1/rpc/get_public_event_social_signals', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            event_id: eventId,
            attendee_count: 2,
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

    const height = await page.getByTestId('event-summary-card').first().evaluate((node) =>
      Math.round(node.getBoundingClientRect().height),
    );

    expect(height).toBeLessThan(460);
  });

  test('browse keeps stable multi-event identity tones from presentation keys', async ({ page }) => {
    await page.route('**/rest/v1/rpc/get_public_event_social_signals', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/rest/v1/events*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '11111111-1111-4111-8111-111111111111',
            title: 'פיקניק בפארק',
            description: 'שמיכה גדולה, פירות קיץ ושיחה פתוחה עם אנשים שבאים בנחת.',
            city: 'תל אביב',
            starts_at: '2026-05-08T17:30:00.000Z',
            registration_deadline: '2026-05-05T17:30:00.000Z',
            venue_hint: 'פארק הירקון',
            max_capacity: 12,
            status: 'active',
            is_published: true,
            presentation_key: 'picnic',
            created_at: '2026-04-01T10:00:00.000Z',
            updated_at: '2026-04-01T10:00:00.000Z',
            created_by_user_id: null,
            host_user_id: null,
            payment_required: false,
            price_cents: 0,
            currency: 'ILS',
          },
          {
            id: '22222222-2222-4222-8222-222222222222',
            title: 'קבוצת כדורעף חופים',
            description: 'משחק קליל ליד המים עם אנרגיה טובה והחלפות בין סבבים.',
            city: 'תל אביב',
            starts_at: '2026-05-12T17:30:00.000Z',
            registration_deadline: '2026-05-10T17:30:00.000Z',
            venue_hint: 'חוף גורדון',
            max_capacity: 14,
            status: 'active',
            is_published: true,
            presentation_key: 'beach-volleyball',
            created_at: '2026-04-01T10:00:00.000Z',
            updated_at: '2026-04-01T10:00:00.000Z',
            created_by_user_id: null,
            host_user_id: null,
            payment_required: false,
            price_cents: 0,
            currency: 'ILS',
          },
          {
            id: '33333333-3333-4333-8333-333333333333',
            title: 'קבוצת הליכה בטיילת',
            description: 'מסלול נעים עם עצירות לשיחה, קפה קטן ונוף פתוח לים.',
            city: 'תל אביב',
            starts_at: '2026-05-15T17:30:00.000Z',
            registration_deadline: '2026-05-12T17:30:00.000Z',
            venue_hint: 'טיילת תל אביב',
            max_capacity: 10,
            status: 'active',
            is_published: true,
            presentation_key: 'promenade-walk',
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
    const symbols = page.getByTestId('event-presentation-symbol');
    await expect(symbols).toHaveCount(3);
    await expect(symbols.nth(0)).toHaveAttribute('data-presentation-key', 'picnic');
    await expect(symbols.nth(1)).toHaveAttribute('data-presentation-key', 'beach-volleyball');
    await expect(symbols.nth(2)).toHaveAttribute('data-presentation-key', 'promenade-walk');
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
      await eventSummaryCardFor(page, eventId).getByTestId('event-summary-card-action').click();

      await expect(page).toHaveURL(`/events/${eventId}`);
      await expect(page.getByTestId('event-identity-hero')).toBeVisible();
      await expect(page.getByTestId('participant-page-actions')).toBeVisible();
      await expect(page.getByTestId('participant-surface-panel').first()).toBeVisible();

      await page.getByRole('link', { name: APPLY_OR_STATUS_LINK }).first().click();

      await expect(page).toHaveURL(`/events/${eventId}/apply`);
      await expect(page.getByTestId('event-identity-hero')).toBeVisible();
      await expect(page.getByTestId('participant-page-actions')).toBeVisible();
      await expect(page.getByTestId('participant-surface-panel').first()).toBeVisible();
    } finally {
      await ctx.close();
    }
  });

  test('detail and apply reuse the same event identity across the participant flow', async ({ browser }) => {
    const eventId = '99999999-9999-4999-8999-999999999992';
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
              attendee_count: 5,
            },
          ]),
        });
      });

      await page.route('**/rest/v1/events*', async (route) => {
        const event = {
          id: eventId,
          title: 'ערב סרט והרצאה בסינמטק',
          description: 'הקרנה עם הקדמה קצרה ושיחה טובה אחרי, למי שאוהב תרבות עם עומק.',
          city: 'תל אביב',
          starts_at: '2026-05-08T17:30:00.000Z',
          registration_deadline: '2026-05-05T17:30:00.000Z',
          venue_hint: 'סינמטק תל אביב',
          max_capacity: 16,
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
              id: 'participant-visual-cinema-response',
              user_id: 'participant-visual-cinema-user',
              birth_date: '1995-05-05',
              social_link: 'https://example.com/p1',
            },
          ]),
        });
      });

      await page.goto(`/events/${eventId}`);
      const detailHeroSymbol = page.getByTestId('event-identity-symbol');
      await expect(detailHeroSymbol).toBeVisible();
      await expect(detailHeroSymbol).toHaveAttribute('data-presentation-key', 'cinemateque');
      await expect(detailHeroSymbol.locator('svg')).toBeVisible();

      await page.getByRole('link', { name: APPLY_OR_STATUS_LINK }).first().click();

      await expect(page).toHaveURL(`/events/${eventId}/apply`);
      const applyHeroSymbol = page.getByTestId('event-identity-symbol');
      await expect(applyHeroSymbol).toBeVisible();
      await expect(applyHeroSymbol).toHaveAttribute('data-presentation-key', 'cinemateque');
      await expect(applyHeroSymbol.locator('svg')).toBeVisible();
    } finally {
      await ctx.close();
    }
  });

  test('detail and apply heroes stay compact enough to keep primary content above the fold', async ({ browser }) => {
    const eventId = '77777777-7777-4777-8777-777777777777';
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
              attendee_count: 4,
            },
          ]),
        });
      });

      await page.route('**/rest/v1/events*', async (route) => {
        const event = {
          id: eventId,
          title: 'מעגל היכרות תל אביב',
          description: 'מפגש קטן בסלון אינטימי עם שיחה מונחית וחיבור בין אנשים שחושבים דומה.',
          city: 'תל אביב',
          starts_at: '2026-05-08T17:30:00.000Z',
          registration_deadline: '2026-05-05T17:30:00.000Z',
          venue_hint: 'פלורנטין',
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
              id: 'participant-visual-matching-response-compact-hero',
              user_id: 'participant-visual-user-compact-hero',
              birth_date: '1995-05-05',
              social_link: 'https://example.com/p1',
            },
          ]),
        });
      });

      const expectCompactHero = async () => {
        const height = await page.getByTestId('event-identity-hero').evaluate((node) =>
          Math.round(node.getBoundingClientRect().height),
        );
        expect(height).toBeLessThan(370);
      };

      await page.goto(`/events/${eventId}`);
      await expectCompactHero();

      await page.goto(`/events/${eventId}/apply`);
      await expectCompactHero();
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

  test('events error state can retry and recover without manual refresh', async ({ page }) => {
    let requestCount = 0;
    await page.route('**/rest/v1/events*', async (route) => {
      requestCount += 1;
      if (requestCount === 1) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'forced failure for retry flow' }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '6eb9833c-8f6a-4b31-b42f-7e0b39e9d2de',
            title: 'ערב משחקים שכונתי',
            city: 'תל אביב',
            starts_at: '2030-02-14T18:30:00.000Z',
            status: 'active',
            is_published: true,
            description: 'מפגש קטן באווירה קלילה.',
          },
        ]),
      });
    });

    await page.goto('/events');
    await expect(page.getByTestId('participant-route-state')).toBeVisible();
    await expect(page.getByRole('button', { name: 'לנסות שוב' })).toBeVisible();

    await page.getByRole('button', { name: 'לנסות שוב' }).click();
    await expect(page.getByTestId('events-discovery-grid')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'ערב משחקים שכונתי' })).toBeVisible();
  });
});
