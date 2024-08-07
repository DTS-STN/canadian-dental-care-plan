import { afterEach, describe, expect, it, vi } from 'vitest';

import { getEnv } from '~/utils/env-utils.server';
import { getFixedT, getLocale, getLocaleFromParams, initI18n } from '~/utils/locale-utils.server';

vi.mock('~/utils/env-utils.server', () => ({
  getEnv: vi.fn(),
}));

vi.mock('~/utils/logging.server', () => ({
  getLogger: () => ({
    debug: vi.fn(),
  }),
}));

describe('locale-utils.server', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getLocale()', () => {
    it('should return the locale from the URL if it exists', () => {
      expect(getLocale(new Request('http://localhost:3000/en/home'))).toEqual('en');
      expect(getLocale(new Request('http://localhost:3000/fr/home'))).toEqual('fr');
    });

    it('should return the default locale if there is no locale in the URL', () => {
      expect(getLocale(new Request('http://localhost:3000/'))).toEqual('en');
    });
  });

  describe('getLocaleFromParams', () => {
    it('should return "en" when lang is "en"', () => {
      const params = { lang: 'en' };
      expect(getLocaleFromParams(params)).toBe('en');
    });

    it('should return "fr" when lang is "fr"', () => {
      const params = { lang: 'fr' };
      expect(getLocaleFromParams(params)).toBe('fr');
    });

    it('should return "en" when lang is unsupported', () => {
      const params = { lang: 'es' };
      expect(getLocaleFromParams(params)).toBe('en');
    });

    it('should return "en" when lang is undefined', () => {
      const params = {};
      expect(getLocaleFromParams(params)).toBe('en');
    });
  });

  describe('getFixedT<>()', () => {
    it('should return a t function that uses the detected language', async () => {
      vi.mocked(getEnv, { partial: true }).mockReturnValue({ I18NEXT_DEBUG: false });

      const t = await getFixedT(new Request('http://localhost:3000/'), ['gcweb']);

      // GjB :: not sure how else to test this 🤷
      expect(t).toBeDefined();
      expect(typeof t).toEqual('function');
    });
  });

  describe('initI18n<>()', () => {
    it('should initialize i18next with the correct options', async () => {
      vi.mocked(getEnv, { partial: true }).mockReturnValue({ I18NEXT_DEBUG: false });

      const i18n = await initI18n('en', ['gcweb']);

      // we only care that the init function respects our env and params
      // (ie: no need to test the statically-set values)
      expect(i18n.options.debug).toEqual(false);
      expect(i18n.options.lng).toEqual('en');
      expect(i18n.options.ns).toEqual(['gcweb']);
    });
  });
});
