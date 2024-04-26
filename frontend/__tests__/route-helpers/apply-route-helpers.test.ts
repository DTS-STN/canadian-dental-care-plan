import { describe, expect, it } from 'vitest';

import { transformAdobeAnalyticsUrl } from '~/route-helpers/apply-route-helpers';

describe('transformAdobeAnalyticsUrl', () => {
  it.each([['https://example.com/en/'], ['https://example.com/fr/'], ['https://example.com/en/status'], ['https://example.com/fr/statut']])('should return as is for %s when not matching the apply route regex', (url) => {
    const actual = transformAdobeAnalyticsUrl(url);
    expect(actual).toEqual(new URL(url));
  });

  it.each([
    ['https://example.com/en/apply/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/en/apply/somepage/'],
    ['https://example.com/fr/apply/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/fr/apply/somepage/'],
    ['https://example.com/en/demander/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/en/demander/somepage/'],
    ['https://example.com/fr/demander/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/fr/demander/somepage/'],
  ])('should remove the session id path segment for %s when matching the apply route regex', (url, expectedUrl) => {
    const actual = transformAdobeAnalyticsUrl(url);
    expect(actual).toEqual(new URL(expectedUrl));
  });
});
