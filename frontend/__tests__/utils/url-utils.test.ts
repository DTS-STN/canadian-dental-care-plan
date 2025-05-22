import { assert, describe, expect, it } from 'vitest';

import { parseUrl, removePathSegment } from '~/utils/url-utils';

describe('removePathSegment function', () => {
  it('removes the segment at the specified position from the URL pathname', () => {
    const url = 'https://example.com/path/segment1/segment2/segment3';
    const newPosition = 3;
    const expectedUrl = 'https://example.com/path/segment1/segment2';
    expect(removePathSegment(url, newPosition)).toBe(expectedUrl);
  });

  it('handles URLs with fewer segments than the specified position', () => {
    const url = 'https://example.com/path/segment1';
    const newPosition = 2;
    const expectedUrl = 'https://example.com/path/segment1';
    expect(removePathSegment(url, newPosition)).toBe(expectedUrl);
  });

  it('handles URLs with no pathname', () => {
    const url = 'https://example.com';
    const newPosition = 0;
    const expectedUrl = 'https://example.com/';
    expect(removePathSegment(url, newPosition)).toBe(expectedUrl);
  });

  it('handles URLs with only root pathname', () => {
    const url = 'https://example.com/';
    const newPosition = 0;
    const expectedUrl = 'https://example.com/';
    expect(removePathSegment(url, newPosition)).toBe(expectedUrl);
  });

  it('handles removing the first segment', () => {
    const url = 'https://example.com/path/segment1/segment2';
    const newPosition = 1;
    const expectedUrl = 'https://example.com/path/segment2';
    expect(removePathSegment(url, newPosition)).toBe(expectedUrl);
  });

  it('handles removing the last segment', () => {
    const url = 'https://example.com/path/segment1/segment2/segment3';
    const newPosition = 3;
    const expectedUrl = 'https://example.com/path/segment1/segment2';
    expect(removePathSegment(url, newPosition)).toBe(expectedUrl);
  });
});

describe('parseUrl', () => {
  it('should parse a valid absolute URL string', () => {
    const result = parseUrl('https://example.com');
    expect(result).toEqual({
      success: true,
      url: new URL('https://example.com'),
    });
  });

  it('should parse a valid relative URL with base', () => {
    const result = parseUrl('/path', 'https://example.com');
    expect(result).toEqual({
      success: true,
      url: new URL('/path', 'https://example.com'),
    });
  });

  it('should parse a URL object without changing it', () => {
    const inputUrl = new URL('https://example.com');
    const result = parseUrl(inputUrl);
    expect(result).toEqual({
      success: true,
      url: inputUrl,
    });
  });

  it('should fail to parse an invalid URL string', () => {
    const result = parseUrl('http://[invalid-url]');
    assert(result.success === false);
    expect(result.error).toBeInstanceOf(TypeError);
  });

  it('should fail when given an invalid base URL', () => {
    const result = parseUrl('/path', 'not-a-valid-base');
    assert(result.success === false);
    expect(result.error).toBeInstanceOf(TypeError);
  });

  it('should fail when both url and base are invalid', () => {
    const result = parseUrl('not-a-url', 'also-not-a-url');
    assert(result.success === false);
    expect(result.error).toBeInstanceOf(TypeError);
  });
});
