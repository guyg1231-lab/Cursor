import { expect, test } from '@playwright/test';

test.describe('scroll navigation regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const originalScrollTo = window.scrollTo.bind(window);
      const calls: Array<{ top: number | null; left: number | null }> = [];
      (window as Window & { __e2eScrollToCalls?: typeof calls }).__e2eScrollToCalls = calls;

      window.scrollTo = (optionsOrX?: ScrollToOptions | number, y?: number) => {
        if (typeof optionsOrX === 'number') {
          calls.push({ top: typeof y === 'number' ? y : null, left: optionsOrX });
        } else {
          calls.push({
            top: typeof optionsOrX?.top === 'number' ? optionsOrX.top : null,
            left: typeof optionsOrX?.left === 'number' ? optionsOrX.left : null,
          });
        }
        return originalScrollTo(optionsOrX as ScrollToOptions, y);
      };
    });
  });

  test('pathname navigation resets scroll to top on mobile bottom nav transitions', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/events');
    await page.evaluate(() => {
      const store = window as Window & { __e2eScrollToCalls?: Array<{ top: number | null; left: number | null }> };
      if (!store.__e2eScrollToCalls) throw new Error('Expected scrollTo instrumentation to be ready');
      store.__e2eScrollToCalls.length = 0;
    });

    await page.locator('div.fixed.inset-x-3.bottom-3 a[href="/questionnaire"]').click();
    await expect(page).toHaveURL(/\/questionnaire$/);

    const callsAfterPathnameNavigation = await page.evaluate(() => {
      const store = window as Window & { __e2eScrollToCalls?: Array<{ top: number | null; left: number | null }> };
      return store.__e2eScrollToCalls ?? [];
    });

    expect(callsAfterPathnameNavigation.length).toBeGreaterThan(0);
    const lastCall = callsAfterPathnameNavigation.at(-1);
    expect(lastCall?.top).toBe(0);
  });

  test('hash anchor updates are preserved and do not get reset to absolute top', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/events');
    await page.waitForSelector('#main-content');

    await page.evaluate(() => {
      const store = window as Window & { __e2eScrollToCalls?: Array<{ top: number | null; left: number | null }> };
      if (!store.__e2eScrollToCalls) throw new Error('Expected scrollTo instrumentation to be ready');
      store.__e2eScrollToCalls.length = 0;
      window.location.hash = 'main-content';
    });

    await expect.poll(async () => page.evaluate(() => window.location.hash)).toBe('#main-content');
    const callsAfterHashAnchorNavigation = await page.evaluate(() => {
      const store = window as Window & { __e2eScrollToCalls?: Array<{ top: number | null; left: number | null }> };
      return store.__e2eScrollToCalls ?? [];
    });
    expect(callsAfterHashAnchorNavigation.length).toBe(0);
  });
});
