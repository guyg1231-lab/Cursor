import { test, expect } from '@playwright/test';
import { authenticateAs } from './fixtures/auth';
import { ENV } from './fixtures/env';
import { createServiceRoleClient } from './fixtures/supabase';
import { withFlippedRegistrationStatus } from './fixtures/registrations';

test.describe('participant foundation', () => {
  test('discovery links into canonical event detail before apply', async ({ page }) => {
    await page.goto('/events');
    await page.locator(`a[href="/events/${ENV.EVENT_ID}"]`).first().click();
    await expect(page).toHaveURL(new RegExp(`/events/${ENV.EVENT_ID}`));
    await expect(
      page.getByRole('link', {
        name: /להגיש מועמדות|להגיש שוב|לסטטוס ההרשמה|למקום הזמני ולתגובה|לצפייה בסטטוס ההרשמה|חזרה למפגשים/i,
      }).first(),
    ).toBeVisible();
  });

  test('authenticated participant sees a readiness message before applying when blocked', async ({ browser }) => {
    const ctx = await browser.newContext();
    await authenticateAs(ctx, ENV.EMAILS.P1);
    const page = await ctx.newPage();

    await page.goto(`/events/${ENV.EVENT_ID}/apply`);
    await expect(
      page.getByRole('heading', { level: 1, name: /הגשה למפגש|סטטוס ההרשמה/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/צריך להשלים את הפרופיל|צריך להשלים את השאלון|המקום שלך במפגש נשמר|המפגש כבר הסתיים|כבר קיימת הגשה/i),
    ).toBeVisible();

    await ctx.close();
  });

  test('dashboard exposes participant next steps with a questionnaire handoff', async ({ browser }) => {
    const ctx = await browser.newContext();
    await authenticateAs(ctx, ENV.EMAILS.P1);
    const page = await ctx.newPage();

    await page.goto('/dashboard');
    await expect(page.getByRole('link', { name: 'לשאלון הפרופיל' })).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 3, name: /לפני ההגשה הבאה/i }),
    ).toBeVisible();

    await ctx.close();
  });

  test('dashboard shows profile readiness as ready', async ({ browser }) => {
    const ctx = await browser.newContext();
    await authenticateAs(ctx, ENV.EMAILS.P1);
    const page = await ctx.newPage();

    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { level: 1, name: 'האזור האישי שלך' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'מוכנות להגשה' })).toBeVisible();
    await expect(page.getByText('מוכנים להגיש למפגשים', { exact: true })).toBeVisible();
    await expect(page.getByText('מוכן להגשה', { exact: true })).toBeVisible();

    await ctx.close();
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
          await expect(page.getByText('לא נבחר/ת הפעם', { exact: true })).toBeVisible();
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

    const { data: registration, error: regReadError } = await admin
      .from('event_registrations')
      .select('status')
      .eq('event_id', ENV.EVENT_ID)
      .eq('user_id', profile.id)
      .maybeSingle();
    if (regReadError) throw regReadError;
    if (!registration) throw new Error('E2E missing P1 registration for E2E_EVENT_ID');

    const previousStatus = registration.status;
    const { error: flipError } = await admin
      .from('event_registrations')
      .update({ status: 'cancelled' })
      .eq('event_id', ENV.EVENT_ID)
      .eq('user_id', profile.id);
    if (flipError) throw flipError;

    const ctx = await browser.newContext();
    try {
      await authenticateAs(ctx, ENV.EMAILS.P1);
      const page = await ctx.newPage();
      await page.goto(`/events/${ENV.EVENT_ID}/apply`);
      await expect(page.getByRole('heading', { name: 'פרטים על ההגשה' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'ההגשה הקודמת שלך' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'שליחת הגשה' })).toBeVisible();
    } finally {
      try {
        await ctx.close();
      } catch {
        // Ignore browser context close failures during teardown.
      }
      try {
        const { error: restoreError } = await admin
          .from('event_registrations')
          .update({ status: previousStatus })
          .eq('event_id', ENV.EVENT_ID)
          .eq('user_id', profile.id);
        if (restoreError) throw restoreError;
      } catch (restoreError) {
        // eslint-disable-next-line no-console
        console.error('Failed to restore P1 application status after reapply-eligibility test', restoreError);
        throw restoreError;
      }
    }
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

    const { data: registration, error: regReadError } = await admin
      .from('event_registrations')
      .select('status, expires_at, offered_at')
      .eq('event_id', ENV.EVENT_ID)
      .eq('user_id', profile.id)
      .maybeSingle();
    if (regReadError) throw regReadError;
    if (!registration) throw new Error('E2E missing P1 registration for E2E_EVENT_ID');

    const previousStatus = registration.status;
    const previousExpiresAt = registration.expires_at;
    const previousOfferedAt = registration.offered_at;

    const futureExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { error: flipError } = await admin
      .from('event_registrations')
      .update({
        status: 'awaiting_response',
        expires_at: futureExpires,
        offered_at: previousOfferedAt ?? new Date().toISOString(),
      })
      .eq('event_id', ENV.EVENT_ID)
      .eq('user_id', profile.id);
    if (flipError) throw flipError;

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
      try {
        const { error: restoreError } = await admin
          .from('event_registrations')
          .update({
            status: previousStatus,
            expires_at: previousExpiresAt,
            offered_at: previousOfferedAt,
          })
          .eq('event_id', ENV.EVENT_ID)
          .eq('user_id', profile.id);
        if (restoreError) throw restoreError;
      } catch (restoreError) {
        // eslint-disable-next-line no-console
        console.error('Failed to restore P1 application', restoreError);
        throw restoreError;
      }
    }
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

    const { data: registration, error: regReadError } = await admin
      .from('event_registrations')
      .select('status, expires_at, offered_at')
      .eq('event_id', ENV.EVENT_ID)
      .eq('user_id', profile.id)
      .maybeSingle();
    if (regReadError) throw regReadError;
    if (!registration) throw new Error('E2E missing P1 registration for E2E_EVENT_ID');

    const previousStatus = registration.status;
    const previousExpiresAt = registration.expires_at;
    const previousOfferedAt = registration.offered_at;

    const futureExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { error: flipError } = await admin
      .from('event_registrations')
      .update({
        status: 'awaiting_response',
        expires_at: futureExpires,
        offered_at: previousOfferedAt ?? new Date().toISOString(),
      })
      .eq('event_id', ENV.EVENT_ID)
      .eq('user_id', profile.id);
    if (flipError) throw flipError;

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
      try {
        const { error: restoreError } = await admin
          .from('event_registrations')
          .update({
            status: previousStatus,
            expires_at: previousExpiresAt,
            offered_at: previousOfferedAt,
          })
          .eq('event_id', ENV.EVENT_ID)
          .eq('user_id', profile.id);
        if (restoreError) throw restoreError;
      } catch (restoreError) {
        // eslint-disable-next-line no-console
        console.error('Failed to restore P1 application after event detail awaiting test', restoreError);
        throw restoreError;
      }
    }
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

    const { data: registration, error: regReadError } = await admin
      .from('event_registrations')
      .select('status')
      .eq('event_id', ENV.EVENT_ID)
      .eq('user_id', profile.id)
      .maybeSingle();
    if (regReadError) throw regReadError;
    if (!registration) throw new Error('E2E missing P1 registration for E2E_EVENT_ID');

    const previousStatus = registration.status;
    const { error: confirmError } = await admin
      .from('event_registrations')
      .update({ status: 'confirmed' })
      .eq('event_id', ENV.EVENT_ID)
      .eq('user_id', profile.id);
    if (confirmError) throw confirmError;

    const ctx = await browser.newContext();
    try {
      await authenticateAs(ctx, ENV.EMAILS.P1);
      const page = await ctx.newPage();

      await page.goto('/dashboard');
      const appsCard = page.getByRole('heading', { level: 3, name: 'ההגשות שלך' }).locator('..').locator('..');
      await expect(appsCard.getByText('המקום שלך שמור', { exact: true })).toBeVisible();
    } finally {
      try {
        await ctx.close();
      } catch {
        // Ignore browser context close failures during teardown.
      }
      try {
        const { error: restoreError } = await admin
          .from('event_registrations')
          .update({ status: previousStatus })
          .eq('event_id', ENV.EVENT_ID)
          .eq('user_id', profile.id);
        if (restoreError) throw restoreError;
      } catch (restoreError) {
        // eslint-disable-next-line no-console
        console.error('Failed to restore P1 application status', restoreError);
        throw restoreError;
      }
    }
  });

  test('unauthenticated apply preserves returnTo through sign-in', async ({ page }) => {
    await page.goto(`/events/${ENV.EVENT_ID}/apply`);
    await expect(page).toHaveURL(/\/(sign-in|auth)(\?|$)/);
    await expect(page).toHaveURL(new RegExp(`returnTo=.*events.*${ENV.EVENT_ID}.*apply`));
    await expect(page.getByText(/כניסה|אימות/i).first()).toBeVisible();
  });

  test('auth callback keeps a visible loading state before redirect completes', async ({ page }) => {
    const sawLoading = page.waitForFunction(
      () => /מאמתים/.test(document.body.innerText),
      { timeout: 15_000 },
    );
    await Promise.all([page.goto('/auth/callback'), sawLoading]);
  });

  test('dashboard shows empty applications state with CTA to events', async ({ browser }) => {
    const ctx = await browser.newContext();
    // Staging: P1–P4 each have ≥1 registration; ADMIN1 has zero event_registrations (see plan Task 3).
    await authenticateAs(ctx, ENV.EMAILS.ADMIN1);
    const page = await ctx.newPage();

    await page.goto('/dashboard');
    await expect(page.getByText('אין עדיין הגשות', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'למפגשים פתוחים' })).toBeVisible();

    await ctx.close();
  });

  test('regression: dashboard readiness and applications render together', async ({ browser }) => {
    const ctx = await browser.newContext();
    await authenticateAs(ctx, ENV.EMAILS.P1);
    const page = await ctx.newPage();

    await page.goto('/dashboard');

    await expect(page.getByRole('heading', { level: 1, name: 'האזור האישי שלך' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'מוכנות להגשה' })).toBeVisible();
    await expect(page.getByText('מוכן להגשה', { exact: true })).toBeVisible();

    await expect(page.getByRole('heading', { level: 3, name: 'ההגשות שלך' })).toBeVisible();
    const appsCard = page.getByRole('heading', { level: 3, name: 'ההגשות שלך' }).locator('..').locator('..');
    await expect(appsCard.locator(`a[href="/events/${ENV.EVENT_ID}"]`).first()).toBeVisible();

    await ctx.close();
  });

  test('gathering page frames itself as a participant gathering view and links to event details', async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    await authenticateAs(ctx, ENV.EMAILS.P1);
    const page = await ctx.newPage();
    try {
      await page.goto(`/gathering/${ENV.EVENT_ID}`);
      await expect(page.getByText(/תצוגת המפגש|טופס הגשה מהיר/)).toBeVisible();
      await expect(page.getByRole('link', { name: 'לפרטי המפגש' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'לאזור האישי' })).toBeVisible();
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

      const fullNameInput = page.locator('input[type="text"]').first();
      if ((await fullNameInput.inputValue()) === '') {
        await fullNameInput.fill('Test User');
      }

      const emailInput = page.locator('input[type="email"]').first();
      if ((await emailInput.inputValue()) === '') {
        await emailInput.fill('questionnaire.e2e@gmail.com');
      }

      const phoneInput = page.locator('input[type="tel"]').first();
      if ((await phoneInput.inputValue()) === '') {
        await phoneInput.fill('0501234567');
      }

      const socialUrlInput = page.locator('input[type="url"]').first();
      if ((await socialUrlInput.inputValue()) === '') {
        await socialUrlInput.fill('https://instagram.com/testuser');
      }

      const birthDateInput = page.locator('input[type="date"]').first();
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

  test('questionnaire: matching_responses load failure shows RouteErrorState and keeps form', async ({ browser }) => {
    const ctx = await browser.newContext();
    await authenticateAs(ctx, ENV.EMAILS.P1);
    const page = await ctx.newPage();
    try {
      await page.route('**/rest/v1/matching_responses**', async (route) => {
        await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
      });

      await page.goto('/questionnaire');

      await expect(page.getByText('שגיאת טעינה', { exact: true })).toBeVisible();
      await expect(
        page.getByText('לא הצלחנו לטעון את הנתונים השמורים. אפשר לרענן ולנסות שוב.', { exact: true }),
      ).toBeVisible();
      await expect(page.getByRole('button', { name: 'המשך' })).toBeVisible();
    } finally {
      await ctx.close();
    }
  });

  test('questionnaire: success state shows CTAs to gatherings and dashboard after save', async ({ browser }) => {
    test.skip(
      true,
      'Requires a staging fixture user whose matching_responses can be mutated and restored. Plan #5/#6 will introduce a dedicated questionnaire-save fixture helper; until then, rely on typecheck + manual verification (persistProfile succeeds → questionnaireSuccessTitle appears with two CTAs).',
    );

    const ctx = await browser.newContext();
    await authenticateAs(ctx, ENV.EMAILS.P1);
    const page = await ctx.newPage();
    try {
      await page.goto('/questionnaire');
      // Future: drive the form through all 3 steps, click submit, then:
      await expect(page.getByText('הפרופיל נשמר. מה הלאה?', { exact: true })).toBeVisible();
      await expect(page.getByRole('link', { name: 'לצפייה במפגשים' })).toHaveAttribute('href', '/events');
      await expect(page.getByRole('link', { name: 'לאזור האישי' })).toHaveAttribute('href', '/dashboard');
    } finally {
      await ctx.close();
    }
  });
});

