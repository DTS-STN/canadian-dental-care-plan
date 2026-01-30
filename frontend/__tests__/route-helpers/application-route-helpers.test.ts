import { describe, expect, it } from 'vitest';

import { transformAdobeAnalyticsUrl, transformChildrenRouteAdobeAnalyticsUrl } from '~/route-helpers/application-route-helpers';

describe('application-route-helpers', () => {
  describe('transformAdobeAnalyticsUrl', () => {
    it.each([['https://example.com/'], ['https://example.com/en/'], ['https://example.com/fr/'], ['https://example.com/en/other/'], ['https://example.com/fr/autre/'], ['https://example.com/en/application'], ['https://example.com/fr/demande']])(
      'should return as is for %s when not matching the apply route regex',
      (url) => {
        const actual = transformAdobeAnalyticsUrl(url);
        expect(actual).toEqual(new URL(url));
      },
    );

    it.each([
      ['https://example.com/en/application/somepage/', 'https://example.com/en/application/'],
      ['https://example.com/fr/demande/somepage/', 'https://example.com/fr/demande/'],
      ['https://example.com/en/application/00000000-0000-0000-0000-000000000000/', 'https://example.com/en/application/'],
      ['https://example.com/fr/demande/00000000-0000-0000-0000-000000000000/', 'https://example.com/fr/demande/'],
      ['https://example.com/en/application/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/en/application/somepage/'],
      ['https://example.com/fr/demande/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/fr/demande/somepage/'],
      ['https://example.com/en/application/00000000-0000-0000-0000-000000000000/step/', 'https://example.com/en/application/step/'],
      ['https://example.com/fr/demande/00000000-0000-0000-0000-000000000000/etape/', 'https://example.com/fr/demande/etape/'],
    ])('should remove the third path segment (application/demande state id) for %s when matching the apply route regex', (url, expectedUrl) => {
      const actual = transformAdobeAnalyticsUrl(url);
      expect(actual).toEqual(new URL(expectedUrl));
    });

    it('should handle URL objects as input', () => {
      const url = new URL('https://example.com/en/application/00000000-0000-0000-0000-000000000000/somepage/');
      const actual = transformAdobeAnalyticsUrl(url);
      expect(actual).toEqual(new URL('https://example.com/en/application/somepage/'));
    });
  });

  describe('transformChildrenRouteAdobeAnalyticsUrl', () => {
    it.each([
      ['https://example.com/'],
      ['https://example.com/en/'],
      ['https://example.com/fr/'],
      ['https://example.com/en/application/'],
      ['https://example.com/fr/demande/'],
      ['https://example.com/en/application/00000000-0000-0000-0000-000000000000/'],
      ['https://example.com/fr/demande/00000000-0000-0000-0000-000000000000/'],
      ['https://example.com/en/application/00000000-0000-0000-0000-000000000000/other/'],
      ['https://example.com/fr/demande/00000000-0000-0000-0000-000000000000/autre/'],
    ])('should return as is for %s when not matching the application children route regex', (url) => {
      const actual = transformChildrenRouteAdobeAnalyticsUrl(url);
      expect(actual).toEqual(new URL(url));
    });

    it.each([
      ['https://example.com/en/application/00000000-0000-0000-0000-000000000000/children/00000000-0000-0000-0000-000000000000/', 'https://example.com/en/application/children/'],
      ['https://example.com/fr/demande/00000000-0000-0000-0000-000000000000/enfants/00000000-0000-0000-0000-000000000000/', 'https://example.com/fr/demande/enfants/'],
      ['https://example.com/en/application/00000000-0000-0000-0000-000000000000/children/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/en/application/children/somepage/'],
      ['https://example.com/fr/demande/00000000-0000-0000-0000-000000000000/enfants/00000000-0000-0000-0000-000000000000/somepage/', 'https://example.com/fr/demande/enfants/somepage/'],
      ['https://example.com/en/application/00000000-0000-0000-0000-000000000000/children/00000000-0000-0000-0000-000000000000/step/', 'https://example.com/en/application/children/step/'],
      ['https://example.com/fr/demande/00000000-0000-0000-0000-000000000000/enfants/00000000-0000-0000-0000-000000000000/etape/', 'https://example.com/fr/demande/enfants/etape/'],
      ['https://example.com/en/application/00000000-0000-0000-0000-000000000000/children/00000000-0000-0000-0000-000000000000/edit/123/', 'https://example.com/en/application/children/edit/123/'],
      ['https://example.com/fr/demande/00000000-0000-0000-0000-000000000000/enfants/00000000-0000-0000-0000-000000000000/modifier/123/', 'https://example.com/fr/demande/enfants/modifier/123/'],
    ])('should remove both application state id and children state id path segments for %s when matching the application children route regex', (url, expectedUrl) => {
      const actual = transformChildrenRouteAdobeAnalyticsUrl(url);
      expect(actual).toEqual(new URL(expectedUrl));
    });

    it('should handle URL objects as input', () => {
      const url = new URL('https://example.com/en/application/00000000-0000-0000-0000-000000000000/children/00000000-0000-0000-0000-000000000000/somepage/');
      const actual = transformChildrenRouteAdobeAnalyticsUrl(url);
      expect(actual).toEqual(new URL('https://example.com/en/application/children/somepage/'));
    });

    it('should handle case-insensitive matching', () => {
      const url = 'https://example.com/EN/APPLICATION/00000000-0000-0000-0000-000000000000/CHILDREN/00000000-0000-0000-0000-000000000000/';
      const actual = transformChildrenRouteAdobeAnalyticsUrl(url);
      expect(actual).toEqual(new URL('https://example.com/EN/APPLICATION/CHILDREN/'));
    });
  });
});
