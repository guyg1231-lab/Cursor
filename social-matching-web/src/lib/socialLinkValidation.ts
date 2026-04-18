import { z } from 'zod';

export type SocialPlatform = 'instagram' | 'facebook' | 'linkedin';
export const SOCIAL_LINK_MAX_LENGTH = 500;

const ALLOWED_HOSTS: Record<SocialPlatform, string[]> = {
  instagram: ['instagram.com', 'instagr.am'],
  facebook: ['facebook.com', 'fb.com', 'fb.me'],
  linkedin: ['linkedin.com', 'lnkd.in'],
};

function isValidHttpUrl(value: string, requirePath: boolean): boolean {
  if (!value) return false;
  if (value.length > SOCIAL_LINK_MAX_LENGTH) return false;
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    if (!parsed.hostname) return false;
    if (requirePath) {
      const pathname = parsed.pathname || '';
      if (!pathname || pathname === '/' || pathname.length <= 1) return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Generic social URL validation (used by event field schema).
 * Accepts any http(s) URL with a host.
 */
export function isValidGenericSocialUrl(url: string): boolean {
  return isValidHttpUrl(url, false);
}

/**
 * Strict social URL validation for "Other" free-text flow in Identity step.
 * Requires a non-root path to prevent host-only placeholders.
 */
export function isValidProfileSocialUrl(url: string): boolean {
  return isValidHttpUrl(url, true);
}

const socialLinkSchema = z
  .string()
  .max(SOCIAL_LINK_MAX_LENGTH, 'Social link must be 500 characters or less')
  .refine(
    (val) => {
      try {
        const url = new URL(val);
        if (!['http:', 'https:'].includes(url.protocol)) {
          return false;
        }
        const host = normalizeHost(url.hostname);
        if (!host) return false;
        const pathname = url.pathname || '';
        if (!pathname || pathname === '/' || pathname.length <= 1) return false;

        return Object.values(ALLOWED_HOSTS).some((hosts) => hosts.includes(host));
      } catch {
        return false;
      }
    },
    'Social link must be a valid URL for Instagram, Facebook or LinkedIn'
  );

function normalizeHost(hostname: string): string {
  const lower = hostname.toLowerCase().trim();
  if (!lower) return '';
  return lower.startsWith('www.') ? lower.slice(4) : lower;
}

export function isValidSocialLink(url: string): boolean {
  const result = socialLinkSchema.safeParse(url);
  return result.success;
}

export function getSocialPlatformLabel(url: string): 'Instagram' | 'Facebook' | 'LinkedIn' | null {
  if (!url) return null;
  let host: string;
  try {
    const parsed = new URL(url);
    host = normalizeHost(parsed.hostname);
  } catch {
    const guessedHost = url.split('/')[2] || '';
    host = normalizeHost(guessedHost);
  }

  if (!host) return null;

  if (ALLOWED_HOSTS.instagram.includes(host)) return 'Instagram';
  if (ALLOWED_HOSTS.facebook.includes(host)) return 'Facebook';
  if (ALLOWED_HOSTS.linkedin.includes(host)) return 'LinkedIn';

  return null;
}

export function buildSocialLink(platform: SocialPlatform, suffix: string): string {
  const trimmedSuffix = suffix.trim().replace(/^\/+/, '');

  switch (platform) {
    case 'instagram': {
      return `https://instagram.com/${trimmedSuffix}`;
    }
    case 'facebook': {
      return `https://facebook.com/${trimmedSuffix}`;
    }
    case 'linkedin': {
      const withoutPrefix = trimmedSuffix.replace(/^in\//i, '');
      return `https://linkedin.com/in/${withoutPrefix}`;
    }
    default: {
      // This should be unreachable because platform is a union type
      return trimmedSuffix;
    }
  }
}

export function extractSuffixFromUrl(url: string, platform: SocialPlatform): string {
  try {
    const parsed = new URL(url);
    let path = parsed.pathname.replace(/^\/+/, '');
    if (platform === 'linkedin') {
      path = path.replace(/^in\//i, '');
    }
    try {
      return decodeURIComponent(path);
    } catch {
      return path;
    }
  } catch {
    return '';
  }
}

