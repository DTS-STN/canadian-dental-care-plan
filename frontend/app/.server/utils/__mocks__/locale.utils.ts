import { vi } from 'vitest';

export function getFixedT() {
  return Promise.resolve(vi.fn((i18nKey: string) => i18nKey));
}

export function getLocale() {
  return 'en';
}
