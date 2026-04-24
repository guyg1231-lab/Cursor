import { test, expect } from '@playwright/test';
import { authenticateAs } from './fixtures/auth';
import { ENV } from './fixtures/env';
import { createServiceRoleClient } from './fixtures/supabase';
import { withFlippedRegistrationStatus } from './fixtures/registrations';
import { submitApplicationViaUi } from './fixtures/ui';

test.describe('participant foundation', () => {
  test('desktop discovery shelf uses a compact 4-across layout on wide screens', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1400 });
    const events = Array.from({ length: 6 }, (_, index) => ({
      id: `4across-event-${index + 1}`,
      title: `אירוע בדיקה ${index + 1}`,
      description: 'מפגש קטן ואינטימי עם שיחה רגועה בעיר.',
      city: 'תל אביב',
      starts_at: `2026-05-0${(index % 6) + 1}T17:30:00.000Z`,
      registration_deadline: `2026-04-2${(index % 6) + 1}T17:30:00.000Z`,
      venue_hint: index % 2 === 0 ? 'נווה צדק' : 'כיכר ביאליק',
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
    }));

    await page.route('**/rest/v1/rpc/get_public_event_social_signals', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(events.map((event, index) => ({ event_id: event.id, attendee_count: 3 + index }))),
      });
    });

    await page.route('**/rest/v1/events*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(events),
      });
    });

    await page.goto('/events');

    const grid = page.getByTestId('events-discovery-grid');
    const cards = grid.getByTestId('event-summary-card');
    await expect(cards).toHaveCount(6);

    const sectionTop = await grid.evaluate((node) => Math.round(node.getBoundingClientRect().top));
    expect(sectionTop).toBeLessThan(320);

    const layout = await cards.evaluateAll((nodes) =>
      nodes.map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          right: Math.round(rect.right),
          height: Math.round(rect.height),
        };
      }),
    );

    const rowTops = [...new Set(layout.map((card) => card.y))].sort((a, b) => a - b);
    const firstRow = layout.filter((card) => card.y === rowTops[0]);
    const secondRow = layout.filter((card) => card.y === rowTops[1]);

    expect(rowTops.length).toBe(2);
    expect(firstRow).toHaveLength(4);
    expect(secondRow).toHaveLength(2);
    expect(new Set(firstRow.map((card) => card.height)).size).toBe(1);
    expect(Math.min(...firstRow.map((card) => card.x))).toBeGreaterThanOrEqual(0);
    expect(Math.max(...firstRow.map((card) => card.right))).toBeLessThanOrEqual(1600);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  });

  test('desktop discovery card and CTA feel interactive on hover', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1100 });
    const eventId = 'hover-event-1';

    await page.route('**/rest/v1/rpc/get_public_event_social_signals', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ event_id: eventId, attendee_count: 5 }]),
      });
    });

    await page.route('**/rest/v1/events*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: eventId,
            title: 'אירוע בדיקה להובר',
            description: 'מפגש קטן עם קצב רגוע ואווירה חמה.',
            city: 'תל אביב',
            starts_at: '2026-05-01T17:30:00.000Z',
            registration_deadline: '2026-04-29T17:30:00.000Z',
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

    const card = page.getByTestId('event-summary-card').first();
    const button = card.getByTestId('event-summary-card-action');

    const beforeCard = await card.evaluate((node) => {
      const styles = getComputedStyle(node);
      return { transform: styles.transform, shadow: styles.boxShadow };
    });
    await card.hover();
    await page.waitForTimeout(120);
    const afterCard = await card.evaluate((node) => {
      const styles = getComputedStyle(node);
      return { transform: styles.transform, shadow: styles.boxShadow };
    });

    expect(afterCard.transform).not.toBe(beforeCard.transform);
    expect(afterCard.shadow).not.toBe(beforeCard.shadow);

    const beforeButton = await button.evaluate((node) => {
      const styles = getComputedStyle(node);
      return { transform: styles.transform, shadow: styles.boxShadow };
    });
    await button.hover();
    await page.waitForTimeout(120);
    const afterButton = await button.evaluate((node) => {
      const styles = getComputedStyle(node);
      return { transform: styles.transform, shadow: styles.boxShadow };
    });

    expect(afterButton.transform).not.toBe(beforeButton.transform);
    expect(afterButton.shadow).not.toBe(beforeButton.shadow);
  });

  test('events uses shared Hebrew loading state copy while events are loading', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    let releaseEventsRequest: (() => void) | null = null;
    const eventsRequestReleased = new Promise<void>((resolve) => {
      releaseEventsRequest = resolve;
    });

    await page.route('**/rest/v1/events*', async (route) => {
      await eventsRequestReleased;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'playwright-f-1-event',
            title: 'מפגש בדיקת טעינה',
            description: 'נתון מדומה לבדיקת RouteLoadingState',
            city: 'תל אביב',
            starts_at: '2026-05-01T18:00:00.000Z',
            registration_deadline: '2026-04-30T18:00:00.000Z',
            venue_hint: 'מיקום יישלח בהמשך',
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

    await expect(page.getByText('טוענים…', { exact: true })).toBeVisible();
    await expect(page.getByText('המערכת טוענת את הדף, רק רגע.', { exact: true })).toBeVisible();

    if (!releaseEventsRequest) {
      throw new Error('Expected events request interception to be installed.');
    }
    releaseEventsRequest();

    const discoveryGrid = page.getByTestId('events-discovery-grid');
    await expect(discoveryGrid.getByRole('heading', { name: 'מפגש בדיקת טעינה' })).toBeVisible();
  });

  test('discovery links into canonical event detail before apply', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    await page.goto('/events');
    const discoveryGrid = page.getByTestId('events-discovery-grid');
    await discoveryGrid.getByRole('link', { name: 'לפרטי המפגש' }).first().click();
    await expect(page).toHaveURL(/\/events\/([0-9a-f-]+|initial-[a-z-]+)$/i);
    await expect(
      page.getByRole('link', {
        name: /להגשה למפגש|להגיש שוב|להגשה ולסטטוס|למקום הזמני ולתגובה|לצפייה בסטטוס ההרשמה|חזרה למפגשים/i,
      }).first(),
    ).toBeVisible();
  });

  test('events page offers a non-admin CTA to propose something new', async ({ page }) => {
    await page.goto('/events');
    const actionRail = page.getByTestId('participant-page-actions');
    await expect(actionRail).toBeVisible();
    await expect(actionRail.getByRole('link', { name: 'להציע מפגש חדש' })).toHaveAttribute('href', '/events/propose');
  });

  test('mobile discovery sheet can show attendee-circle count for a published event', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const mobileBrowseEventId = '11111111-1111-4111-8111-111111111111';

    await page.route('**/rest/v1/rpc/get_public_event_social_signals', async (route) => {
      const payload = route.request().postDataJSON() as { event_ids?: string[] } | undefined;
      expect(payload).toEqual({
        event_ids: [mobileBrowseEventId],
      });

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            event_id: mobileBrowseEventId,
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
            id: mobileBrowseEventId,
            title: 'ארוחת ערב קטנה עם שיחה שנפתחת לאט',
            description: 'מפגש אינטימי וחם לערב קטן בעיר.',
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
    const discoveryGrid = page.getByTestId('events-discovery-grid');
    await expect(discoveryGrid).toBeVisible();
    const summaryCard = discoveryGrid.getByTestId('event-summary-card').first();
    await expect(summaryCard).toBeVisible();
    await expect(summaryCard.getByTestId('event-attendee-circles')).toBeVisible();
    await expect(summaryCard.getByTestId('event-summary-card-action')).toHaveAttribute(
      'href',
      `/events/${mobileBrowseEventId}`,
    );
    await expect(discoveryGrid.getByText(/4 כבר בפנים/)).toBeVisible();
    await expect(discoveryGrid.getByText(/החדר נבנה בקצב רגוע/)).toBeVisible();
    await expect(page.getByTestId('mobile-event-discovery-list')).toHaveCount(0);
  });

  test('desktop discovery card keeps attendee-circle signal for a published event', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const desktopBrowseEventId = '22222222-2222-4222-8222-222222222222';

    await page.route('**/rest/v1/rpc/get_public_event_social_signals', async (route) => {
      const payload = route.request().postDataJSON() as { event_ids?: string[] } | undefined;
      expect(payload).toEqual({
        event_ids: [desktopBrowseEventId],
      });

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            event_id: desktopBrowseEventId,
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
            id: desktopBrowseEventId,
            title: 'ארוחת ערב קטנה עם שיחה שנפתחת לאט',
            description: 'מפגש אינטימי וחם לערב קטן בעיר.',
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
    const discoveryGrid = page.getByTestId('events-discovery-grid');
    await expect(discoveryGrid).toBeVisible();
    const summaryCard = discoveryGrid.getByTestId('event-summary-card').first();
    await expect(summaryCard).toBeVisible();
    await expect(summaryCard.getByTestId('event-attendee-circles')).toBeVisible();
    await expect(summaryCard.getByTestId('event-summary-card-action')).toHaveAttribute(
      'href',
      `/events/${desktopBrowseEventId}`,
    );
    await expect(discoveryGrid.getByText(/4 כבר בפנים/)).toBeVisible();
    await expect(discoveryGrid.getByText(/החדר נבנה בקצב רגוע/)).toBeVisible();
    await expect(page.getByTestId('desktop-event-discovery-list')).toHaveCount(0);
  });

  test('mobile discovery uses the shared dense grid and carries attendee circles into detail/apply', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mobileFlowEventId = '33333333-3333-4333-8333-333333333333';

    try {
      await authenticateAs(ctx, ENV.EMAILS.P1);
      const page = await ctx.newPage();

      await page.route('**/rest/v1/rpc/get_public_event_social_signals', async (route) => {
        const payload = route.request().postDataJSON() as { event_ids?: string[] } | undefined;
        expect(payload).toEqual({
          event_ids: [mobileFlowEventId],
        });

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              event_id: mobileFlowEventId,
              attendee_count: 4,
            },
          ]),
        });
      });

      await page.route('**/rest/v1/events*', async (route) => {
        const event = {
          id: mobileFlowEventId,
          title: 'ארוחת ערב קטנה עם שיחה שנפתחת לאט',
          description: 'מפגש אינטימי וחם לערב קטן בעיר.',
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
        const isSingleEventRequest = route.request().url().includes(`id=eq.${mobileFlowEventId}`);

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
              id: 'stubbed-matching-response',
              user_id: 'stubbed-user',
              completed_at: new Date().toISOString(),
              birth_date: '1990-01-01',
              social_link: 'https://instagram.com/testuser',
            },
          ]),
        });
      });
      await page.route('**/rest/v1/profiles*', async (route) => {
        if (route.request().method() !== 'GET') return route.continue();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              funnel_status: 'ready_for_registration',
            },
          ]),
        });
      });

      await page.goto('/events');

      const discoveryGrid = page.getByTestId('events-discovery-grid');
      await expect(discoveryGrid).toBeVisible();
      await expect(discoveryGrid.getByTestId('event-attendee-circles').first()).toBeVisible();
      await expect(discoveryGrid.getByText(/4 כבר בפנים/)).toBeVisible();
      await expect(discoveryGrid.getByText(/החדר נבנה בקצב רגוע/)).toBeVisible();
      await expect(page.getByTestId('mobile-event-discovery-list')).toHaveCount(0);
      await discoveryGrid.getByRole('link', { name: 'לפרטי המפגש' }).click();

      await expect(page.getByTestId('event-attendee-circles')).toBeVisible();
      await expect(page.getByText(/הערב מתחיל לקבל צורה/)).toBeVisible();
      await expect(page.getByRole('link', { name: 'להגשה למפגש' })).toBeVisible();

      await page.getByRole('link', { name: 'להגשה למפגש' }).click();
      await expect(page.getByTestId('event-attendee-circles')).toBeVisible();
      await expect(page.getByText(/החדר כבר מתחיל להיבנות/)).toBeVisible();
      await expect(page.getByRole('heading', { name: 'פרטים על ההגשה' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'שליחת הגשה' })).toBeVisible();
    } finally {
      await ctx.close();
    }
  });

  test('mobile event detail keeps published closed events visible without a dead-end feel', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const closedEventId = '22222222-2222-4222-8222-222222222222';

    await page.route('**/rest/v1/events*', async (route) => {
      const event = {
        id: closedEventId,
        title: 'הליכת בוקר ושיחת קפה',
        description: 'מפגש קטן ופתוח לשיחה בדרך אחרת.',
        city: 'תל אביב',
        starts_at: '2026-05-10T07:00:00.000Z',
        registration_deadline: '2026-05-01T07:00:00.000Z',
        venue_hint: 'פארק הירקון',
        max_capacity: 6,
        status: 'closed',
        is_published: true,
        created_at: '2026-04-01T10:00:00.000Z',
        updated_at: '2026-04-01T10:00:00.000Z',
        created_by_user_id: null,
        host_user_id: null,
        payment_required: false,
        price_cents: 0,
        currency: 'ILS',
      };
      const isSingleEventRequest = route.request().url().includes(`id=eq.${closedEventId}`);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(isSingleEventRequest ? event : [event]),
      });
    });

    await page.goto(`/events/${closedEventId}`);
    await expect(
      page.getByText('העמוד נשאר פתוח כדי לאפשר הבנה רגועה של הערב הזה גם אחרי שהחלון נסגר.', { exact: true }),
    ).toBeVisible();
    await expect(page.getByText('ההגשות למפגש הזה אינן פתוחות כרגע.', { exact: true })).toBeVisible();
    await expect(
      page.getByText('ההגשה סגורה כרגע, אבל אפשר עדיין להבין אם המפגש הזה היה מתאים לך.', { exact: true }),
    ).toBeVisible();
  });

  test('authenticated participant can open /events/propose without admin role bias', async ({ browser }) => {
    const ctx = await browser.newContext();
    try {
      await authenticateAs(ctx, ENV.EMAILS.P1);
      const page = await ctx.newPage();

      await page.goto('/events/propose');
      await expect(page).toHaveURL(/\/events\/propose$/);
      await expect(page.getByText('אין לך גישה לעמוד הזה', { exact: true })).toHaveCount(0);
      await expect(page.getByRole('heading', { level: 1, name: 'בקשת אירוע' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'טיוטה חדשה' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'שליחה לבדיקה מנהלית' })).toBeVisible();
    } finally {
      await ctx.close();
    }
  });

  // Apply surface varies with staging data: participant may be gated (questionnaire /
  // registration closed / prior status) or eligible with the open form. Dedicated tests
  // below cover deterministic registration-state branches.
  test('authenticated participant sees a stable apply surface on /apply', async ({ browser }) => {
    const ctx = await browser.newContext();
    try {
      await authenticateAs(ctx, ENV.EMAILS.P1);
      const page = await ctx.newPage();

      await page.goto(`/events/${ENV.EVENT_ID}/apply`);
      await expect(
        page.getByRole('heading', { level: 1, name: /הגשה למפגש|סטטוס ההרשמה|הגשת מועמדות למפגש/i }),
      ).toBeVisible();
      await expect(page.getByTestId('event-identity-hero')).toBeVisible();
      await expect(page.getByTestId('participant-surface-panel').first()).toBeVisible();
    } finally {
      await ctx.close();
    }
  });

  test('apply: open form hides payment prompts even when readiness and event state are satisfied', async ({ browser }) => {
    const ctx = await browser.newContext();
    try {
      await authenticateAs(ctx, ENV.EMAILS.P1);
      const page = await ctx.newPage();

      await page.route('**/rest/v1/matching_responses*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'stubbed-matching-response',
              user_id: 'stubbed-user',
              completed_at: new Date().toISOString(),
              birth_date: '1990-01-01',
              social_link: 'https://instagram.com/testuser',
            },
          ]),
        });
      });
      await page.route('**/rest/v1/event_registrations*', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      });

      await page.goto(`/events/${ENV.EVENT_ID}/apply`);

      await expect(page.getByRole('heading', { name: 'פרטים על ההגשה' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'שליחת הגשה' })).toBeVisible();
      await expect(page.getByText('אני מבין/ה שהתשלום יישלח רק אם אתקבל/י.')).toHaveCount(0);
      await expect(page.getByText('אם אתקבל/י, אני מתחייב/ת לשלם בזמן כדי לשמור על המקום שלי.')).toHaveCount(0);
    } finally {
      await ctx.close();
    }
  });

  test('submitApplicationViaUi uses canonical apply controls without positional selectors', async ({ browser }) => {
    const ctx = await browser.newContext();
    try {
      await authenticateAs(ctx, ENV.EMAILS.P1);
      const page = await ctx.newPage();
      let submitSucceeded = false;
      await page.addInitScript(() => {
        const decoy = document.createElement('section');
        decoy.setAttribute('aria-label', 'decoy-apply-controls');
        decoy.innerHTML = `
          <textarea aria-label="Decoy intro textarea"></textarea>
          <select aria-label="Decoy outcome select">
            <option value="">Choose</option>
            <option value="different_value">Different</option>
          </select>
          <select aria-label="Decoy bring select">
            <option value="">Choose</option>
            <option value="different_value">Different</option>
          </select>
          <textarea aria-label="Decoy host note"></textarea>
        `;
        document.body.prepend(decoy);
      });
      await page.route('**/rest/v1/matching_responses*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'stubbed-matching-response',
              user_id: 'stubbed-user',
              completed_at: new Date().toISOString(),
              birth_date: '1990-01-01',
              social_link: 'https://instagram.com/testuser',
            },
          ]),
        });
      });
      await page.route('**/rest/v1/rpc/register_or_reregister_with_email', async (route) => {
        submitSucceeded = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{ is_new: true }]),
        });
      });
      await page.route('**/rest/v1/event_registrations*', async (route) => {
        if (!submitSucceeded) {
          await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'stubbed-registration',
              event_id: ENV.EVENT_ID,
              user_id: 'stubbed-user',
              status: 'pending',
              submitted_at: new Date().toISOString(),
              application_answers: {
                why_this_event: 'Contract test for canonical apply helper selectors',
                desired_outcome: 'meet_new_people',
                what_you_bring: 'good_energy',
                host_note: 'P1 E2E / +972500000001',
                submitted_at: new Date().toISOString(),
              },
            },
          ]),
        });
      });

      await submitApplicationViaUi(page, 'P1 E2E', '+972500000001', 'Contract test for canonical apply helper selectors');
    } finally {
      await ctx.close();
    }
  });

  test('apply: pending registration shows the submitted-state panel', async ({ browser }) => {
    const admin = createServiceRoleClient();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id')
      .eq('email', ENV.EMAILS.P1)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile?.id) throw new Error('E2E missing P1 profile');

    await withFlippedRegistrationStatus(
      admin,
      { userId: profile.id, eventId: ENV.EVENT_ID },
      { status: 'pending', expires_at: null, offered_at: null },
      async () => {
        const ctx = await browser.newContext();
        try {
          await authenticateAs(ctx, ENV.EMAILS.P1);
          const page = await ctx.newPage();
          await page.goto(`/events/${ENV.EVENT_ID}/apply`);
          await expect(page.getByRole('heading', { name: 'סטטוס ההרשמה' })).toBeVisible();
          await expect(page.getByText('ההגשה שלך נשלחה', { exact: true })).toBeVisible();
          await expect(page.getByText('ההגשה שלך נשמרה ונמצאת כרגע בבדיקה.', { exact: true })).toBeVisible();
        } finally {
          await ctx.close();
        }
      },
    );
  });

  test('apply: waitlist status shows waitlist panel copy', async ({ browser }) => {
    const admin = createServiceRoleClient();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id')
      .eq('email', ENV.EMAILS.P1)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile?.id) throw new Error('E2E missing P1 profile');

    await withFlippedRegistrationStatus(
      admin,
      { userId: profile.id, eventId: ENV.EVENT_ID },
      { status: 'waitlist', expires_at: null, offered_at: null },
      async () => {
        const ctx = await browser.newContext();
        try {
          await authenticateAs(ctx, ENV.EMAILS.P1);
          const page = await ctx.newPage();
          await page.goto(`/events/${ENV.EVENT_ID}/apply`);
          await expect(page.getByRole('heading', { name: 'סטטוס ההרשמה' })).toBeVisible();
          await expect(page.getByText('ההגשה ברשימת המתנה', { exact: true })).toBeVisible();
          await expect(
            page.getByText('כרגע אין לך מקום שמור, אבל ההרשמה שלך עדיין נמצאת ברשימת ההמתנה.', { exact: true }),
          ).toBeVisible();
        } finally {
          await ctx.close();
        }
      },
    );
  });

  test('apply: attended status shows completed-event panel', async ({ browser }) => {
    const admin = createServiceRoleClient();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id')
      .eq('email', ENV.EMAILS.P1)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile?.id) throw new Error('E2E missing P1 profile');

    await withFlippedRegistrationStatus(
      admin,
      { userId: profile.id, eventId: ENV.EVENT_ID },
      { status: 'attended', expires_at: null, offered_at: null },
      async () => {
        const ctx = await browser.newContext();
        try {
          await authenticateAs(ctx, ENV.EMAILS.P1);
          const page = await ctx.newPage();
          await page.goto(`/events/${ENV.EVENT_ID}/apply`);
          await expect(page.getByRole('heading', { name: 'סטטוס ההרשמה' })).toBeVisible();
          await expect(page.getByText('המפגש כבר הסתיים', { exact: true })).toBeVisible();
          await expect(page.getByText('השתתפת במפגש', { exact: true })).toBeVisible();
        } finally {
          await ctx.close();
        }
      },
    );
  });

  test('apply: approved status shows reserved-place panel', async ({ browser }) => {
    const admin = createServiceRoleClient();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id')
      .eq('email', ENV.EMAILS.P1)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile?.id) throw new Error('E2E missing P1 profile');

    await withFlippedRegistrationStatus(
      admin,
      { userId: profile.id, eventId: ENV.EVENT_ID },
      { status: 'approved', expires_at: null, offered_at: null },
      async () => {
        const ctx = await browser.newContext();
        try {
          await authenticateAs(ctx, ENV.EMAILS.P1);
          const page = await ctx.newPage();
          await page.goto(`/events/${ENV.EVENT_ID}/apply`);
          await expect(page.getByRole('heading', { name: 'סטטוס ההרשמה' })).toBeVisible();
          await expect(page.getByText('המקום שלך במפגש נשמר', { exact: true })).toBeVisible();
          await expect(page.getByText('המקום שלך למפגש הזה כבר שמור.', { exact: true })).toBeVisible();
        } finally {
          await ctx.close();
        }
      },
    );
  });

  test('apply: confirmed status shows reserved-place panel', async ({ browser }) => {
    const admin = createServiceRoleClient();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id')
      .eq('email', ENV.EMAILS.P1)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile?.id) throw new Error('E2E missing P1 profile');

    await withFlippedRegistrationStatus(
      admin,
      { userId: profile.id, eventId: ENV.EVENT_ID },
      { status: 'confirmed', expires_at: null, offered_at: null },
      async () => {
        const ctx = await browser.newContext();
        try {
          await authenticateAs(ctx, ENV.EMAILS.P1);
          const page = await ctx.newPage();
          await page.goto(`/events/${ENV.EVENT_ID}/apply`);
          await expect(page.getByRole('heading', { name: 'סטטוס ההרשמה' })).toBeVisible();
          await expect(page.getByText('המקום שלך במפגש נשמר', { exact: true })).toBeVisible();
          await expect(page.getByText('המקום שלך למפגש הזה כבר שמור.', { exact: true })).toBeVisible();
        } finally {
          await ctx.close();
        }
      },
    );
  });

  test('apply: no_show status shows completed-event panel', async ({ browser }) => {
    const admin = createServiceRoleClient();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id')
      .eq('email', ENV.EMAILS.P1)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile?.id) throw new Error('E2E missing P1 profile');

    await withFlippedRegistrationStatus(
      admin,
      { userId: profile.id, eventId: ENV.EVENT_ID },
      { status: 'no_show', expires_at: null, offered_at: null },
      async () => {
        const ctx = await browser.newContext();
        try {
          await authenticateAs(ctx, ENV.EMAILS.P1);
          const page = await ctx.newPage();
          await page.goto(`/events/${ENV.EVENT_ID}/apply`);
          await expect(page.getByRole('heading', { name: 'סטטוס ההרשמה' })).toBeVisible();
          await expect(page.getByText('המפגש כבר הסתיים', { exact: true })).toBeVisible();
          await expect(page.getByText('סומן/ה כהיעדרות', { exact: true })).toBeVisible();
        } finally {
          await ctx.close();
        }
      },
    );
  });

  test('dashboard exposes participant next steps with a questionnaire handoff', async ({ browser }) => {
    const ctx = await browser.newContext();
    try {
      await authenticateAs(ctx, ENV.EMAILS.P1);
      const page = await ctx.newPage();

      await page.goto('/dashboard');
      await expect(page.getByRole('link', { name: 'לשאלון הפרופיל' })).toBeVisible();
      await expect(
        page.getByRole('heading', { level: 3, name: /לפני ההגשה הבאה/i }),
      ).toBeVisible();
    } finally {
      await ctx.close();
    }
  });

  test('dashboard shows profile readiness as ready', async ({ browser }) => {
    const ctx = await browser.newContext();
    try {
      await authenticateAs(ctx, ENV.EMAILS.P1);
      const page = await ctx.newPage();

      await page.goto('/dashboard');
      await expect(page.getByRole('heading', { level: 1, name: 'האזור האישי שלך' })).toBeVisible();
      await expect(page.getByRole('heading', { level: 3, name: 'מוכנות להגשה' })).toBeVisible();
      await expect(page.getByText('מוכנים להגיש למפגשים', { exact: true })).toBeVisible();
      await expect(page.getByText('מוכן להגשה', { exact: true })).toBeVisible();
    } finally {
      await ctx.close();
    }
  });

  test('dashboard proposal CTA links to /events/propose', async ({ browser }) => {
    const ctx = await browser.newContext();
    try {
      await authenticateAs(ctx, ENV.EMAILS.P1);
      const page = await ctx.newPage();

      await page.goto('/dashboard');
      await expect(page.getByRole('link', { name: 'להציע מפגש חדש' })).toHaveAttribute('href', '/events/propose');
    } finally {
      await ctx.close();
    }
  });

  test('StatusBadge: apply surface shows current application short label when reapply form visible', async ({
    browser,
  }) => {
    const admin = createServiceRoleClient();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id')
      .eq('email', ENV.EMAILS.P1)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile?.id) throw new Error('E2E missing P1 profile');

    await withFlippedRegistrationStatus(
      admin,
      { userId: profile.id, eventId: ENV.EVENT_ID },
      { status: 'rejected' },
      async () => {
        const ctx = await browser.newContext();
        try {
          await authenticateAs(ctx, ENV.EMAILS.P1);
          const page = await ctx.newPage();
          await page.goto(`/events/${ENV.EVENT_ID}/apply`);
          const badge = page.getByText('לא נבחר/ת הפעם', { exact: true });
          await expect(badge).toBeVisible();
        } finally {
          try {
            await ctx.close();
          } catch {
            // Ignore browser context close failures during teardown.
          }
        }
      },
    );
  });

  test('cancelled participant sees open apply form with prior submission summary', async ({ browser }) => {
    const admin = createServiceRoleClient();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id')
      .eq('email', ENV.EMAILS.P1)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile?.id) throw new Error('E2E missing P1 profile');

    await withFlippedRegistrationStatus(
      admin,
      { userId: profile.id, eventId: ENV.EVENT_ID },
      { status: 'cancelled' },
      async () => {
        const ctx = await browser.newContext();
        try {
          await authenticateAs(ctx, ENV.EMAILS.P1);
          const page = await ctx.newPage();
          await page.goto(`/events/${ENV.EVENT_ID}/apply`);
          await expect(page.getByRole('heading', { name: 'פרטים על ההגשה' })).toBeVisible();
          await expect(page.getByRole('heading', { name: 'ההגשה הקודמת שלך' })).toBeVisible();
          await expect(page.getByRole('button', { name: 'שליחת הגשה' })).toBeVisible();
          await expect(page.getByText(/אישור תשלום לאחר קבלה/)).toHaveCount(0);
          await expect(page.getByText(/התחייבות להגיע בזמן/)).toHaveCount(0);
        } finally {
          try {
            await ctx.close();
          } catch {
            // Ignore browser context close failures during teardown.
          }
        }
      },
    );
  });

  test('P1 awaiting temporary offer sees Hebrew deadline footer on apply', async ({ browser }) => {
    const admin = createServiceRoleClient();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id')
      .eq('email', ENV.EMAILS.P1)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile?.id) throw new Error('E2E missing P1 profile');

    const futureExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await withFlippedRegistrationStatus(
      admin,
      { userId: profile.id, eventId: ENV.EVENT_ID },
      {
        status: 'awaiting_response',
        expires_at: futureExpires,
        offered_at: new Date().toISOString(),
      },
      async () => {
        const ctx = await browser.newContext();
        try {
          await authenticateAs(ctx, ENV.EMAILS.P1);
          const page = await ctx.newPage();
          await page.goto(`/events/${ENV.EVENT_ID}/apply`);
          await expect(page.getByText(/מועד אחרון לתגובה/)).toBeVisible();
        } finally {
          try {
            await ctx.close();
          } catch {
            // Ignore browser context close failures during teardown.
          }
        }
      },
    );
  });

  test('apply: expired awaiting_response shows expired-offer panel', async ({ browser }) => {
    const admin = createServiceRoleClient();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id')
      .eq('email', ENV.EMAILS.P1)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile?.id) throw new Error('E2E missing P1 profile');

    const pastExpires = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

    await withFlippedRegistrationStatus(
      admin,
      { userId: profile.id, eventId: ENV.EVENT_ID },
      {
        status: 'awaiting_response',
        expires_at: pastExpires,
        offered_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      async () => {
        const ctx = await browser.newContext();
        try {
          await authenticateAs(ctx, ENV.EMAILS.P1);
          const page = await ctx.newPage();
          await page.goto(`/events/${ENV.EVENT_ID}/apply`);
          await expect(page.getByRole('heading', { name: 'סטטוס ההרשמה' })).toBeVisible();
          await expect(page.getByText('חלון התגובה למקום הזמני נסגר', { exact: true })).toBeVisible();
          await expect(page.getByText('המקום הזמני כבר לא ממתין לתגובה.', { exact: true })).toBeVisible();
          await expect(page.getByText(/המועד שעבר:/)).toBeVisible();
        } finally {
          await ctx.close();
        }
      },
    );
  });

  test('apply: awaiting_response confirm CTA transitions to reserved-place state', async ({ browser }) => {
    const admin = createServiceRoleClient();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id')
      .eq('email', ENV.EMAILS.P1)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile?.id) throw new Error('E2E missing P1 profile');

    const futureExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await withFlippedRegistrationStatus(
      admin,
      { userId: profile.id, eventId: ENV.EVENT_ID },
      {
        status: 'awaiting_response',
        expires_at: futureExpires,
        offered_at: new Date().toISOString(),
      },
      async () => {
        const ctx = await browser.newContext();
        try {
          await authenticateAs(ctx, ENV.EMAILS.P1);
          const page = await ctx.newPage();
          await page.goto(`/events/${ENV.EVENT_ID}/apply`);

          await expect(page.getByRole('button', { name: 'אישור המקום הזמני' })).toBeVisible();
          await page.getByRole('button', { name: 'אישור המקום הזמני' }).click();

          await expect(page.getByText('המקום הזמני אושר ונשמר עבורך.', { exact: true })).toBeVisible();
          await expect(page.getByText('המקום שלך במפגש נשמר', { exact: true })).toBeVisible();
          await expect(page.getByRole('button', { name: 'אישור המקום הזמני' })).toHaveCount(0);
        } finally {
          await ctx.close();
        }
      },
    );
  });

  test('dashboard and apply remain consistent for awaiting_response lifecycle semantics', async ({ browser }) => {
    const admin = createServiceRoleClient();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id')
      .eq('email', ENV.EMAILS.P1)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile?.id) throw new Error('E2E missing P1 profile');

    const futureExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await withFlippedRegistrationStatus(
      admin,
      { userId: profile.id, eventId: ENV.EVENT_ID },
      {
        status: 'awaiting_response',
        expires_at: futureExpires,
        offered_at: new Date().toISOString(),
      },
      async () => {
        const ctx = await browser.newContext();
        try {
          await authenticateAs(ctx, ENV.EMAILS.P1);
          const page = await ctx.newPage();
          await page.goto('/dashboard');

          const appsCard = page.getByRole('heading', { level: 3, name: 'ההגשות שלך' }).locator('..').locator('..');
          await expect(appsCard.getByRole('link', { name: 'לתגובה על המקום הזמני' })).toBeVisible();
          await appsCard.getByRole('link', { name: 'לתגובה על המקום הזמני' }).click();

          await expect(page).toHaveURL(new RegExp(`/events/${ENV.EVENT_ID}/apply$`));
          await expect(page.getByText('נשמר עבורך מקום זמני', { exact: true })).toBeVisible();
          await expect(page.getByRole('button', { name: 'אישור המקום הזמני' })).toBeVisible();
          await expect(page.getByText(/מועד אחרון לתגובה/)).toBeVisible();
        } finally {
          await ctx.close();
        }
      },
    );
  });

  test('event detail shows temporary-offer deadline as ApplicationStatusPanel footer for awaiting P1', async ({
    browser,
  }) => {
    const admin = createServiceRoleClient();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id')
      .eq('email', ENV.EMAILS.P1)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile?.id) throw new Error('E2E missing P1 profile');

    const futureExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await withFlippedRegistrationStatus(
      admin,
      { userId: profile.id, eventId: ENV.EVENT_ID },
      {
        status: 'awaiting_response',
        expires_at: futureExpires,
        offered_at: new Date().toISOString(),
      },
      async () => {
        const ctx = await browser.newContext();
        try {
          await authenticateAs(ctx, ENV.EMAILS.P1);
          const page = await ctx.newPage();
          await page.goto(`/events/${ENV.EVENT_ID}`);
          await expect(page.getByText(/מועד אחרון לתגובה/)).toBeVisible();
          await expect(page.getByText('מקום זמני ממתין לתגובה', { exact: true })).toBeVisible();
        } finally {
          try {
            await ctx.close();
          } catch {
            // Ignore browser context close failures during teardown.
          }
        }
      },
    );
  });


  test('dashboard lifecycle list shows reserved status chip for confirmed application', async ({ browser }) => {
    const admin = createServiceRoleClient();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id')
      .eq('email', ENV.EMAILS.P1)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile?.id) throw new Error('E2E missing P1 profile');

    await withFlippedRegistrationStatus(
      admin,
      { userId: profile.id, eventId: ENV.EVENT_ID },
      { status: 'confirmed' },
      async () => {
        const ctx = await browser.newContext();
        try {
          await authenticateAs(ctx, ENV.EMAILS.P1);
          const page = await ctx.newPage();

          await page.goto('/dashboard');
          const appsCard = page.getByRole('heading', { level: 3, name: 'ההגשות שלך' }).locator('..').locator('..');
          await expect(appsCard.getByText('המקום שלך שמור', { exact: true })).toBeVisible();
          await expect(appsCard.getByRole('link', { name: 'להגשה ולסטטוס' })).toHaveAttribute(
            'href',
            `/events/${ENV.EVENT_ID}/apply`,
          );
        } finally {
          try {
            await ctx.close();
          } catch {
            // Ignore browser context close failures during teardown.
          }
        }
      },
    );
  });

  test('dashboard awaiting-response row shows summary, deadline line, and response CTA', async ({
    browser,
  }) => {
    const admin = createServiceRoleClient();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id')
      .eq('email', ENV.EMAILS.P1)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile?.id) throw new Error('E2E missing P1 profile');

    const futureExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await withFlippedRegistrationStatus(
      admin,
      { userId: profile.id, eventId: ENV.EVENT_ID },
      {
        status: 'awaiting_response',
        expires_at: futureExpires,
        offered_at: new Date().toISOString(),
      },
      async () => {
        const ctx = await browser.newContext();
        try {
          await authenticateAs(ctx, ENV.EMAILS.P1);
          const page = await ctx.newPage();

          await page.goto('/dashboard');
          const appsCard = page.getByRole('heading', { level: 3, name: 'ההגשות שלך' }).locator('..').locator('..');
          await expect(appsCard.getByText('מקום זמני ממתין לתגובה', { exact: true })).toBeVisible();
          await expect(
            appsCard.getByText('נשמר עבורך מקום זמני. כדי לשמור עליו צריך לאשר בזמן.', { exact: true }),
          ).toBeVisible();
          await expect(appsCard.getByText(/מועד אחרון לתגובה:/)).toBeVisible();
          await expect(appsCard.getByRole('link', { name: 'לתגובה על המקום הזמני' })).toBeVisible();
        } finally {
          await ctx.close();
        }
      },
    );
  });

  test('unauthenticated apply preserves returnTo through sign-in', async ({ page }) => {
    await page.goto(`/events/${ENV.EVENT_ID}/apply`);
    await expect(page).toHaveURL(/\/(sign-in|auth)(\?|$)/);
    await expect(page).toHaveURL(new RegExp(`returnTo=.*events.*${ENV.EVENT_ID}.*apply`));
    await expect(page.getByText(/כניסה|אימות/i).first()).toBeVisible();
  });

  // Without magic-link tokens, AuthCallbackPage may flash the loading shell then
  // land on the error UI on the same URL (AuthCallbackPage.tsx). Redirect only
  // happens when a session exists. `waitForFunction` proves /מאמתים/ appeared
  // during navigation; a follow-up visibility assert can race the transition.
  test('auth callback shows loading copy during session resolution', async ({ browser }) => {
    const ctx = await browser.newContext();
    try {
      const page = await ctx.newPage();
      const sawLoading = page.waitForFunction(
        () => /מאמתים/.test(document.body.innerText),
        { timeout: 15_000 },
      );
      await Promise.all([page.goto('/auth/callback'), sawLoading]);
    } finally {
      await ctx.close();
    }
  });

  test('dashboard shows empty applications state with CTA to events', async ({ browser }) => {
    const ctx = await browser.newContext();
    try {
      // Staging: P1–P4 each have ≥1 registration; ADMIN1 has zero event_registrations (see plan Task 3).
      await authenticateAs(ctx, ENV.EMAILS.ADMIN1);
      const page = await ctx.newPage();

      await page.goto('/dashboard');
      await expect(page.getByText('אין עדיין הגשות', { exact: true })).toBeVisible();
      await expect(page.getByRole('link', { name: 'למפגשים פתוחים' })).toBeVisible();
    } finally {
      await ctx.close();
    }
  });

  test('regression: dashboard readiness and applications render together', async ({ browser }) => {
    const ctx = await browser.newContext();
    try {
      await authenticateAs(ctx, ENV.EMAILS.P1);
      const page = await ctx.newPage();

      await page.goto('/dashboard');

      await expect(page.getByRole('heading', { level: 1, name: 'האזור האישי שלך' })).toBeVisible();
      await expect(page.getByRole('heading', { level: 3, name: 'מוכנות להגשה' })).toBeVisible();
      await expect(page.getByText('מוכן להגשה', { exact: true })).toBeVisible();

      await expect(page.getByRole('heading', { level: 3, name: 'ההגשות שלך' })).toBeVisible();
    } finally {
      await ctx.close();
    }
  });

  test('gathering page frames itself as a later-stage participant view and links to the canonical apply page', async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    await authenticateAs(ctx, ENV.EMAILS.P1);
    const page = await ctx.newPage();
    try {
      await page.goto(`/gathering/${ENV.EVENT_ID}`);
      await expect(
        page.getByText('כאן רואים מה קורה אחרי ההגשה, ומה הצעד הבא אם נשמר עבורך מקום או סטטוס מעודכן.'),
      ).toBeVisible();
      await expect(page.getByRole('link', { name: 'להגשה ולסטטוס' }).first()).toHaveAttribute(
        'href',
        `/events/${ENV.EVENT_ID}/apply`,
      );
      await expect(page.getByRole('link', { name: 'לפרטי המפגש' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'לאזור האישי' })).toBeVisible();
    } finally {
      await ctx.close();
    }
  });

  test('gathering sends first-time participants back to the canonical apply page', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    try {
      await authenticateAs(ctx, ENV.EMAILS.P1);
      await page.route('**/rest/v1/event_registrations**', async (route) => {
        if (route.request().method() !== 'GET') return route.continue();
        return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      });
      await page.goto(`/gathering/${ENV.EVENT_ID}`);

      const applyLink = page.getByRole('link', { name: 'להגשה ולסטטוס' }).first();
      await expect(applyLink).toBeVisible();
      await expect(applyLink).toHaveAttribute('href', `/events/${ENV.EVENT_ID}/apply`);

      await expect(page.getByRole('textbox', { name: 'שם מלא' })).toHaveCount(0);
      await expect(page.getByRole('textbox', { name: 'טלפון' })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'שליחת בקשה' })).toHaveCount(0);
    } finally {
      await ctx.close();
    }
  });

  test('gathering exposes only contract-approved participant actions after realignment', async ({ browser }) => {
    const admin = createServiceRoleClient();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id')
      .eq('email', ENV.EMAILS.P1)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile?.id) throw new Error('E2E missing P1 profile');

    const futureExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await withFlippedRegistrationStatus(
      admin,
      { userId: profile.id, eventId: ENV.EVENT_ID },
      {
        status: 'awaiting_response',
        expires_at: futureExpires,
        offered_at: new Date().toISOString(),
      },
      async () => {
        const ctx = await browser.newContext();
        try {
          await authenticateAs(ctx, ENV.EMAILS.P1);
          const page = await ctx.newPage();
          await page.goto(`/gathering/${ENV.EVENT_ID}`);

          await expect(page).toHaveURL(new RegExp(`/gathering/${ENV.EVENT_ID}$`));
          await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
          await expect(page.getByRole('button', { name: 'אישור המקום' })).toHaveCount(0);
          await expect(page.getByRole('button', { name: 'לא אוכל להגיע' })).toHaveCount(0);

          const applyAuthorityLink = page.getByRole('link', { name: 'להגשה ולסטטוס' }).first();
          await expect(applyAuthorityLink).toBeVisible();
          await expect(applyAuthorityLink).toHaveAttribute('href', `/events/${ENV.EVENT_ID}/apply`);
        } finally {
          await ctx.close();
        }
      },
    );
  });

  test('gathering signed-in with no registration and closed registration shows closed-state branch', async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    await authenticateAs(ctx, ENV.EMAILS.P1);
    const page = await ctx.newPage();

    try {
      await page.route('**/rest/v1/events**', async (route) => {
        if (route.request().method() !== 'GET') return route.continue();
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: ENV.EVENT_ID,
              title: 'מפגש סגור להרשמה',
              description: 'בדיקה',
              city: 'תל אביב',
              starts_at: '2026-08-01T18:00:00.000Z',
              registration_deadline: '2025-01-20T18:00:00.000Z',
              venue_hint: 'יישלח בהמשך',
              max_capacity: 8,
              status: 'closed',
              is_published: true,
              created_at: '2026-06-01T10:00:00.000Z',
              updated_at: '2026-06-01T10:00:00.000Z',
              created_by_user_id: null,
              host_user_id: null,
              payment_required: false,
              price_cents: 0,
              currency: 'ILS',
            },
          ]),
        });
      });
      await page.route('**/rest/v1/event_registrations**', async (route) => {
        if (route.request().method() !== 'GET') return route.continue();
        return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      });

      await page.goto(`/gathering/${ENV.EVENT_ID}`);

      await expect(page.getByText('אין כרגע הגשה שמחוברת למפגש הזה', { exact: true })).toBeVisible();
      await expect(
        page.getByText('ההגשות למפגש הזה אינן פתוחות כרגע, ולכן אין מה לנהל מכאן בשלב הזה.', { exact: true }),
      ).toBeVisible();
      await expect(page.getByRole('link', { name: 'לפרטי המפגש' }).first()).toHaveAttribute(
        'href',
        `/events/${ENV.EVENT_ID}`,
      );
    } finally {
      await ctx.close();
    }
  });

  test('gathering: waitlist status renders Hebrew label, not raw enum', async ({ browser }) => {
    const admin = createServiceRoleClient();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id')
      .eq('email', ENV.EMAILS.P1)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile?.id) throw new Error('E2E missing P1 profile');

    await withFlippedRegistrationStatus(
      admin,
      { userId: profile.id, eventId: ENV.EVENT_ID },
      { status: 'waitlist' },
      async () => {
        const ctx = await browser.newContext();
        try {
          await authenticateAs(ctx, ENV.EMAILS.P1);
          const page = await ctx.newPage();
          await page.goto(`/gathering/${ENV.EVENT_ID}`);
          await expect(page.getByText(/הסטטוס הנוכחי שלך/)).toBeVisible({ timeout: 15_000 });
          // Scope the assertion to the composed status line — catches both the
          // English-token leak and any mis-mapping that would render a different
          // Hebrew label in that slot.
          await expect(
            page.getByText(/הסטטוס הנוכחי שלך:\s*רשימת המתנה/),
          ).toBeVisible();
          // Defensive: none of the raw English enum tokens appear anywhere in the
          // rendered body (in case the status slot escapes narrowing later).
          await expect(page.locator('body')).not.toHaveText(
            /\b(waitlist|cancelled|no_show|pending|awaiting_response|confirmed|approved|rejected|attended)\b/i,
          );
        } finally {
          try {
            await ctx.close();
          } catch {
            // Ignore browser context close failures during teardown.
          }
        }
      },
    );
  });

  test('auth: OTP failure shows OTP-specific error without misleading banner', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      await page.route('**/auth/v1/otp**', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      });
      await page.route('**/auth/v1/verify**', async (route) => {
        if (route.request().method() !== 'POST') {
          return route.continue();
        }
        return route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'invalid_otp',
            error_description: 'Token has expired or is invalid',
          }),
        });
      });

      await page.goto('/auth');
      await page.getByLabel('אימייל').fill(ENV.EMAILS.P1);
      await page.getByRole('button', { name: 'לשלוח קוד אימות' }).click();
      await expect(page.getByLabel('קוד אימות')).toBeVisible({ timeout: 15_000 });
      await page.getByLabel('קוד אימות').fill('000000');
      await page.getByRole('button', { name: /לאמת קוד/ }).click();
      await expect(page.getByText('לא הצלחנו לשלוח קישור כניסה')).toHaveCount(0);
      await expect(page.getByText(/הקוד שגוי או שפג תוקפו/)).toBeVisible();
    } finally {
      await ctx.close();
    }
  });

  test('landing page primary CTAs link to events and questionnaire', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      await page.goto('/');
      await expect(page.getByRole('link', { name: 'לצפייה במפגשים' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'להתחיל פרופיל' })).toBeVisible();
    } finally {
      await ctx.close();
    }
  });

  test('landing: narrow viewport keeps primary CTAs visible (RTL mobile smoke)', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    try {
      await page.goto('/');
      await expect(page.getByRole('link', { name: 'לצפייה במפגשים' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'להתחיל פרופיל' })).toBeVisible();
    } finally {
      await ctx.close();
    }
  });

  test('landing footer links to terms and privacy stubs', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      await page.goto('/');
      const terms = page.getByRole('link', { name: 'תנאי שימוש' });
      const privacy = page.getByRole('link', { name: 'מדיניות פרטיות' });
      await expect(terms).toHaveAttribute('href', '/terms');
      await expect(privacy).toHaveAttribute('href', '/privacy');

      await terms.click();
      await expect(page.getByRole('heading', { level: 1, name: 'תנאי שימוש' })).toBeVisible();

      await page.goto('/');
      await privacy.click();
      await expect(page.getByRole('heading', { level: 1, name: 'מדיניות פרטיות' })).toBeVisible();
    } finally {
      await ctx.close();
    }
  });

  test('landing: page body contains no English brand token', async ({ browser }) => {
    const ctx = await browser.newContext();
    try {
      const page = await ctx.newPage();
      await page.goto('/');
      const body = await page.locator('body').innerText();
      expect(body).not.toMatch(/\bCircles\b/);
    } finally {
      await ctx.close();
    }
  });

  test('auth: page body contains no English prose word "apply"', async ({ browser }) => {
    const ctx = await browser.newContext();
    try {
      const page = await ctx.newPage();
      await page.goto('/auth');
      await expect(page.locator('body')).not.toContainText(/\bapply\b/);
    } finally {
      await ctx.close();
    }
  });

  test('questionnaire: anonymous visitor sees Hebrew sign-in banner with link to /auth', async ({ page }) => {
    await page.goto('/questionnaire');
    await expect(page.getByRole('heading', { level: 1, name: /שאלון/ })).toBeVisible();
    await expect(page.getByText('רוצים לשמור את התשובות בחשבון?', { exact: true })).toBeVisible();
    await expect(
      page.getByText('אפשר למלא את השאלון גם בלי להתחבר', { exact: false }),
    ).toBeVisible();
    const cta = page.getByRole('link', { name: 'להתחברות' });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/auth');
  });

  test('questionnaire: authenticated user sees Hebrew chip label for interest option', async ({ browser }) => {
    const ctx = await browser.newContext();
    await authenticateAs(ctx, ENV.EMAILS.P1);
    const page = await ctx.newPage();
    try {
      await page.goto('/questionnaire');
      await expect(page.getByRole('heading', { level: 1, name: /שאלון/ })).toBeVisible();

      const fullNameInput = page.getByLabel('שם מלא');
      if ((await fullNameInput.inputValue()) === '') {
        await fullNameInput.fill('Test User');
      }

      const emailInput = page.getByLabel('אימייל');
      if ((await emailInput.inputValue()) === '') {
        await emailInput.fill('questionnaire.e2e@gmail.com');
      }

      const phoneInput = page.getByLabel('טלפון');
      if ((await phoneInput.inputValue()) === '') {
        await phoneInput.fill('0501234567');
      }

      const socialUrlInput = page.getByLabel('קישור לפרופיל חברתי');
      if ((await socialUrlInput.inputValue()) === '') {
        await socialUrlInput.fill('https://instagram.com/testuser');
      }

      const birthDateInput = page.getByLabel('תאריך לידה');
      if ((await birthDateInput.inputValue()) === '') {
        await birthDateInput.fill('1990-01-01');
      }

      await page.getByRole('button', { name: 'המשך' }).click();

      await expect(page.getByText('מוזיקה', { exact: true })).toBeVisible();
      await expect(page.getByText('אומנות', { exact: true })).toBeVisible();
    } finally {
      await ctx.close();
    }
  });

  test('questionnaire: matching_responses load failure keeps form usable with inline warning', async ({ browser }) => {
    const ctx = await browser.newContext();
    await authenticateAs(ctx, ENV.EMAILS.P1);
    const page = await ctx.newPage();
    try {
      await page.route('**/rest/v1/matching_responses**', async (route) => {
        await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
      });

      await page.goto('/questionnaire');

      await expect(
        page.getByText('לא הצלחנו לטעון כרגע את הנתונים השמורים.', { exact: true }),
      ).toBeVisible();
      await expect(page.getByText('שגיאת טעינה', { exact: true })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'המשך' })).toBeVisible();
      await expect(page.getByLabel('שם מלא')).toBeVisible();
    } finally {
      await ctx.close();
    }
  });

  // §13.2 questionnaire workflow verification.
  //
  // API writes are stubbed via page.route so the staging DB isn't mutated.
  // Real persistence is covered by manual QA + the slice-happy-path test.
  //
  // Drives the full 3-step questionnaire form end-to-end and asserts the
  // post-save success state (title + two CTAs linking to /events and
  // /dashboard). The underlying persistProfile() makes two writes: a PATCH
  // to `profiles` and an upsert (POST) to `matching_responses`. Both are
  // intercepted at the Playwright level and fulfilled with 200 so the test
  // exercises the real client + UI flow without mutating staging data.
  //
  // The GET on `matching_responses` is also intercepted (returns `[]`) so
  // the form boots in "new user" shape regardless of which authenticated
  // user we pick — this lets us reuse P1 as the auth identity without
  // depending on her DB state.
  test('questionnaire: UI workflow completes to success state with CTAs (API stubbed)', async ({ browser }) => {
    const ctx = await browser.newContext();
    await authenticateAs(ctx, ENV.EMAILS.P1);
    const page = await ctx.newPage();
    try {
      await page.route('**/rest/v1/matching_responses**', async (route) => {
        const method = route.request().method();
        if (method === 'GET') {
          return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
        }
        if (method === 'POST' || method === 'PATCH') {
          return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
        }
        return route.continue();
      });
      await page.route('**/rest/v1/profiles**', async (route) => {
        if (route.request().method() === 'PATCH') {
          return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
        }
        return route.continue();
      });

      await page.goto('/questionnaire');
      await expect(page.getByRole('heading', { level: 1, name: /שאלון/ })).toBeVisible();

      await page.getByLabel('שם מלא').fill('אורית בדיקה');
      await page.getByLabel('אימייל').fill('questionnaire.e2e@gmail.com');
      await page.getByLabel('טלפון').fill('0501234567');
      await page.getByLabel('קישור לפרופיל חברתי').fill('https://instagram.com/testuser');
      await page.getByLabel('תאריך לידה').fill('1990-01-01');

      await page.getByRole('button', { name: 'המשך' }).click();

      await expect(page.getByText('מוזיקה', { exact: true })).toBeVisible();

      await page.getByLabel('איפה את/ה גר/ה היום?').fill('תל אביב');
      await page.getByLabel('מאיפה את/ה במקור?').fill('חיפה');
      await page.getByRole('button', { name: 'עברית', exact: true }).click();
      await page.getByRole('button', { name: 'מוזיקה', exact: true }).click();
      await page.getByRole('button', { name: 'יוזם/ת', exact: true }).click();
      await page.getByRole('button', { name: 'עם אנשים', exact: true }).click();
      await page.getByRole('button', { name: 'שיחה קלה ונעימה', exact: true }).click();
      await page.getByRole('button', { name: 'אנשים דומים לי', exact: true }).click();
      await page.getByRole('button', { name: 'להכיר אנשים חדשים', exact: true }).click();

      await page.getByRole('button', { name: 'המשך' }).click();

      await page
        .getByLabel('ספר/י לנו בקצרה על עצמך')
        .fill('זה טקסט בדיקה ארוך מספיק כדי לעבור את האימות של החלק הזה בשאלון.');

      await page.getByRole('button', { name: 'שמירת פרופיל' }).click();

      await expect(page.getByText('הפרופיל נשמר. מה הלאה?', { exact: true })).toBeVisible();
      await expect(page.getByRole('link', { name: 'לצפייה במפגשים' })).toHaveAttribute('href', '/events');
      await expect(page.getByRole('link', { name: 'לאזור האישי' })).toHaveAttribute('href', '/dashboard');
    } finally {
      await ctx.close();
    }
  });
});
