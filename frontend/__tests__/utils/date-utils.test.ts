import { renderHook } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import { isValidDate, parseDateString, useMonths } from '~/utils/date-utils';

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

describe('isValidDate', () => {
  it('should parse valid date string correctly', () => {
    expect(isValidDate('2024/03/18', 'yyyy/mm/dd', '/')).toEqual(true);
    expect(isValidDate('03/18/2024', 'mm/dd/yyyy', '/')).toEqual(true);
    expect(isValidDate('2024-03-18', 'yyyy-mm-dd', '-')).toEqual(true);
    expect(isValidDate('03-18-2024', 'mm-dd-yyyy', '-')).toEqual(true);
  });

  it('invalid date', () => {
    expect(isValidDate('02/31/2024', 'mm/dd/yyyy', '/')).toEqual(false);
    expect(isValidDate('02/29/2001', 'mm/dd/yyyy', '/')).toEqual(false);
    expect(isValidDate('13-18-2024', 'mm-dd-yyyy', '-')).toEqual(false);
    expect(isValidDate('13-18-3000', 'mm-dd-yyyy', '-')).toEqual(false);
  });

  it('invalid format', () => {
    expect(isValidDate('03/17/2024', 'yyyy/mm/dd', '/')).toEqual(false);
    expect(isValidDate('03/18/2024', 'yyyymm/dd', '/')).toEqual(false);
  });
});
