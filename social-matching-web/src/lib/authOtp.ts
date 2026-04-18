import { supabase } from '@/integrations/supabase/client';
import { safeLocalStorage, safeSessionStorage } from '@/lib/safeStorage';
import { validateEmailAddress } from '@/lib/validation';

export const OTP_MIN_COOLDOWN_SECONDS = 60;
export const OTP_QUOTA_COOLDOWN_SECONDS = 300;

const OTP_COOLDOWN_KEY_PREFIX = 'social_matching_auth_otp_cooldown_v1:';
const OTP_MAX_COOLDOWN_SECONDS = 3600;

export type AuthOtpCode =
  | 'ok'
  | 'rate_limit'
  | 'rate_limit_unknown'
  | 'rate_limit_quota'
  | 'invalid_email'
  | 'network'
  | 'auth_error';

export interface RequestOtpEmailResult {
  ok: boolean;
  code: AuthOtpCode;
  retryAfterSeconds?: number;
  message: string;
}

function clampCooldown(seconds: number): number {
  if (!Number.isFinite(seconds)) return OTP_MIN_COOLDOWN_SECONDS;
  const normalized = Math.max(Math.ceil(seconds), OTP_MIN_COOLDOWN_SECONDS);
  return Math.min(normalized, OTP_MAX_COOLDOWN_SECONDS);
}

function cooldownKey(normalizedEmail: string): string {
  return `${OTP_COOLDOWN_KEY_PREFIX}${normalizedEmail}`;
}

function readExpiry(normalizedEmail: string): number {
  const localExpiry = Number(safeLocalStorage.getItem(cooldownKey(normalizedEmail)) ?? '0');
  const sessionExpiry = Number(safeSessionStorage.getItem(cooldownKey(normalizedEmail)) ?? '0');

  return Math.max(
    Number.isFinite(localExpiry) ? localExpiry : 0,
    Number.isFinite(sessionExpiry) ? sessionExpiry : 0,
  );
}

function writeExpiry(normalizedEmail: string, expiryMs: number) {
  const key = cooldownKey(normalizedEmail);

  if (expiryMs <= 0) {
    safeLocalStorage.removeItem(key);
    safeSessionStorage.removeItem(key);
    return;
  }

  const value = String(expiryMs);
  safeLocalStorage.setItem(key, value);
  safeSessionStorage.setItem(key, value);
}

function getActiveCooldownSecondsByEmail(normalizedEmail: string): number {
  if (!normalizedEmail) return 0;

  const now = Date.now();
  const expiryMs = readExpiry(normalizedEmail);
  if (!expiryMs || expiryMs <= now) {
    writeExpiry(normalizedEmail, 0);
    return 0;
  }

  return Math.ceil((expiryMs - now) / 1000);
}

function setCooldownForEmail(normalizedEmail: string, seconds: number): number {
  const cooldownSeconds = clampCooldown(seconds);
  writeExpiry(normalizedEmail, Date.now() + cooldownSeconds * 1000);
  return cooldownSeconds;
}

function extractRetryAfterSeconds(message: string): number | null {
  const secondsMatch = message.match(/(\d+)\s*(?:seconds?|secs?|sec|שניות|שניה)/i);
  if (secondsMatch) return Number(secondsMatch[1]);

  const minutesMatch = message.match(/(\d+)\s*(?:minutes?|mins?|דקות|דקה)/i);
  if (minutesMatch) return Number(minutesMatch[1]) * 60;

  return null;
}

function extractAuthErrorMessage(error: unknown): string {
  if (error instanceof Error && typeof error.message === 'string' && error.message.trim() !== '') {
    return error.message;
  }

  if (typeof error === 'string' && error.trim() !== '') {
    return error;
  }

  if (typeof error === 'object' && error !== null) {
    const record = error as Record<string, unknown>;
    if (typeof record.message === 'string' && record.message.trim() !== '') {
      return record.message;
    }
    if (typeof record.error_description === 'string' && record.error_description.trim() !== '') {
      return record.error_description;
    }
  }

  return 'Authentication error';
}

