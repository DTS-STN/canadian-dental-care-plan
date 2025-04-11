import { describe, expect, it } from 'vitest';

import { transformAdobeAnalyticsUrl, transformAdultChildChildrenRouteAdobeAnalyticsUrl, transformChildChildrenRouteAdobeAnalyticsUrl } from '~/route-helpers/protected-apply-route-helpers';

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

  describe('transformAdultChildChildrenRouteAdobeAnalyticsUrl', () => {
    it.each([
      ['https://example.com/en/'],
      ['https://example.com/fr/'],
      ['https://example.com/en/apply'],
      ['https://example.com/fr/demander'],
      ['https://example.com/en/protected/apply/00000000-0000-0000-0000-000000000000/somepage/'],
      ['https://example.com/en/protege/demander/00000000-0000-0000-0000-000000000000/somepage/'],
    ])('should return as is for %s when not matching the protected adult-child children route regex', (url) => {
      const actual = transformAdultChildChildrenRouteAdobeAnalyticsUrl(url);
      expect(actual).toEqual(new URL(url));
    });

    it.each([
      ['https://example.com/en/protected/apply/00000000-0000-0000-0000-000000000000/adult-child/children/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/en/protected/apply/adult-child/children/somepage/'],
      ['https://example.com/fr/protected/apply/00000000-0000-0000-0000-000000000000/adult-child/children/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/fr/protected/apply/adult-child/children/somepage/'],
      ['https://example.com/en/protege/demander/00000000-0000-0000-0000-000000000000/adulte-enfant/enfants/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/en/protege/demander/adulte-enfant/enfants/somepage/'],
      ['https://example.com/fr/protege/demander/00000000-0000-0000-0000-000000000000/adulte-enfant/enfants/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/fr/protege/demander/adulte-enfant/enfants/somepage/'],
    ])('should remove the session id path segment for %s when matching the protected adult-child children route regex', (url, expectedUrl) => {
      const actual = transformAdultChildChildrenRouteAdobeAnalyticsUrl(url);
      expect(actual).toEqual(new URL(expectedUrl));
    });
  });

  describe('transformChildChildrenRouteAdobeAnalyticsUrl', () => {
    it.each([
      ['https://example.com/en/'],
      ['https://example.com/fr/'],
      ['https://example.com/en/apply'],
      ['https://example.com/fr/demander'],
      ['https://example.com/en/protected/apply/00000000-0000-0000-0000-000000000000/somepage/'],
      ['https://example.com/en/protege/demander/00000000-0000-0000-0000-000000000000/somepage/'],
    ])('should return as is for %s when not matching the protected apply child children route regex', (url) => {
      const actual = transformChildChildrenRouteAdobeAnalyticsUrl(url);
      expect(actual).toEqual(new URL(url));
    });

    it.each([
      ['https://example.com/en/protected/apply/00000000-0000-0000-0000-000000000000/child/children/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/en/protected/apply/child/children/somepage/'],
      ['https://example.com/fr/protected/apply/00000000-0000-0000-0000-000000000000/child/children/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/fr/protected/apply/child/children/somepage/'],
      ['https://example.com/en/protege/demander/00000000-0000-0000-0000-000000000000/enfant/enfants/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/en/protege/demander/enfant/enfants/somepage/'],
      ['https://example.com/fr/protege/demander/00000000-0000-0000-0000-000000000000/enfant/enfants/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/fr/protege/demander/enfant/enfants/somepage/'],
    ])('should remove the session id path segment for %s when matching the protected apply child children route regex', (url, expectedUrl) => {
      const actual = transformChildChildrenRouteAdobeAnalyticsUrl(url);
      expect(actual).toEqual(new URL(expectedUrl));
    });
  });
});
