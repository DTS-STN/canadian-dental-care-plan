import { type UNSAFE_RouteModules as RouteModules } from '@remix-run/react';

import { createInstance } from 'i18next';
import I18nextBrowserLanguageDetector from 'i18next-browser-languagedetector';
import I18NextHttpBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

/**
 * Returns all namespaces required by the given routes by examining the route's i18nNamespaces handle property.
 *
 * @param {RouteModules} routeModules - Object containing route modules
 * @see https://remix.run/docs/en/main/route/handle
 */
export function getNamespaces(routeModules: RouteModules) {
  const namespaces = new Set(
    Object.values(routeModules)
      .filter((route) => (route.handle as { i18nNamespaces: string })?.i18nNamespaces !== undefined)
      .flatMap((route) => (route.handle as { i18nNamespaces: string }).i18nNamespaces),
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
