import { describe, expect, it } from 'vitest';

import { removePathSegment } from '~/utils/url-utils';

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