function classifyOtpError(error: unknown, fallbackCooldownSeconds: number): RequestOtpEmailResult {
  const message = extractAuthErrorMessage(error);
  const normalizedMessage = message.toLowerCase();
  const inferredRetryAfter = extractRetryAfterSeconds(message);

  const isRateLimitError =
    normalizedMessage.includes('rate limit')
    || normalizedMessage.includes('too many')
    || normalizedMessage.includes('429')
    || normalizedMessage.includes('over_email_send_rate_limit')
    || normalizedMessage.includes('email rate limit exceeded');

  if (isRateLimitError) {
    const isQuotaRateLimit =
      inferredRetryAfter === null
      && (
        normalizedMessage.includes('over_email_send_rate_limit')
        || normalizedMessage.includes('email rate limit exceeded')
      );

    if (isQuotaRateLimit) {
      return {
        ok: false,
        code: 'rate_limit_quota',
        retryAfterSeconds: clampCooldown(Math.max(fallbackCooldownSeconds, OTP_QUOTA_COOLDOWN_SECONDS)),
        message,
      };
    }

    if (inferredRetryAfter === null) {
      return {
        ok: false,
        code: 'rate_limit_unknown',
        message,
      };
    }

    return {
      ok: false,
      code: 'rate_limit',
      retryAfterSeconds: clampCooldown(inferredRetryAfter),
      message,
    };
  }

  if (
    normalizedMessage.includes('invalid email')
    || normalizedMessage.includes('email address is invalid')
    || normalizedMessage.includes('unable to validate email address')
  ) {
    return {
      ok: false,
      code: 'invalid_email',
      message,
    };
  }

  if (
    normalizedMessage.includes('failed to fetch')
    || normalizedMessage.includes('network')
    || normalizedMessage.includes('timeout')
  ) {
    return {
      ok: false,
      code: 'network',
      message,
    };
  }

  return {
    ok: false,
    code: 'auth_error',
    message,
  };
}

export function getOtpCooldownSeconds(email: string): number {
  const emailValidation = validateEmailAddress(email);
  const normalizedEmail = emailValidation.isValid ? emailValidation.normalized : email.trim().toLowerCase();
  return getActiveCooldownSecondsByEmail(normalizedEmail);
}

export async function requestOtpEmail(params: {
  email: string;
  emailRedirectTo: string;
  shouldCreateUser?: boolean;
  minCooldownSeconds?: number;
}): Promise<RequestOtpEmailResult> {
  const emailValidation = validateEmailAddress(params.email);
  if (!emailValidation.isValid) {
    return {
      ok: false,
      code: 'invalid_email',
      message: 'Invalid email address',
    };
  }

  const normalizedEmail = emailValidation.normalized;
  const cooldownFloor = clampCooldown(params.minCooldownSeconds ?? OTP_MIN_COOLDOWN_SECONDS);
  const activeCooldownSeconds = getActiveCooldownSecondsByEmail(normalizedEmail);

  if (activeCooldownSeconds > 0) {
    return {
      ok: false,
      code: 'rate_limit',
      retryAfterSeconds: activeCooldownSeconds,
      message: 'Email rate limit exceeded',
    };
  }

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: params.emailRedirectTo,
        shouldCreateUser: params.shouldCreateUser,
      },
    });

    if (error) {
      const classified = classifyOtpError(error, cooldownFloor);
      if (
        (classified.code === 'rate_limit' || classified.code === 'rate_limit_quota')
        && classified.retryAfterSeconds != null
      ) {
        setCooldownForEmail(normalizedEmail, classified.retryAfterSeconds);
      }
      return classified;
    }

    const retryAfterSeconds = setCooldownForEmail(normalizedEmail, cooldownFloor);

    return {
      ok: true,
      code: 'ok',
      retryAfterSeconds,
      message: 'OTP sent',
    };
  } catch (error) {
    const classified = classifyOtpError(error, cooldownFloor);
    if (
      (classified.code === 'rate_limit' || classified.code === 'rate_limit_quota')
      && classified.retryAfterSeconds != null
    ) {
      setCooldownForEmail(normalizedEmail, classified.retryAfterSeconds);
    }
    return classified;
  }
}
