import { describe, expect, it } from 'vitest';

import { expectDefined } from '~/utils/assert-utils';

describe('expectDefined', () => {
  it('should return a string value', () => {
    expect(expectDefined('hello', 'fail')).toBe('hello');
  });

  it('should return a number value', () => {
    expect(expectDefined(42, 'fail')).toBe(42);
  });

  it('should return 0 without throwing', () => {
    expect(expectDefined(0, 'fail')).toBe(0);
  });

  it('should return false without throwing', () => {
    expect(expectDefined(false, 'fail')).toBe(false);
  });

  it('should throw on null', () => {
    expect(() => expectDefined(null, 'value was null')).toThrow('value was null');
  });

  it('should throw on undefined', () => {
    expect(() => expectDefined(undefined, 'value was undefined')).toThrow('value was undefined');
  });

  it('should throw on empty string', () => {
    expect(() => expectDefined('', 'value was empty')).toThrow('value was empty');
  });

  it('should return an object value', () => {
    const obj = { key: 'value' };
    expect(expectDefined(obj, 'fail')).toBe(obj);
  });

  it('should return an array value', () => {
    const arr = [1, 2, 3];
    expect(expectDefined(arr, 'fail')).toBe(arr);
  });

  it('should return true without throwing', () => {
    expect(expectDefined(true, 'fail')).toBe(true);
  });
});
