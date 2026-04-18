import { z } from 'zod';
import { isValidGenericSocialUrl, SOCIAL_LINK_MAX_LENGTH } from '@/lib/socialLinkValidation';

// ============================================
// EMAIL VALIDATION - SINGLE SOURCE OF TRUTH
// ============================================
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const BLOCKED_EMAIL_DOMAINS = new Set([
  'example.com',
  'example.org',
  'example.net',
  'localhost',
  'localhost.localdomain',
  'invalid',
  'test',
]);

export type EmailValidationCode = 'required' | 'invalid_format' | 'blocked_domain';

export interface EmailValidationResult {
  isValid: boolean;
  normalized: string;
  code: EmailValidationCode | null;
  domain: string | null;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isBlockedEmailDomain(domain: string): boolean {
  const normalizedDomain = domain.trim().toLowerCase();
  if (!normalizedDomain) return true;
  if (BLOCKED_EMAIL_DOMAINS.has(normalizedDomain)) return true;

  // RFC 2606 + RFC 6761 reserved zones / pseudo-TLDs
  return (
    normalizedDomain.endsWith('.example') ||
    normalizedDomain.endsWith('.invalid') ||
    normalizedDomain.endsWith('.localhost') ||
    normalizedDomain.endsWith('.test') ||
    normalizedDomain.endsWith('.local')
  );
}

export function validateEmailAddress(email: string): EmailValidationResult {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return { isValid: false, normalized, code: 'required', domain: null };
  }

  if (!EMAIL_REGEX.test(normalized)) {
    return { isValid: false, normalized, code: 'invalid_format', domain: null };
  }

  const domain = normalized.split('@')[1] ?? '';
  if (isBlockedEmailDomain(domain)) {
    return { isValid: false, normalized, code: 'blocked_domain', domain };
  }

  return { isValid: true, normalized, code: null, domain };
}

export function isValidEmailAddress(email: string): boolean {
  return validateEmailAddress(email).isValid;
}

// ============================================
// PHONE VALIDATION - MOBILE ONLY (for SMS verification)
// ============================================
// This is the SINGLE SOURCE OF TRUTH for phone validation
// Must match DB constraints in: supabase/migrations/20260207120000_update_phone_validation_international.sql

export function normalizePhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';

  // If starts with 972 and looks like Israeli mobile, convert to 05XXXXXXXX
  if (/^9725\d{8}$/.test(digits)) {
    return `0${digits.slice(3)}`;
  }

  // If already local Israeli mobile 05XXXXXXXX
  if (/^05\d{8}$/.test(digits)) {
    return digits;
  }

  // Fallback: return digits as-is (non-Israeli or unexpected formats)
  return digits;
}

/**
 * Safe normalizer for values that may be null, undefined, or non-string.
 * Use in admin/UI when data comes from API or DB and type is uncertain.
 * Never throws: objects are coerced to empty string to avoid rendering "[object Object]".
 */
export function safeNormalizePhone(value: unknown): string {
  try {
    if (value == null) return '';
    if (typeof value === 'string') return normalizePhone(value);
    if (typeof value === 'number') return normalizePhone(String(value));
    if (typeof value === 'object') return ''; // avoid [object Object] in UI
    return normalizePhone(String(value));
  } catch {
    return '';
  }
}

/**
 * Validate phone number - MOBILE ONLY.
 * Accepts:
 *   - Israeli mobile: 05X-XXXXXXX (10 digits total)
 *   - Israeli intl mobile: +972-5X-XXXXXXX
 *   - Other international: +XX... (non-Israeli)
 * Rejects:
 *   - Israeli landlines (02, 03, 04, 08, 09)
 *   - Too short/long numbers
 */
export function isValidMobilePhone(phone: string): boolean {
  const cleaned = normalizePhone(phone);
  if (!cleaned) return false;
  // For now we focus on Israeli mobiles only (05XXXXXXXX)
  return /^05\d{8}$/.test(cleaned);
}

/**
 * Get validation error message for invalid phone.
 * Returns null if valid.
 */
export function getPhoneError(phone: string, isHebrew: boolean): string | null {
  if (!phone?.trim()) {
    return isHebrew ? 'חובה להזין מספר טלפון נייד' : 'Mobile phone number is required';
  }
  if (!isValidMobilePhone(phone)) {
    return isHebrew
      ? 'יש להזין מספר נייד בלבד — 50-XXX-XXXX או קידומת בינלאומית'
      : 'Mobile number only — try 50-XXX-XXXX or international prefix';
  }
  return null;
}

// Profile validation schema
export const profileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(1, 'חובה להזין שם')
    .max(100, 'שם חייב להיות עד 100 תווים'),
  phone: z
    .string()
    .trim()
    .min(1, 'חובה להזין מספר טלפון נייד')
    .max(30, 'מספר הטלפון ארוך מדי')
    .refine(isValidMobilePhone, 'יש להזין מספר נייד בלבד — 50-XXX-XXXX או קידומת בינלאומית'),
});

// Event registration fields validation schema
export const eventFieldsSchema = z.object({
  age_text: z.string().max(10, 'הגיל יכול להכיל עד 10 תווים').optional(),
  birth_date: z.string().optional(),
  address_as: z.enum(['woman', 'man', 'other']).optional(),
  language_pref: z.enum(['comfortable_english', 'mixed_ok', 'hebrew_only', 'english_only']),
  dietary: z.array(z.string()).max(10),
  dietary_other: z.string().max(200, 'הערות תזונה יכולות להכיל עד 200 תווים').optional(),
  budget_level: z.enum(['₪', '₪₪', '₪₪₪']).optional(),
  occupation_category: z.string().max(100, 'מקצוע יכול להכיל עד 100 תווים').optional(),
  social_link: z
    .string()
    .max(SOCIAL_LINK_MAX_LENGTH, 'קישור חברתי יכול להכיל עד 500 תווים')
    .refine(
      (val) => !val || isValidGenericSocialUrl(val),
      'קישור חברתי חייב להיות כתובת URL תקינה שמתחילה ב-http:// או https://'
    )
    .optional(),
  arriving_mode: z.enum(['alone', 'with_friend']),
});

// Questionnaire answer validation
export const questionnaireAnswerSchema = z.union([
  z.string().max(2000, 'התשובה יכולה להכיל עד 2000 תווים'),
  z.number().min(1).max(7),
  z.array(z.string().max(100)).max(20),
]);

// Validation result types
export type ValidationSuccess<T> = { success: true; data: T };
export type ValidationError = { success: false; errors: string[] };
export type ValidationResult<T> = ValidationSuccess<T> | ValidationError;

// Validation helper functions
export function validateProfile(data: unknown): ValidationResult<z.infer<typeof profileSchema>> {
  const result = profileSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data } as ValidationSuccess<z.infer<typeof profileSchema>>;
  }
  return {
    success: false,
    errors: result.error.errors.map((e) => e.message),
  } as ValidationError;
}

export function validateEventFields(data: unknown): ValidationResult<z.infer<typeof eventFieldsSchema>> {
  const result = eventFieldsSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.errors.map((e) => e.message),
  };
}

// Field length constants for UI
export const FIELD_LIMITS = {
  FULL_NAME: 100,
  PHONE: 30,
  AGE_TEXT: 10,
  OCCUPATION: 100,
  SOCIAL_LINK: SOCIAL_LINK_MAX_LENGTH,
  DIETARY_OTHER: 200,
  FREE_TEXT_ANSWER: 2000,
} as const;
