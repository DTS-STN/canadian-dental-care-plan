import { type FlatNamespace, type Namespace, createInstance } from 'i18next';
import I18nextBrowserLanguageDetector from 'i18next-browser-languagedetector';
import I18NextHttpBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

import { type SwitchLanguageData } from '~/routes/api.switch-language';
import { getClientEnv } from '~/utils/env';

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
export function getNamespaces(routes?: { [routeId: string]: { i18nNamespaces?: Namespace } }) {
  if (routes === undefined) {
    return [];
  }

  const namespaces = Object.values(routes)
    .map((route) => route?.i18nNamespaces)
    .filter((i18nNamespaces): i18nNamespaces is Namespace => !!i18nNamespaces)
    .flatMap((i18nNamespaces) => i18nNamespaces);

  return [...new Set(namespaces)];
}

/**
 * Initializes the client instance of i18next.
 */
export async function initI18n(namespaces: Array<string>) {
  const { I18NEXT_DEBUG } = getClientEnv();
  const i18n = createInstance();

  await i18n
    .use(initReactI18next)
    .use(I18nextBrowserLanguageDetector)
    .use(I18NextHttpBackend)
    .init({
      appendNamespaceToMissingKey: true,
      debug: I18NEXT_DEBUG,
      detection: {
        order: ['htmlTag'],
      },
      fallbackLng: false,
      interpolation: {
        escapeValue: false,
      },
      ns: namespaces,
      react: {
        useSuspense: false,
      },
    });

  return i18n;
}

/**
 * Returns a tuple representing a typed list of namespaces.
 *
 * @template T - The primary namespace to include in the tuple.
 * @template T2 - Additional namespaces to include in the tuple. Should only contain distinct values.
 * @param ns - The primary namespace of type T.
 * @param rest - Additional namespaces of type T2 (should be distinct).
 * @returns A tuple containing the primary namespace and additional namespaces.
 *
 * @note Ensure that the values in the `rest` parameter are distinct to avoid duplicates in the resulting tuple.
 *
 * @example
 * // Usage example:
 * const result = getTypedI18nNs("common", "gcweb", "other");
 * // result is of type: readonly ["common", "gcweb", "other"]
 */
export function getTypedI18nNamespaces<const T extends Readonly<FlatNamespace>, const T2 extends ReadonlyArray<Exclude<FlatNamespace, T>>>(ns: T, ...rest: T2) {
  return [ns, ...rest] as const;
}

/**
 * Asynchronously switches the language using a language cookie.
 *
 * @template T - The type of language to switch to, which should be a subtype of `SwitchLanguageData['language']`.
 * @param {T} language - The language to switch to.
 * @returns {Promise<number>} A promise that resolves to the HTTP status code of the switch operation.
 *
 * @example
 * const statusCode = await switchLanguageCookie('en');
 * console.log(statusCode); // Output: 204
 *
 * @param {SwitchLanguageData['language']} language - The language to switch to.
 */
export async function switchLanguageCookie<T extends SwitchLanguageData['language']>(language: T) {
  const response = await fetch('/api/switch-language', {
    body: JSON.stringify({ language }),
    headers: { 'Content-Type': 'application/json' },
    method: 'PUT',
  });
  return response.status;
}
