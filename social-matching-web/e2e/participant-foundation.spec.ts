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

  // The alternation covers every blocked-reason copy the fixture user
  // might legitimately hit (profile incomplete, saved seat, ended event,
  // etc.). This test asserts the page surfaces *one* of them, not any
  // specific one. Splitting into per-reason tests requires per-reason
  // fixture setup — tracked as a followup.
  test('authenticated participant sees at least one blocking readiness message on /apply', async ({ browser }) => {
    const ctx = await browser.newContext();
    try {
      await authenticateAs(ctx, ENV.EMAILS.P1);
      const page = await ctx.newPage();

      await page.goto(`/events/${ENV.EVENT_ID}/apply`);
      await expect(
        page.getByRole('heading', { level: 1, name: /הגשה למפגש|סטטוס ההרשמה/i }),
      ).toBeVisible();
      await expect(
        page.getByText(/צריך להשלים את הפרופיל|צריך להשלים את השאלון|המקום שלך במפגש נשמר|המפגש כבר הסתיים|כבר קיימת הגשה/i),
      ).toBeVisible();
    } finally {
      await ctx.close();
    }
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
          const badge = page.locator('span.rounded-full', { hasText: 'לא נבחר/ת הפעם' });
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
      const appsCard = page.getByRole('heading', { level: 3, name: 'ההגשות שלך' }).locator('..').locator('..');
      await expect(appsCard.locator(`a[href="/events/${ENV.EVENT_ID}"]`).first()).toBeVisible();
    } finally {
      await ctx.close();
    }
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