// §13.2 new-user workflow scaffold. `test.describe.skip` — not `serial` — because
// Playwright runs `beforeAll`/`afterAll` even when an inner `test.skip(true, ...)`
// short-circuits the test body. Deleting P2's matching_responses on every full
// Playwright run and relying on `afterAll` restore would strand staging data if
// the restore ever failed. `describe.skip` skips hooks too, keeping this scaffold
// inert until a disposable fixture user exists (Plan #5/#6). To enable later:
//   1. Seed a dedicated disposable participant user (own email) with no matching_responses.
//   2. Replace `test.describe.skip` with `test.describe.serial`.
//   3. Remove the inner `test.skip(true, ...)` guard.
//   4. Swap `ENV.EMAILS.P2` for the disposable user's env var.
test.describe.skip('questionnaire workflow §13.2 (optional)', () => {
  const admin = createServiceRoleClient();
  let userId: string;
  let hadRow: boolean;
  let snapshot: Record<string, unknown> | null;

  test.beforeAll(async () => {
    const { data: profile, error } = await admin
      .from('profiles')
      .select('id')
      .eq('email', ENV.EMAILS.P2)
      .maybeSingle();
    if (error) throw error;
    if (!profile?.id) throw new Error('Missing profile for ENV.EMAILS.P2');
    userId = profile.id;

    const { data: row } = await admin
      .from('matching_responses')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    hadRow = Boolean(row);
    snapshot = row ? { ...row } : null;

    const { error: delError } = await admin.from('matching_responses').delete().eq('user_id', userId);
    if (delError) throw delError;
  });

  test.afterAll(async () => {
    if (!hadRow) return;
    if (!snapshot) return;
    const { error } = await admin.from('matching_responses').upsert(snapshot, { onConflict: 'user_id' });
    if (error) throw error;
  });

  test('new user completes questionnaire and can proceed toward apply', async ({ browser }) => {
    const ctx = await browser.newContext();
    await authenticateAs(ctx, ENV.EMAILS.P2);
    const page = await ctx.newPage();
    try {
      await page.goto('/questionnaire');
      // TODO: drive the form through all 3 steps, submit, then assert
      // readiness flips and apply unblocks per spec §13.2.
      await expect(page.getByRole('heading', { level: 1, name: /שאלון/ })).toBeVisible();
    } finally {
      await ctx.close();
    }
  });
});
