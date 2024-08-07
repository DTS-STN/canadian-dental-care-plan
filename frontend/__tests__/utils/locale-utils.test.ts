import { renderHook } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import { useAppLocale } from '~/utils/locale-utils';

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
