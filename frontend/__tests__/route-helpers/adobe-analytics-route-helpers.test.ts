import { describe, expect, it, vi } from 'vitest';

import { transformAdobeAnalyticsUrl } from '~/route-helpers/adobe-analytics-route-helpers';

vi.mock('~/utils/id.utils', () => ({
  isValidId: vi.fn((segment: string) => {
    // Mock: treat segments that look like IDs (alphanumeric, 20+ chars or UUID pattern)
    return /^[a-zA-Z0-9_-]{20,}$/.test(segment) || /^[0-9a-f-]{36}$/.test(segment);
  }),
}));

describe('transformAdobeAnalyticsUrl', () => {
  it('should remove ID segments by default', () => {
    const url = transformAdobeAnalyticsUrl('https://example.com/users/V1StGXR8_Z5a1b2c3d4e5f6g7h8i9j/details');
    expect(url.pathname).toBe('/users/details');
  });

  it('should replace ID segments with provided replacement', () => {
    const url = transformAdobeAnalyticsUrl('https://example.com/users/V1StGXR8_Z5a1b2c3d4e5f6g7h8i9j/details', ':id:');
    expect(url.pathname).toBe('/users/:id:/details');
  });

  it('should handle URL objects as input', () => {
    const urlObj = new URL('https://example.com/posts/V1StGXR8_Z5a1b2c3d4e5f6g7h8i9j');
    const result = transformAdobeAnalyticsUrl(urlObj);
    expect(result.pathname).toBe('/posts');
  });

  it('should preserve non-ID segments', () => {
    const url = transformAdobeAnalyticsUrl('https://example.com/users/john/profile');
    expect(url.pathname).toBe('/users/john/profile');
  });

  it('should handle multiple ID segments', () => {
    const url = transformAdobeAnalyticsUrl('https://example.com/users/V1StGXR8_Z5a1b2c3d4e5f6g7h8i9j/posts/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6/details');
    expect(url.pathname).toBe('/users/posts/details');
  });

  it('should handle root path', () => {
    const url = transformAdobeAnalyticsUrl('https://example.com/');
    expect(url.pathname).toBe('/');
  });

  it('should preserve query strings and fragments', () => {
    const url = transformAdobeAnalyticsUrl('https://example.com/users/V1StGXR8_Z5a1b2c3d4e5f6g7h8i9j?tab=info#section');
    expect(url.pathname).toBe('/users');
    expect(url.search).toBe('?tab=info');
    expect(url.hash).toBe('#section');
  });

  it('should handle empty replacement resulting in clean path', () => {
    const url = transformAdobeAnalyticsUrl('https://example.com/V1StGXR8_Z5a1b2c3d4e5f6g7h8i9j', '');
    expect(url.pathname).toBe('/');
  });
});
