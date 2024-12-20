import { describe, expect, it } from 'vitest';

import { transformAdobeAnalyticsUrl, transformChildrenRouteAdobeAnalyticsUrl } from '~/route-helpers/protected-renew-route-helpers';

describe('protected-renew-route-helpers', () => {
  describe('transformAdobeAnalyticsUrl', () => {
    it.each([['https://example.com/en/'], ['https://example.com/fr/'], ['https://example.com/en/renew'], ['https://example.com/fr/renouveller']])('should return as is for %s when not matching the protected renew route regex', (url) => {
      const actual = transformAdobeAnalyticsUrl(url);
      expect(actual).toEqual(new URL(url));
    });

    it.each([
      ['https://example.com/en/protected/renew/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/en/protected/renew/somepage/'],
      ['https://example.com/fr/protected/renew/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/fr/protected/renew/somepage/'],
      ['https://example.com/en/protege/renouveller/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/en/protege/renouveller/somepage/'],
      ['https://example.com/fr/protege/renouveller/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/fr/protege/renouveller/somepage/'],
    ])('should remove the session id path segment for %s when matching the protected renew route regex', (url, expectedUrl) => {
      const actual = transformAdobeAnalyticsUrl(url);
      expect(actual).toEqual(new URL(expectedUrl));
    });
  });

  describe('transformChildrenRouteAdobeAnalyticsUrl', () => {
    it.each([
      ['https://example.com/en/'],
      ['https://example.com/fr/'],
      ['https://example.com/en/renew'],
      ['https://example.com/fr/renouveller'],
      ['https://example.com/en/protected/renew/00000000-0000-0000-0000-000000000000/somepage/'],
      ['https://example.com/en/protege/renouveller/00000000-0000-0000-0000-000000000000/somepage/'],
    ])('should return as is for %s when not matching the protected renew route regex', (url) => {
      const actual = transformChildrenRouteAdobeAnalyticsUrl(url);
      expect(actual).toEqual(new URL(url));
    });

    it.each([
      ['https://example.com/en/protected/renew/00000000-0000-0000-0000-000000000000/children/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/en/protected/renew/children/somepage/'],
      ['https://example.com/fr/protected/renew/00000000-0000-0000-0000-000000000000/children/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/fr/protected/renew/children/somepage/'],
      ['https://example.com/en/protege/renouveller/00000000-0000-0000-0000-000000000000/enfants/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/en/protege/renouveller/enfants/somepage/'],
      ['https://example.com/fr/protege/renouveller/00000000-0000-0000-0000-000000000000/enfants/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/fr/protege/renouveller/enfants/somepage/'],
    ])('should remove the session id path segment for %s when matching the protected renew children route regex', (url, expectedUrl) => {
      const actual = transformChildrenRouteAdobeAnalyticsUrl(url);
      expect(actual).toEqual(new URL(expectedUrl));
    });
  });
});
