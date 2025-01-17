import { assert, describe, expect, it } from 'vitest';

import { phoneSchema } from '~/.server/validation/phone-schema';

describe('phoneSchema', () => {
  it('should pass validation for a valid Canadian phone number', () => {
    const result = phoneSchema().safeParse('613-555-1212');
    assert(result.success);
    expect(result.data).toBe('+1 613 555 1212');
  });

  it('should pass validation for a valid international phone number', () => {
    const result = phoneSchema().safeParse('+44 20 7183 8750');
    assert(result.success);
    expect(result.data).toBe('+44 20 7183 8750');
  });

  it('should pass validation for a valid Canadian phone number with leading +1', () => {
    const result = phoneSchema().safeParse('+1 613 555 1212');
    assert(result.success);
    expect(result.data).toBe('+1 613 555 1212');
  });

  it('should fail validation for an invalid Canadian phone number', () => {
    const result = phoneSchema().safeParse('123-4567');
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'custom',
        fatal: true,
        message: 'Invalid Canadian phone number, received 123-4567',
        path: [],
      },
    ]);
  });

  it('should fail validation for an invalid international phone number', () => {
    const result = phoneSchema().safeParse('+12 345 555 1212');
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'custom',
        fatal: true,
        message: 'Invalid international phone number, received +12 345 555 1212',
        path: [],
      },
    ]);
  });

  it('should fail validation for undefined phone number', () => {
    const result = phoneSchema().safeParse(undefined);

    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_type',
        expected: 'string',
        message: 'Phone number is required',
        path: [],
        received: 'undefined',
      },
    ]);
  });

  it('should fail validation for null phone number', () => {
    const result = phoneSchema().safeParse(null);
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'invalid_type',
        expected: 'string',
        message: 'Invalid phone number type. Expected string, received null',
        path: [],
        received: 'null',
      },
    ]);
  });

  it('should fail validation for an empty phone number', () => {
    const result = phoneSchema().safeParse('');
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_small',
        exact: false,
        inclusive: true,
        message: 'Phone number is required',
        minimum: 1,
        path: [],
        type: 'string',
      },
    ]);
  });

  it('should fail validation for a phone number with only spaces', () => {
    const result = phoneSchema().safeParse('   ');
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'too_small',
        exact: false,
        inclusive: true,
        message: 'Phone number is required',
        minimum: 1,
        path: [],
        type: 'string',
      },
    ]);
  });

  it('should correctly format a valid Canadian phone number with spaces', () => {
    const result = phoneSchema().safeParse('613 555 1212');
    assert(result.success);
    expect(result.data).toBe('+1 613 555 1212');
  });

  it('should correctly format a valid Canadian phone number with parenthesis and spaces', () => {
    const result = phoneSchema().safeParse('(613) 555-1212');
    assert(result.success);
    expect(result.data).toBe('+1 613 555 1212');
  });

  it('should handle phone number with invalid characters', () => {
    const result = phoneSchema().safeParse('613-555-1212!');
    assert(!result.success);
    expect(result.error.errors).toStrictEqual([
      {
        code: 'custom',
        fatal: true,
        message: 'Invalid Canadian phone number, received 613-555-1212!',
        path: [],
      },
    ]);
  });
});
