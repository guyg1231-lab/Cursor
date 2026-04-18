import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { normalizePhone } from '@/lib/validation';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  isValid?: boolean | null;
  isTouched?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  /** Optional override for the outer container classes (background, focus background, etc.) */
  containerClassName?: string;
}

// Known country dial codes for formatting (sorted by length, longest first for matching)
const DIAL_CODES: { code: string; format: (n: string) => string }[] = [
  // 4-digit codes
  { code: '+1684', format: (n) => formatGeneric(n) }, // American Samoa
  // 3-digit codes
  { code: '+972', format: (n) => formatIsraeli(n) },
  { code: '+971', format: (n) => formatGeneric(n) }, // UAE
  { code: '+966', format: (n) => formatGeneric(n) }, // Saudi
  { code: '+965', format: (n) => formatGeneric(n) }, // Kuwait
  { code: '+962', format: (n) => formatGeneric(n) }, // Jordan
  { code: '+961', format: (n) => formatGeneric(n) }, // Lebanon
  { code: '+974', format: (n) => formatGeneric(n) }, // Qatar
  { code: '+353', format: (n) => formatGeneric(n) }, // Ireland
  { code: '+351', format: (n) => formatGeneric(n) }, // Portugal
  { code: '+380', format: (n) => formatGeneric(n) }, // Ukraine
  { code: '+375', format: (n) => formatGeneric(n) }, // Belarus
  // 2-digit codes
  { code: '+44', format: (n) => formatUK(n) },
  { code: '+49', format: (n) => formatGerman(n) },
  { code: '+33', format: (n) => formatFrench(n) },
  { code: '+39', format: (n) => formatGeneric(n) }, // Italy
  { code: '+34', format: (n) => formatGeneric(n) }, // Spain
  { code: '+31', format: (n) => formatGeneric(n) }, // Netherlands
  { code: '+32', format: (n) => formatGeneric(n) }, // Belgium
  { code: '+41', format: (n) => formatGeneric(n) }, // Switzerland
  { code: '+43', format: (n) => formatGeneric(n) }, // Austria
  { code: '+48', format: (n) => formatGeneric(n) }, // Poland
  { code: '+46', format: (n) => formatGeneric(n) }, // Sweden
  { code: '+47', format: (n) => formatGeneric(n) }, // Norway
  { code: '+45', format: (n) => formatGeneric(n) }, // Denmark
  { code: '+30', format: (n) => formatGeneric(n) }, // Greece
  { code: '+36', format: (n) => formatGeneric(n) }, // Hungary
  { code: '+40', format: (n) => formatGeneric(n) }, // Romania
  { code: '+20', format: (n) => formatGeneric(n) }, // Egypt
  { code: '+27', format: (n) => formatGeneric(n) }, // South Africa
  { code: '+61', format: (n) => formatAustralian(n) }, // Australia
  { code: '+64', format: (n) => formatGeneric(n) }, // New Zealand
  { code: '+81', format: (n) => formatGeneric(n) }, // Japan
  { code: '+82', format: (n) => formatGeneric(n) }, // South Korea
  { code: '+86', format: (n) => formatGeneric(n) }, // China
  { code: '+91', format: (n) => formatGeneric(n) }, // India
  { code: '+90', format: (n) => formatGeneric(n) }, // Turkey
  { code: '+55', format: (n) => formatGeneric(n) }, // Brazil
  { code: '+52', format: (n) => formatGeneric(n) }, // Mexico
  { code: '+54', format: (n) => formatGeneric(n) }, // Argentina
  // 1-digit (NANP)
  { code: '+1', format: (n) => formatNANP(n) }, // US, Canada, etc.
  { code: '+7', format: (n) => formatGeneric(n) }, // Russia
];

// Format functions for different regions
function formatIsraeli(digits: string): string {
  // Israeli mobile: 5X-XXX-XXXX (9 digits after country code)
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5, 9)}`;
}

function formatNANP(digits: string): string {
  // North American: XXX-XXX-XXXX
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

function formatUK(digits: string): string {
  // UK: XXXX XXX XXXX or similar
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 11)}`;
}

function formatGerman(digits: string): string {
  // German: XXX XXXXXXXX
  if (digits.length <= 3) return digits;
  return `${digits.slice(0, 3)} ${digits.slice(3, 11)}`;
}

function formatFrench(digits: string): string {
  // French: X XX XX XX XX
  if (digits.length === 0) return '';
  if (digits.length === 1) return digits;
  let result = digits[0];
  for (let i = 1; i < Math.min(digits.length, 9); i += 2) {
    result += ' ' + digits.slice(i, i + 2);
  }
  return result;
}

function formatAustralian(digits: string): string {
  // Australian: XXX XXX XXX
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
}

