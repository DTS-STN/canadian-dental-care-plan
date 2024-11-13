import { renderHook } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import { APP_LOCALES, isAppLocale, useAppLocale } from '~/utils/locale-utils';

/*
 * @vitest-environment jsdom
 */

describe('locale-utils', () => {
  describe('APP_LOCALES', () => {
    it('should contain only "en" and "fr"', () => {
      expect(APP_LOCALES).toEqual(['en', 'fr']);
    });
  });

  describe('isAppLocale', () => {
    it('should return true for a valid locale "en"', () => {
      const result = isAppLocale('en');
      expect(result).toBe(true);
    });

    it('should return true for a valid locale "fr"', () => {
      const result = isAppLocale('fr');
      expect(result).toBe(true);
    });

    it('should return false for an invalid locale "es"', () => {
      const result = isAppLocale('es');
      expect(result).toBe(false);
    });

    it('should return false for a non-string value 123', () => {
      const result = isAppLocale(123);
      expect(result).toBe(false);
    });

    it('should return false for an object value', () => {
      const result = isAppLocale({} as unknown);
      expect(result).toBe(false);
    });

    it('should return false for an array value', () => {
      const result = isAppLocale([] as unknown);
      expect(result).toBe(false);
    });

    it('should return false for null', () => {
      const result = isAppLocale(null);
      expect(result).toBe(false);
    });

    it('should return false for undefined', () => {
      const result = isAppLocale(undefined);
      expect(result).toBe(false);
    });
  });

  describe('useAppLocale', () => {
    it('should return "fr" when locale is "fr"', () => {
      const { result } = renderHook(() => useAppLocale('fr'));
      expect(result.current).toBe('fr');
    });

    it('should return "en" when locale is "en"', () => {
      const { result } = renderHook(() => useAppLocale('en'));
      expect(result.current).toBe('en');
    });

    it('should return "en" when locale is "es"', () => {
      const { result } = renderHook(() => useAppLocale('es'));
      expect(result.current).toBe('en');
    });

    it('should return "en" when locale is an empty string', () => {
      const { result } = renderHook(() => useAppLocale(''));
      expect(result.current).toBe('en');
    });
  });
});
