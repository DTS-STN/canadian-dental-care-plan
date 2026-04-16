import { describe, expect, it } from 'vitest';

import { transformAdobeAnalyticsUrl } from '~/route-helpers/adobe-analytics-route-helpers';

describe('transformAdobeAnalyticsUrl', () => {
  it('should replace UUID segments with default replacement', () => {
    const url = transformAdobeAnalyticsUrl('https://example.com/users/550e8400-e29b-41d4-a716-446655440000/details');
    expect(url.pathname).toBe('/users/:id:/details');
  });

  it('should replace UUID at end of path with default replacement', () => {
    const url = transformAdobeAnalyticsUrl('https://example.com/requests/550e8400-e29b-41d4-a716-446655440000');
    expect(url.pathname).toBe('/requests/:id:');
  });

  it('should replace UUID segments with provided replacement', () => {
    const url = transformAdobeAnalyticsUrl('https://example.com/users/550e8400-e29b-41d4-a716-446655440000/details', '');
    expect(url.pathname).toBe('/users/details');
  });

  it('should handle URL objects as input', () => {
    const urlObj = new URL('https://example.com/posts/550e8400-e29b-41d4-a716-446655440000');
    const result = transformAdobeAnalyticsUrl(urlObj);
    expect(result.pathname).toBe('/posts/:id:');
  });

  it('should preserve non-ID segments', () => {
    const url = transformAdobeAnalyticsUrl('https://example.com/users/john/profile');
    expect(url.pathname).toBe('/users/john/profile');
  });

  it('should handle multiple UUID segments', () => {
    const url = transformAdobeAnalyticsUrl('https://example.com/users/550e8400-e29b-41d4-a716-446655440000/posts/6ba7b810-9dad-11d1-80b4-00c04fd430c8/details');
    expect(url.pathname).toBe('/users/:id:/posts/:id:/details');
  });

  it('should handle root path', () => {
    const url = transformAdobeAnalyticsUrl('https://example.com/');
    expect(url.pathname).toBe('/');
  });

  it('should preserve query strings and fragments', () => {
    const url = transformAdobeAnalyticsUrl('https://example.com/users/550e8400-e29b-41d4-a716-446655440000?tab=info#section');
    expect(url.pathname).toBe('/users/:id:');
    expect(url.search).toBe('?tab=info');
    expect(url.hash).toBe('#section');
  });

  it('should handle empty replacement with UUID-only path', () => {
    const url = transformAdobeAnalyticsUrl('https://example.com/550e8400-e29b-41d4-a716-446655440000', '');
    expect(url.pathname).toBe('/');
  });

  it('should not replace non-UUID identifiers', () => {
    const url = transformAdobeAnalyticsUrl('https://example.com/users/V1StGXR8_Z/details');
    expect(url.pathname).toBe('/users/V1StGXR8_Z/details');
  });
});
