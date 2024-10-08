import { describe, expect, it } from 'vitest';

import { expandTemplate, formatPercent, hasDigits, isAllValidInputCharacters, normalizeHyphens, padWithZero, randomHexString, randomString, removeInvalidInputCharacters } from '~/utils/string-utils';

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

describe('isAllValidInputCharacters', () => {
  it('should return true for input containing the entire valid character set', () => {
    expect(isAllValidInputCharacters("a-zA-Z0-9'’ \u00a0(),-.ÀÁÂÄÇÈÉÊËÌÍÎÏÒÓÔÖÙÚÛÜÝàáâäçèéêëìíîïòóôöùúûüýÿ")).toEqual(true);
  });

  it('should return false for input containing invalid characters', () => {
    expect(isAllValidInputCharacters('!"#$%&*+/:;<=>?@[\\]^_`{|}~¡¢£¤¥¦§¨©ª«¬\u00ad®¯±²³\u00b4µ-m¶·\u00b8¹º»¼½¾¿ÃãÅåÆæÐðÑñÕõ\u00d7ØøÞþẞß\u00f7')).toEqual(false);
  });
});

describe('removeInvalidInputCharacters', () => {
  it.each([
    ['abc123!@#', 'abc123'],
    ['abcdef123', 'abcdef123'],
    ['', ''],
    ['!@#', ''],
    ['a b c', 'a b c'],
    ['a1b!c2@d#e3f', 'a1bc2de3f'],
  ])('should remove invalid characters from "%s" to "%s"', (input, expectedOutput) => {
    expect(removeInvalidInputCharacters(input)).toBe(expectedOutput);
  });
});

describe('hasDigits', () => {
  it.each([
    ['', false],
    ['abc', false],
    ['abcABC', false],
    ['1', true],
    ['abc1', true],
    ['a1b2c3', true],
  ])('%s should return %s', (input, expected) => {
    expect(hasDigits(input)).toEqual(expected);
  });
});

describe('normalizeHyphens', () => {
  it.each([
    ['a--b---c', 'a-b-c'],
    ['a-b-c', 'a-b-c'],
    ['', ''],
    ['----', '-'],
    ['-abc--def-', '-abc-def-'],
  ])('should normalize hyphens in "%s" to "%s"', (input, expectedOutput) => {
    expect(normalizeHyphens(input)).toBe(expectedOutput);
  });
});

describe('formatPercent', () => {
  it.each([
    [0, '0%'],
    [50, '50%'],
    [100, '100%'],
  ])('should format percentage in English', (input, expected) => {
    expect(formatPercent(input, 'en')).toEqual(expected);
  });

  it.each([
    [0, '0\u00a0%'],
    [50, '50\u00a0%'],
    [100, '100\u00a0%'],
  ])('should format percentage in French', (input, expected) => {
    expect(formatPercent(input, 'fr')).toEqual(expected);
  });

  it('should throw an error for invalid Canadian locale', () => {
    expect(() => formatPercent(0, 'xy')).toThrowError();
  });
});
