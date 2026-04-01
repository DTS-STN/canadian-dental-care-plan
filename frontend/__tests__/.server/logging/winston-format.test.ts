import type { TransformableInfo } from 'logform';
import { describe, expect, it } from 'vitest';

import { formatSensitiveData } from '~/.server/logging/winston-format';

function mask(message: unknown): unknown {
  const info = formatSensitiveData().transform({ level: 'debug', message } as TransformableInfo);
  return (info as TransformableInfo).message;
}

// 123456782 and 987654324 are fictitious but Luhn-valid SINs used only for testing.
describe('formatSensitiveData', () => {
  it('masks a plain 9-digit SIN', () => {
    expect(mask('SIN is 123456782')).toBe('SIN is "***-***-782"');
  });

  it('masks a space-separated SIN', () => {
    expect(mask('SIN is 123 456 782')).toBe('SIN is "***-***-782"');
  });

  it('masks a hyphen-separated SIN', () => {
    expect(mask('SIN is 123-456-782')).toBe('SIN is "***-***-782"');
  });

  it('masks a SIN embedded in a longer message', () => {
    expect(mask('Processing application for 123456782 now')).toBe('Processing application for "***-***-782" now');
  });

  it('masks multiple SINs in the same message', () => {
    expect(mask('User 123456782 and user 987654324')).toBe('User "***-***-782" and user "***-***-324"');
  });

  it('masks a JSON string SIN without double-quoting', () => {
    expect(mask('{"socialInsuranceNumber":"123456782"}')).toBe('{"socialInsuranceNumber":"***-***-782"}');
  });

  it('masks a JSON number SIN and converts it to a string', () => {
    expect(mask('{"socialInsuranceNumber":123456782}')).toBe('{"socialInsuranceNumber":"***-***-782"}');
  });

  it('masks a JSON string SIN (520325317)', () => {
    expect(mask('{"socialInsuranceNumber":"520325317"}')).toBe('{"socialInsuranceNumber":"***-***-317"}');
  });

  it('masks a JSON number SIN and converts it to a string (520325317)', () => {
    expect(mask('{"socialInsuranceNumber":520325317}')).toBe('{"socialInsuranceNumber":"***-***-317"}');
  });

  it('does not mask a 9-digit number that fails the Luhn checksum', () => {
    expect(mask('number 123456789')).toBe('number 123456789');
  });

  it('does not mask a number longer than 9 digits (right side)', () => {
    expect(mask('number 1234567820')).toBe('number 1234567820');
  });

  it('does not mask a number longer than 9 digits (left side)', () => {
    expect(mask('number 1123456782')).toBe('number 1123456782');
  });

  it('does not mask a number longer than 9 digits (both sides)', () => {
    expect(mask('number 123456782009890')).toBe('number 123456782009890');
  });

  it('does not mask a number shorter than 9 digits', () => {
    expect(mask('number 12345678')).toBe('number 12345678');
  });

  it('returns a plain message with no SIN unchanged', () => {
    expect(mask('no sensitive data here')).toBe('no sensitive data here');
  });

  it('returns an empty string unchanged', () => {
    expect(mask('')).toBe('');
  });

  it('returns info unchanged when message is not a string', () => {
    const info = formatSensitiveData().transform({ level: 'debug', message: 42 } as unknown as TransformableInfo);
    expect((info as TransformableInfo).message).toBe(42);
  });
});
