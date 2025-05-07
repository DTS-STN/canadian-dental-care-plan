import { vi } from 'vitest';

/**
 * The vitest automock for react-i18next's useTranslation() hook.
 */
export const useTranslation = vi.fn(() => ({
  i18n: {
    getFixedT: (lang: string) => {
      return (key: string) => key;
    },
  },
  t: (key: string) => key,
}));
