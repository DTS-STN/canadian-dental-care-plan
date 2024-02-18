import { afterEach, describe, expect, it, vi } from 'vitest';

import { getEnv } from '~/utils/env.server';
import { createLangCookie, getFixedT, getLocale, initI18n } from '~/utils/locale-utils.server';

vi.mock('~/utils/env.server', () => ({
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

  describe('createLangCookie()', () => {
    it('should create a cookie with the correct name', () => {
      vi.mocked(getEnv, { partial: true }).mockReturnValue({ LANG_COOKIE_NAME: 'lang' });

      const langCookie = createLangCookie();

      expect(langCookie.name).toEqual('lang');
    });

    it('should create a cookie that can correctly parse request headers', async () => {
      vi.mocked(getEnv, { partial: true }).mockReturnValue({ LANG_COOKIE_NAME: 'lang' });

      const langCookie = createLangCookie();
      const parsedLangCookie = await langCookie.parse('lang=en');

      expect(parsedLangCookie).toEqual('en');
    });

    it('should create a cookie that can correctly serialize itself', async () => {
      vi.mocked(getEnv, { partial: true }).mockReturnValue({
        LANG_COOKIE_NAME: 'lang',
        LANG_COOKIE_DOMAIN: 'example.com',
        LANG_COOKIE_PATH: '/',
        LANG_COOKIE_HTTP_ONLY: true,
        LANG_COOKIE_SAME_SITE: 'strict',
        LANG_COOKIE_SECURE: true,
      });

      const langCookie = createLangCookie();
      const serializedLangCookie = await langCookie.serialize('fr');

      expect(serializedLangCookie).toMatch(/lang=fr; Domain=example.com; Path=\/; Expires=(.+); HttpOnly; Secure/);
    });
  });

  describe('getLocale()', () => {
    it('should return the locale from the URL search params if it exists', async () => {
      vi.mocked(getEnv, { partial: true }).mockReturnValue({ LANG_QUERY_PARAM: 'lang' });

      expect(await getLocale(new Request('http://localhost:3000/?lang=en'))).toEqual('en');
      expect(await getLocale(new Request('http://localhost:3000/?lang=fr'))).toEqual('fr');
    });

    it('should return the locale from the cookies if it exists and is not in search params', async () => {
      vi.mocked(getEnv, { partial: true }).mockReturnValue({ LANG_COOKIE_NAME: 'lang' });

      const enHeaders = { Cookie: 'lang=en' };
      const frHeaders = { Cookie: 'lang=fr' };

      expect(await getLocale(new Request('http://localhost:3000/', { headers: enHeaders }))).toEqual('en');
      expect(await getLocale(new Request('http://localhost:3000/', { headers: frHeaders }))).toEqual('fr');
    });

    it('should return the default locale if there is no locale in the URL search params or cookies', async () => {
      expect(await getLocale(new Request('http://localhost:3000/'))).toEqual('en');
    });
  });

  describe('getFixedT<>()', () => {
    it('should return a t function that uses the detected language', async () => {
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