function formatGeneric(digits: string): string {
  // Generic: XXX-XXX-XXXX
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

/**
 * Detect dial code from a phone string
 */
function detectDialCode(phone: string): { dialCode: string; localNumber: string } {
  if (!phone.startsWith('+')) {
    // Israeli local format starting with 05X
    if (/^0[5][0-9]/.test(phone)) {
      return { dialCode: '+972', localNumber: phone.slice(1).replace(/\D/g, '') };
    }
    // Assume Israel if no prefix
    return { dialCode: '+972', localNumber: phone.replace(/\D/g, '') };
  }

  // Find matching dial code (check longest codes first)
  for (const { code } of DIAL_CODES) {
    if (phone.startsWith(code)) {
      return {
        dialCode: code,
        localNumber: phone.slice(code.length).replace(/\D/g, '')
      };
    }
  }

  // Unknown international - try to extract
  const match = phone.match(/^(\+\d{1,4})/);
  if (match) {
    return {
      dialCode: match[1],
      localNumber: phone.slice(match[1].length).replace(/\D/g, '')
    };
  }

  return { dialCode: '+972', localNumber: phone.replace(/\D/g, '') };
}

/**
 * Format local number based on dial code
 */
function formatLocalNumber(dialCode: string, digits: string): string {
  const formatter = DIAL_CODES.find(d => d.code === dialCode);
  if (formatter) {
    return formatter.format(digits);
  }
  return formatGeneric(digits);
}

/**
 * Convert to E.164 storage format
 */
function toE164(dialCode: string, localNumber: string): string {
  const digits = localNumber.replace(/\D/g, '');
  if (!digits) return '';
  return `${dialCode}${digits}`;
}

export function PhoneInput({
  value,
  onChange,
  onBlur,
  isValid,
  isTouched,
  placeholder = '50-123-4567',
  autoFocus = false,
  containerClassName,
}: PhoneInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse current value
  const { dialCode, localNumber } = detectDialCode(value);
  const [currentDialCode, setCurrentDialCode] = useState(dialCode);
  const [displayNumber, setDisplayNumber] = useState(formatLocalNumber(dialCode, localNumber));

  // Sync with external value changes
  useEffect(() => {
    const { dialCode: newDialCode, localNumber: newLocal } = detectDialCode(value);
    setCurrentDialCode(newDialCode);
    setDisplayNumber(formatLocalNumber(newDialCode, newLocal));
  }, [value]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;

    // Check if user is typing a new dial code
    if (inputValue.startsWith('+')) {
      // User is entering a full international number
      const { dialCode: newDialCode, localNumber: newLocal } = detectDialCode(inputValue);
      setCurrentDialCode(newDialCode);
      setDisplayNumber(formatLocalNumber(newDialCode, newLocal));
      onChange(toE164(newDialCode, newLocal));
      return;
    }

    // Check if user typed Israeli format starting with 0
    if (inputValue.startsWith('0') && currentDialCode === '+972') {
      // Remove leading 0 for Israeli mobile
      inputValue = inputValue.slice(1);
    }

    // Remove non-digits for processing
    const digits = inputValue.replace(/\D/g, '');

    // Format for display
    const formatted = formatLocalNumber(currentDialCode, digits);
    setDisplayNumber(formatted);

    // Update parent with E.164 format
    onChange(toE164(currentDialCode, digits));
  }, [currentDialCode, onChange]);

  // Handle prefix click - allow editing the full number including prefix
  const handlePrefixClick = useCallback(() => {
    if (inputRef.current) {
      // Set the full value with prefix for editing
      const fullValue = `${currentDialCode}${displayNumber.replace(/\D/g, '')}`;
      setDisplayNumber(fullValue);
      inputRef.current.focus();
      // Select all after a brief delay to allow the value to update
      setTimeout(() => {
        inputRef.current?.select();
      }, 0);
    }
  }, [currentDialCode, displayNumber]);

  // Determine border color based on validation state
  const getBorderClasses = () => {
    if (isTouched && isValid === false) {
      return 'border-destructive focus-within:border-destructive focus-within:ring-destructive/20';
    }
    if (isValid === true) {
      return 'border-sage focus-within:border-sage focus-within:ring-sage/20';
    }
    return 'border-border focus-within:border-sage focus-within:ring-sage/20';
  };

  // Check if display shows full number with prefix
  const showingFullNumber = displayNumber.startsWith('+');

  const handleInputBlur = useCallback(() => {
    const normalized = normalizePhone(value);
    if (normalized && normalized !== value) {
      onChange(normalized);
    }
    onBlur?.();
  }, [onBlur, onChange, value]);

  return (
    <div className="relative font-hebrew">
      {/* Main container - LTR for phone number display */}
      <div
        dir="ltr"
        className={cn(
          'flex items-center gap-0 rounded-2xl border-2 transition-all duration-200 focus-within:ring-4',
          containerClassName ?? 'bg-card/90 focus-within:bg-card',
          getBorderClasses(),
        )}
      >
        {/* Phone icon - leftmost */}
        <div className="pl-4 pr-2 py-4">
          <Phone className={`w-5 h-5 ${isValid ? 'text-sage' : 'text-muted-foreground'}`} />
        </div>

        {/* Dial code - clickable to edit */}
        {!showingFullNumber && (
          <button
            type="button"
            onClick={handlePrefixClick}
            className="
              flex items-center py-4 pr-2
              text-sm font-medium text-muted-foreground
              hover:text-foreground transition-colors
              cursor-text
            "
            aria-label="Edit dial code"
            tabIndex={-1}
          >
            {currentDialCode}
          </button>
        )}

        {/* Phone number input */}
        <div className="flex-1">
          <input
            ref={inputRef}
            type="tel"
            inputMode="tel"
            value={displayNumber}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            placeholder={showingFullNumber ? '+972 50-123-4567' : placeholder}
            autoFocus={autoFocus}
            className="
              w-full px-2 py-4 bg-transparent
              text-foreground text-base font-medium
              placeholder:text-muted-foreground
              focus:outline-none
              rounded-r-2xl
            "
            autoComplete="tel"
          />
        </div>
      </div>
    </div>
  );
}
