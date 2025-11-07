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
  t: (key?: string | string[], options?: Record<string, unknown>) => {
    const i18nKey = Array.isArray(key) ? key.join('.') : key;
    return options ? JSON.stringify({ key: i18nKey, options }) : i18nKey;
  },
}));

/**
 * The vitest automock for react-i18next's Trans component.
 */
export const Trans = vi.fn(({ i18nKey }: { i18nKey: string }) => {
  return i18nKey;
});
