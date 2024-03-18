import { describe, expect, it } from 'vitest';

import { expandTemplate, padWithZero, randomHexString, randomString } from '~/utils/string-utils';

describe('expandTemplate', () => {
  it('should expand a template', () => {
    const template = '{greeting}, {subject}!';
    const variables = { greeting: 'Hello', subject: 'world' };

    expect(expandTemplate(template, variables)).toEqual('Hello, world!');
  });

  it('should expand a template and not throw an error if a variable is not defined', () => {
    const template = '{greeting}, {subject}!';
    const variables = { greeting: 'Hello' };

    expect(expandTemplate(template, variables)).toEqual('Hello, {subject}!');
  });

  it('should expand a template and not throw an error if extra variables are defined', () => {
    const template = '{greeting}, {subject}!';
    const variables = { greeting: 'Hello', subject: 'world', extra: 'variable' };

    expect(expandTemplate(template, variables)).toEqual('Hello, world!');
  });

  describe('randomHexString', () => {
    it('should generate a random hex string of specified length with the correct characters', () => {
      const str = randomHexString(8192);

      expect(str.length).toEqual(8192);
      expect(str).toMatch(/[0-9a-f]+/);
    });
  });

  describe('randomString', () => {
    it('should generate a random alphanumeric string of specified length with the correct characters', () => {
      const str = randomString(8192);

      expect(str.length).toEqual(8192);
      expect(str).toMatch(/[0-9a-z]+/);
    });
  });
});

describe('padWithZero', () => {
  it('should pad a number with zeros to reach the specified length', () => {
    expect(padWithZero(123, 5)).toBe('00123');
    expect(padWithZero(7, 3)).toBe('007');
    expect(padWithZero(1000, 5)).toBe('01000');
  });

  it('should return the value as a string if it is not a number', () => {
    expect(padWithZero(NaN, 5)).toBe('NaN');
  });

  it('should return the value as a string if its length is greater than or equal to maxLength', () => {
    expect(padWithZero(12345, 5)).toBe('12345');
    expect(padWithZero(123456, 5)).toBe('123456');
  });
});
