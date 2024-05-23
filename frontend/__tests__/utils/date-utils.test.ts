import { renderHook } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import { extractDateParts, useMonths } from '~/utils/date-utils';

describe('extractDateParts', () => {
  it('should parse valid date string correctly', () => {
    expect(extractDateParts('2024-03-18')).toEqual({
      year: '2024',
      month: '03',
      day: '18',
    });
    expect(extractDateParts('1999-12-31')).toEqual({
      year: '1999',
      month: '12',
      day: '31',
    });
    expect(extractDateParts('2024-02-29')).toEqual({
      year: '2024',
      month: '02',
      day: '29',
    });
  });

  it('should return an empty object for an invalid date string', () => {
    expect(extractDateParts('')).toEqual({});
    expect(extractDateParts('2024-13-18')).toEqual({});
    expect(extractDateParts('2024-03-32')).toEqual({});
    expect(extractDateParts('2024-03')).toEqual({});
    expect(extractDateParts('hello')).toEqual({});
    expect(extractDateParts('2024-03-18-')).toEqual({});
  });

  it('should return an empty object if the date does not exist', () => {
    expect(extractDateParts('2023-02-29')).toEqual({});
    expect(extractDateParts('2024-02-30')).toEqual({});
    expect(extractDateParts('2100-02-29')).toEqual({});
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
