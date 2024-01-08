import { type Namespace, createInstance } from 'i18next';
import I18nextBrowserLanguageDetector from 'i18next-browser-languagedetector';
import I18NextHttpBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

import { type RouteHandle } from '~/types';

/**
 * Returns all namespaces required by the given routes by examining the route's i18nNamespaces handle property.
 *
 * @param {RouteModules} routeModules - Object containing route modules
 * @see https://remix.run/docs/en/main/route/handle
 */
export function getNamespaces(routeModules: Record<string, { handle?: unknown }>) {
  const namespaces = new Set(
    Object.values(routeModules)
      .map((route) => route.handle)
      .filter((handle): handle is RouteHandle => handle !== undefined)
      .map((handle) => handle.i18nNamespaces)
      .filter((i18nNamespaces): i18nNamespaces is Namespace => i18nNamespaces !== undefined)
      .flatMap((i18nNamespaces) => i18nNamespaces),
  );

  return [...namespaces];
}

/**
 * Initializes the client instance of i18next.
 */
export async function initI18n(namespaces: string[]) {
  const i18n = createInstance();

  await i18n
    .use(initReactI18next)
    .use(I18nextBrowserLanguageDetector)
    .use(I18NextHttpBackend)
    .init({
      detection: { order: ['htmlTag'] },
      fallbackLng: false,
      interpolation: { escapeValue: false },
      ns: namespaces,
      react: { useSuspense: false },
    });

  return i18n;
}
