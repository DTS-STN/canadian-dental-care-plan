import { renderHook } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import { parseDateString, useMonths } from '~/utils/date-utils';

describe('parseDateString', () => {
  it('should parse valid date string correctly', () => {
    expect(parseDateString('2024-03-18')).toEqual({
      year: '2024',
      month: '03',
      day: '18',
    });
    expect(parseDateString('1999-12-31')).toEqual({
      year: '1999',
      month: '12',
      day: '31',
    });
    expect(parseDateString('2024-02-29')).toEqual({
      year: '2024',
      month: '02',
      day: '29',
    });
  });

  it('should return an empty object for an invalid date string', () => {
    expect(parseDateString('')).toEqual({});
    expect(parseDateString('2024-13-18')).toEqual({});
    expect(parseDateString('2024-03-32')).toEqual({});
    expect(parseDateString('2024-03')).toEqual({});
    expect(parseDateString('hello')).toEqual({});
    expect(parseDateString('2024-03-18-')).toEqual({});
  });

  it('should return an empty object if the date does not exist', () => {
    expect(parseDateString('2023-02-29')).toEqual({});
    expect(parseDateString('2024-02-30')).toEqual({});
    expect(parseDateString('2100-02-29')).toEqual({});
  });
});

describe('useMonths', () => {
  it('should return an array of result.current with default format', () => {
    const { result } = renderHook(() => useMonths('en'));
    expect(result.current).toHaveLength(12);
    expect(result.current[0]).toHaveProperty('index', 1);
    expect(result.current[0]).toHaveProperty('text', 'January');
  });

  it('should return an array of result.current with specified format', () => {
    const { result } = renderHook(() => useMonths('en', 'short'));
    expect(result.current).toHaveLength(12);
    expect(result.current[0]).toHaveProperty('index', 1);
    expect(result.current[0]).toHaveProperty('text', 'Jan');
  });

  it('should return an array of result.current with custom locale', () => {
    const { result } = renderHook(() => useMonths('fr'));
    expect(result.current).toHaveLength(12);
    expect(result.current[0]).toHaveProperty('index', 1);
    expect(result.current[0]).toHaveProperty('text', 'janvier');
  });
});
