import { normalizePhone, hashPhone, extractChosung } from '../phone.utils';

describe('phone.utils', () => {
  // ── normalizePhone ──
  describe('normalizePhone', () => {
    it('should remove dashes and spaces', () => {
      expect(normalizePhone('010-1234-5678')).toBe('01012345678');
    });

    it('should convert +82 prefix to 0', () => {
      expect(normalizePhone('+82-10-1234-5678')).toBe('01012345678');
    });

    it('should handle +82 without dash', () => {
      expect(normalizePhone('+821012345678')).toBe('01012345678');
    });

    it('should remove parentheses and dots', () => {
      expect(normalizePhone('(010) 1234.5678')).toBe('01012345678');
    });

    it('should handle already clean number', () => {
      expect(normalizePhone('01012345678')).toBe('01012345678');
    });

    it('should handle empty string', () => {
      expect(normalizePhone('')).toBe('');
    });
  });

  // ── hashPhone ──
  describe('hashPhone', () => {
    it('should return consistent hash for same input', () => {
      const h1 = hashPhone('01012345678');
      const h2 = hashPhone('01012345678');
      expect(h1).toBe(h2);
    });

    it('should return different hash for different input', () => {
      const h1 = hashPhone('01012345678');
      const h2 = hashPhone('01087654321');
      expect(h1).not.toBe(h2);
    });

    it('should return 64 char hex string', () => {
      const h = hashPhone('01012345678');
      expect(h).toHaveLength(64);
      expect(h).toMatch(/^[0-9a-f]+$/);
    });
  });

  // ── extractChosung ──
  describe('extractChosung', () => {
    it('should extract chosung from Korean name', () => {
      expect(extractChosung('강호진')).toBe('ㄱㅎㅈ');
    });

    it('should extract chosung from mixed Korean', () => {
      expect(extractChosung('김민수')).toBe('ㄱㅁㅅ');
    });

    it('should keep non-Korean characters as-is', () => {
      expect(extractChosung('Hello')).toBe('Hello');
    });

    it('should handle mixed Korean and English', () => {
      expect(extractChosung('김A수')).toBe('ㄱAㅅ');
    });

    it('should handle empty string', () => {
      expect(extractChosung('')).toBe('');
    });

    it('should handle double consonants', () => {
      expect(extractChosung('빠른')).toBe('ㅃㄹ');
    });

    it('should handle all chosung', () => {
      expect(extractChosung('가나다라마바사아자차카타파하')).toBe('ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ');
    });

    it('should handle emoji in name', () => {
      const result = extractChosung('테스트😀');
      expect(result).toContain('ㅌㅅㅌ');
    });
  });
});
