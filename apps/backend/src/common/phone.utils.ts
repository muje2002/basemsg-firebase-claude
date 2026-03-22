import { createHash } from 'crypto';

const CHOSUNG = [
  'ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ',
  'ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ',
];

/**
 * Normalize a phone number to a standard format.
 * - Removes spaces, dashes, parentheses, dots
 * - Converts +82 prefix to 0
 * - Returns digits only (e.g., "01012345678")
 */
export function normalizePhone(phone: string): string {
  let normalized = phone.replace(/[\s\-().]/g, '');

  // Convert +82 to 0
  if (normalized.startsWith('+82')) {
    normalized = '0' + normalized.slice(3);
  }

  // Remove any remaining non-digit characters
  normalized = normalized.replace(/\D/g, '');

  return normalized;
}

/**
 * Hash a normalized phone number using SHA256 with a salt.
 */
export function hashPhone(normalizedPhone: string): string {
  const salt = 'basemsg_phone_salt_v1';
  return createHash('sha256')
    .update(salt + normalizedPhone)
    .digest('hex');
}

/**
 * Extract Korean initial consonants (chosung) from a string.
 * e.g., "강호진" → "ㄱㅎㅈ"
 * Non-Korean characters are kept as-is.
 */
export function extractChosung(str: string): string {
  return [...str]
    .map((ch) => {
      const code = ch.charCodeAt(0) - 0xac00;
      if (code < 0 || code > 11171) return ch;
      return CHOSUNG[Math.floor(code / 588)];
    })
    .join('');
}
