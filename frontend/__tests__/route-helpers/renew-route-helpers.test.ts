import { describe, expect, it } from 'vitest';

import { transformAdobeAnalyticsUrl, transformAdultChildChildrenRouteAdobeAnalyticsUrl, transformChildChildrenRouteAdobeAnalyticsUrl } from '~/route-helpers/renew-route-helpers';

describe('renew-route-helpers', () => {
  describe('transformAdobeAnalyticsUrl', () => {
    it.each([
      ['https://example.com/en/'],
      ['https://example.com/fr/'],
      ['https://example.com/en/status'],
      ['https://example.com/fr/etat'],
      ['https://example.com/en/protected/renew/00000000-0000-0000-0000-000000000000/somepage/'],
      ['https://example.com/fr/protege/renouveller/00000000-0000-0000-0000-000000000000/somepage/'],
    ])('should return as is for %s when not matching the renew route regex', (url) => {
      const actual = transformAdobeAnalyticsUrl(url);
      expect(actual).toEqual(new URL(url));
    });

    it.each([
      ['https://example.com/en/renew/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/en/renew/somepage/'],
      ['https://example.com/fr/renew/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/fr/renew/somepage/'],
      ['https://example.com/en/renouveller/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/en/renouveller/somepage/'],
      ['https://example.com/fr/renouveller/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/fr/renouveller/somepage/'],
    ])('should remove the session id path segment for %s when matching the renew route regex', (url, expectedUrl) => {
      const actual = transformAdobeAnalyticsUrl(url);
      expect(actual).toEqual(new URL(expectedUrl));
    });
  });

  describe('transformAdultChildChildrenRouteAdobeAnalyticsUrl', () => {
    it.each([
      ['https://example.com/en/'],
      ['https://example.com/fr/'],
      ['https://example.com/en/status'],
      ['https://example.com/fr/etat'],
      ['https://example.com/en/protected/renew/00000000-0000-0000-0000-000000000000/somepage/'],
      ['https://example.com/fr/protege/renouveller/00000000-0000-0000-0000-000000000000/somepage/'],
    ])('should return as is for %s when not matching the renew adult child route regex', (url) => {
      const actual = transformAdultChildChildrenRouteAdobeAnalyticsUrl(url);
      expect(actual).toEqual(new URL(url));
    });

    it.each([
      ['https://example.com/en/renew/00000000-0000-0000-0000-000000000000/adult-child/children/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/en/renew/adult-child/children/somepage/'],
      ['https://example.com/fr/renew/00000000-0000-0000-0000-000000000000/adult-child/children/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/fr/renew/adult-child/children/somepage/'],
      ['https://example.com/en/renouveller/00000000-0000-0000-0000-000000000000/adulte-enfant/enfants/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/en/renouveller/adulte-enfant/enfants/somepage/'],
      ['https://example.com/fr/renouveller/00000000-0000-0000-0000-000000000000/adulte-enfant/enfants/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/fr/renouveller/adulte-enfant/enfants/somepage/'],
    ])('should remove the session id and child id path segments for %s when matching the renew adult child flow children route regex', (url, expectedUrl) => {
      const actual = transformAdultChildChildrenRouteAdobeAnalyticsUrl(url);
      expect(actual).toEqual(new URL(expectedUrl));
    });
  });

  describe('transformChildChildrenRouteAdobeAnalyticsUrl', () => {
    it.each([
      ['https://example.com/en/'],
      ['https://example.com/fr/'],
      ['https://example.com/en/status'],
      ['https://example.com/fr/etat'],
      ['https://example.com/en/protected/renew/00000000-0000-0000-0000-000000000000/somepage/'],
      ['https://example.com/fr/protege/renouveller/00000000-0000-0000-0000-000000000000/somepage/'],
    ])('should return as is for %s when not matching the renew child flow route regex', (url) => {
      const actual = transformChildChildrenRouteAdobeAnalyticsUrl(url);
      expect(actual).toEqual(new URL(url));
    });

    it.each([
      ['https://example.com/en/renew/00000000-0000-0000-0000-000000000000/child/children/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/en/renew/child/children/somepage/'],
      ['https://example.com/fr/renew/00000000-0000-0000-0000-000000000000/child/children/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/fr/renew/child/children/somepage/'],
      ['https://example.com/en/renouveller/00000000-0000-0000-0000-000000000000/enfant/enfants/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/en/renouveller/enfant/enfants/somepage/'],
      ['https://example.com/fr/renouveller/00000000-0000-0000-0000-000000000000/enfant/enfants/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/fr/renouveller/enfant/enfants/somepage/'],
    ])('should remove the session id and child id path segments for %s when matching the renew child flow children route regex', (url, expectedUrl) => {
      const actual = transformChildChildrenRouteAdobeAnalyticsUrl(url);
      expect(actual).toEqual(new URL(expectedUrl));
    });
  });
});
