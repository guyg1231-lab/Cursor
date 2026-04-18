import { safeSessionStorage } from '@/lib/safeStorage';

export const POST_AUTH_RETURN_TO_STORAGE_KEY = 'social_matching_post_auth_return_to';

const MAX_LEN = 512;

function isAllowedInternalPath(pathOnly: string) {
  if (!pathOnly.startsWith('/') || pathOnly.startsWith('//')) return false;
  const noHash = pathOnly.split('#')[0] ?? '';
  const [pathname] = noHash.split('?');

  if (pathname === '/dashboard') return true;
  if (pathname === '/host/events') return true;

  if (pathname.startsWith('/events/')) {
    const match = pathname.match(/^\/events\/([a-zA-Z0-9_-]+)\/apply$/);
    return !!match;
  }

  if (pathname.startsWith('/gathering/')) {
    const match = pathname.match(/^\/gathering\/([a-zA-Z0-9_-]+)$/);
    return !!match;
  }

  return false;
}

export function parseSafeReturnTo(raw: string | null | undefined): string | null {
  if (!raw) return null;

  let decoded = raw.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    return null;
  }

  if (decoded.length > MAX_LEN) return null;
  if (/[\0\r\n]/.test(decoded)) return null;
  if (!decoded.startsWith('/')) return null;

  const pathOnly = decoded.split('#')[0] ?? '';
  if (!isAllowedInternalPath(pathOnly)) return null;

  return decoded;
}

export function storePostAuthReturnTo(value: string | null) {
  if (!value) {
    safeSessionStorage.removeItem(POST_AUTH_RETURN_TO_STORAGE_KEY);
    return;
  }

  safeSessionStorage.setItem(POST_AUTH_RETURN_TO_STORAGE_KEY, value);
}

export function readPostAuthReturnTo() {
  return parseSafeReturnTo(safeSessionStorage.getItem(POST_AUTH_RETURN_TO_STORAGE_KEY));
}

export function consumePostAuthReturnTo() {
  const value = readPostAuthReturnTo();
  safeSessionStorage.removeItem(POST_AUTH_RETURN_TO_STORAGE_KEY);
  return value;
}

export function buildAuthPath(returnTo: string | null) {
  if (!returnTo) return '/auth';

  const search = new URLSearchParams({ returnTo });
  return `/auth?${search.toString()}`;
}

export function buildAuthCallbackPath(returnTo: string | null) {
  const search = new URLSearchParams();
  if (returnTo) {
    search.set('returnTo', returnTo);
  }

  return search.size > 0 ? `/auth/callback?${search.toString()}` : '/auth/callback';
}
