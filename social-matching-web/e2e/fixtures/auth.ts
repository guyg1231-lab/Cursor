import type { BrowserContext } from '@playwright/test';
import { createAnonClient } from './supabase';
import { ENV, STORAGE_KEY } from './env';

type InjectedSession = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_at: number;
  expires_in: number;
  user: unknown;
};

const sessionCache = new Map<string, InjectedSession>();

/**
 * Sign in via Supabase anon client using the shared staging password and
 * inject the resulting session into the browser context so the app boots
 * authenticated without touching the OTP flow.
 *
 * Must be called before any page is created on the context; the session is
 * written via `addInitScript` so it's present when the first page loads.
 */
export async function authenticateAs(context: BrowserContext, email: string): Promise<void> {
  const session = await getOrCreateSession(email);
  const storagePayload = JSON.stringify(session);

  await context.clearCookies();
  await context.addInitScript(
    ({ key, value }: { key: string; value: string }) => {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // safeLocalStorage in the app tolerates missing storage; nothing to do here.
      }
    },
    { key: STORAGE_KEY, value: storagePayload },
  );
}

async function getOrCreateSession(email: string): Promise<InjectedSession> {
  const cached = sessionCache.get(email);
  if (cached && cached.expires_at * 1000 > Date.now() + 60_000) {
    return cached;
  }

  const anon = createAnonClient();
  const { data, error } = await anon.auth.signInWithPassword({
    email,
    password: ENV.SHARED_PASSWORD,
  });
  if (error || !data.session) {
    throw new Error(`signInWithPassword failed for ${email}: ${error?.message ?? 'no session'}`);
  }

  const s = data.session;
  const injected: InjectedSession = {
    access_token: s.access_token,
    refresh_token: s.refresh_token,
    token_type: s.token_type,
    expires_at: s.expires_at ?? Math.floor(Date.now() / 1000) + (s.expires_in ?? 3600),
    expires_in: s.expires_in ?? 3600,
    user: s.user,
  };
  sessionCache.set(email, injected);
  return injected;
}
