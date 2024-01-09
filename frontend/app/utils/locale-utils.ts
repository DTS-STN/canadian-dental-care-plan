import { type Namespace, createInstance } from 'i18next';
import I18nextBrowserLanguageDetector from 'i18next-browser-languagedetector';
import I18NextHttpBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

import { type RouteHandle } from '~/types';

/**
 * Returns the alternate language for the given input language.
 * (ie: 'en' → 'fr'; 'fr' → 'en')
 */
export function getAltLanguage(language: string) {
  switch (language) {
    case 'en':
      return 'fr';
    case 'fr':
      return 'en';
    default:
      throw new Error(`Unexpected language: ${language}`);
  }
}

/**
 * Returns all namespaces required by the given routes by examining the route's i18nNamespaces handle property.
 * @see https://remix.run/docs/en/main/route/handle
 */
export function getNamespaces(routes: Array<{ handle?: unknown }>) {
  const routeHandles = routes.map((route) => route.handle).filter((handle): handle is RouteHandle => handle !== undefined);
  const i18nNamespaces = routeHandles.map((handle) => handle.i18nNamespaces).filter((i18nNamespaces): i18nNamespaces is Namespace => i18nNamespaces !== undefined);
  return [...new Set(i18nNamespaces.flatMap((i18nNamespace) => i18nNamespace))];
}

/**
 * Initializes the client instance of i18next.
 */
export async function initI18n(namespaces: Array<string>) {
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
