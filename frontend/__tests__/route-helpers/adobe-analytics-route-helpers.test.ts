import { describe, expect, it } from 'vitest';

import { transformAdobeAnalyticsUrl } from '~/route-helpers/adobe-analytics-route-helpers';

describe('transformAdobeAnalyticsUrl', () => {
  it('should remove NanoID segments (10 chars) by default', () => {
    // NanoID length is 10
    const url = transformAdobeAnalyticsUrl('https://example.com/users/V1StGXR8_Z/details');
    expect(url.pathname).toBe('/users/:id:/details');
  });

  it('should remove UUID segments by default', () => {
    const url = transformAdobeAnalyticsUrl('https://example.com/requests/550e8400-e29b-41d4-a716-446655440000');
    expect(url.pathname).toBe('/requests/:id:');
  });

  it('should replace ID segments with provided replacement', () => {
    const url = transformAdobeAnalyticsUrl('https://example.com/users/V1StGXR8_Z/details', '');
    expect(url.pathname).toBe('/users/details');
  });

  it('should handle URL objects as input', () => {
    const urlObj = new URL('https://example.com/posts/V1StGXR8_Z');
    const result = transformAdobeAnalyticsUrl(urlObj);
    expect(result.pathname).toBe('/posts/:id:');
  });

  it('should preserve non-ID segments', () => {
    const url = transformAdobeAnalyticsUrl('https://example.com/users/john/profile');
    expect(url.pathname).toBe('/users/john/profile');
  });

  it('should handle multiple ID segments', () => {
    const url = transformAdobeAnalyticsUrl('https://example.com/users/V1StGXR8_Z/posts/550e8400-e29b-41d4-a716-446655440000/details');
    expect(url.pathname).toBe('/users/:id:/posts/:id:/details');
  });

  it('should handle root path', () => {
    const url = transformAdobeAnalyticsUrl('https://example.com/');
    expect(url.pathname).toBe('/');
  });

  it('should preserve query strings and fragments', () => {
    const url = transformAdobeAnalyticsUrl('https://example.com/users/V1StGXR8_Z?tab=info#section');
    expect(url.pathname).toBe('/users/:id:');
    expect(url.search).toBe('?tab=info');
    expect(url.hash).toBe('#section');
  });

  it('should handle empty replacement resulting in clean path', () => {
    const url = transformAdobeAnalyticsUrl('https://example.com/V1StGXR8_Z', '');
    expect(url.pathname).toBe('/');
  });
});
