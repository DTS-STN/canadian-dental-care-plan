import { afterEach, describe, expect, it, vi } from 'vitest';

import { getEnv } from '~/utils/env.server';
import { getFixedT, getLocale, initI18n } from '~/utils/locale-utils.server';

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

  describe('getLocale()', () => {
    it('should return the locale from the URL if it exists', async () => {
      expect(await getLocale(new Request('http://localhost:3000/en/home'))).toEqual('en');
      expect(await getLocale(new Request('http://localhost:3000/fr/home'))).toEqual('fr');
    });

    it('should return the default locale if there is no locale in the URL', async () => {
      expect(await getLocale(new Request('http://localhost:3000/'))).toEqual('en');
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
