import { describe, expect, it } from 'vitest';

import { transformAdobeAnalyticsUrl, transformChildrenRouteAdobeAnalyticsUrl } from '~/route-helpers/protected-apply-route-helpers';

describe('protected-apply-route-helpers', () => {
  describe('transformAdobeAnalyticsUrl', () => {
    it.each([['https://example.com/en/'], ['https://example.com/fr/'], ['https://example.com/en/apply'], ['https://example.com/fr/demander']])('should return as is for %s when not matching the protected apply route regex', (url) => {
      const actual = transformAdobeAnalyticsUrl(url);
      expect(actual).toEqual(new URL(url));
    });

    it.each([
      ['https://example.com/en/protected/apply/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/en/protected/apply/somepage/'],
      ['https://example.com/fr/protected/apply/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/fr/protected/apply/somepage/'],
      ['https://example.com/en/protege/demander/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/en/protege/demander/somepage/'],
      ['https://example.com/fr/protege/demander/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/fr/protege/demander/somepage/'],
    ])('should remove the session id path segment for %s when matching the protected apply route regex', (url, expectedUrl) => {
      const actual = transformAdobeAnalyticsUrl(url);
      expect(actual).toEqual(new URL(expectedUrl));
    });
  });

  describe('transformChildrenRouteAdobeAnalyticsUrl', () => {
    it.each([
      ['https://example.com/en/'],
      ['https://example.com/fr/'],
      ['https://example.com/en/apply'],
      ['https://example.com/fr/demander'],
      ['https://example.com/en/protected/apply/00000000-0000-0000-0000-000000000000/somepage/'],
      ['https://example.com/en/protege/demander/00000000-0000-0000-0000-000000000000/somepage/'],
    ])('should return as is for %s when not matching the protected apply route regex', (url) => {
      const actual = transformChildrenRouteAdobeAnalyticsUrl(url);
      expect(actual).toEqual(new URL(url));
    });

    it.each([
      ['https://example.com/en/protected/apply/00000000-0000-0000-0000-000000000000/children/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/en/protected/apply/children/somepage/'],
      ['https://example.com/fr/protected/apply/00000000-0000-0000-0000-000000000000/children/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/fr/protected/apply/children/somepage/'],
      ['https://example.com/en/protege/demander/00000000-0000-0000-0000-000000000000/enfants/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/en/protege/demander/enfants/somepage/'],
      ['https://example.com/fr/protege/demander/00000000-0000-0000-0000-000000000000/enfants/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/fr/protege/demander/enfants/somepage/'],
    ])('should remove the session id path segment for %s when matching the protected apply children route regex', (url, expectedUrl) => {
      const actual = transformChildrenRouteAdobeAnalyticsUrl(url);
      expect(actual).toEqual(new URL(expectedUrl));
    });
  });
});
