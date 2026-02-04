import type { FlatNamespace, LanguageDetectorModule, TOptions, i18n } from 'i18next';
import { createInstance } from 'i18next';
import I18NextHttpBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

import { getClientEnv } from '~/utils/env-utils';
import type { ParsedKeysByNamespaces, RouteHandleData } from '~/utils/route-utils';
import { i18nNamespacesSchema } from '~/utils/route-utils';

/**
 * A constant array representing the supported application locales.
 * `as const` ensures that the array is treated as a tuple of literal types `'en'` and `'fr'`.
 */
export const APP_LOCALES = ['en', 'fr'] as const;

/**
 * Checks if a given value is a valid application locale.
 *
 * @param value - The value to check, which can be of any type.
 * @returns `true` if the value is a valid `AppLocale`, otherwise `false`.
 *
 * @example
 * ```
 * isAppLocale('en'); // true
 * isAppLocale('fr'); // true
 * isAppLocale('es'); // false
 * isAppLocale(123);  // false
 * ```
 */
export function isAppLocale(value: unknown): value is AppLocale {
  if (typeof value !== 'string') return false;
  return APP_LOCALES.includes(value as AppLocale);
}

/**
 * Returns the alternate language for the given input language.
 * (ie: 'en' → 'fr'; 'fr' → 'en')
 */
export function getAltLanguage(language: string): AppLocale {
  switch (language) {
    case 'en': {
      return 'fr';
    }
    case 'fr': {
      return 'en';
    }
    default: {
      throw new Error(`Could not determine altLanguage for language: ${language}.`);
    }
  }
}

/**
 * Extracts the language code from a given resource.
 *
 * @param resource - The resource to extract the language from.
 * @returns The language code ('en' or 'fr') if found, otherwise undefined.
 * @throws {Error} If the language code cannot be determined.
 */
export function getLanguage(resource: Request | URL | string): AppLocale {
  switch (true) {
    case resource instanceof Request: {
      return getLanguageFromPathname(new URL(resource.url).pathname);
    }

    case resource instanceof URL: {
      return getLanguageFromPathname(resource.pathname);
    }

    default: {
      return getLanguageFromPathname(resource);
    }
  }
}

function getLanguageFromPathname(pathname: string): AppLocale {
  switch (true) {
    case pathname === '/en' || pathname.startsWith('/en/'): {
      return 'en';
    }

    case pathname === '/fr' || pathname.startsWith('/fr/'): {
      return 'fr';
    }

    default: {
      throw new Error(`Could not determine language for pathname: ${pathname}.`);
    }
  }
}

/**
 * Returns all namespaces required by the given routes by examining the route's i18nNamespaces handle property.
 * @see https://remix.run/docs/en/main/route/handle
 */
export function getNamespaces(routes?: ({ handle?: unknown } | undefined)[]) {
  if (routes === undefined) {
    return [];
  }

  const namespaces = routes
    .map((route) => route?.handle as RouteHandleData | undefined)
    .map((handle) => i18nNamespacesSchema.safeParse(handle?.i18nNamespaces))
    .flatMap((result) => (result.success ? result.data : undefined))
    .filter((i18nNamespaces) => i18nNamespaces !== undefined);

  return [...new Set(namespaces)];
}

/**
 * Initializes the client instance of i18next.
 */
export async function initI18n(namespaces: Array<string>) {
  const { BUILD_REVISION, I18NEXT_DEBUG } = getClientEnv();
  const i18n = createInstance();

  const languageDetector = {
    type: 'languageDetector',
    detect: () => document.documentElement.lang,
  } satisfies LanguageDetectorModule;

  await i18n
    .use(initReactI18next)
    .use(languageDetector)
    .use(I18NextHttpBackend)
    .init({
      appendNamespaceToMissingKey: true,
      backend: { loadPath: `/api/locales/{{lng}}/{{ns}}?v=${BUILD_REVISION}` },
      debug: I18NEXT_DEBUG,
      defaultNS: 'common',
      fallbackLng: false,
      interpolation: {
        escapeValue: false,
      },
      ns: namespaces,
      preload: APP_LOCALES,
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
 * Returns translation based off provided locale
 *
 * @returns either the english translation or the french translation.
 */
export function getNameByLanguage<T extends { nameEn: string; nameFr: string } | { nameEn?: string; nameFr?: string }>(language: string, obj: T): T extends { nameEn: infer N; nameFr: infer F } ? (typeof language extends 'fr' ? F : N) : never {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (language === 'fr' ? obj.nameFr : obj.nameEn) as any;
}

/**
 * Indiscriminately removes the language from a path.
 */
export function removeLanguageFromPath(path: string) {
  return path.replace(/^(\/en|\/fr)/, '');
}

/**
 * Determines the application locale based on the input string.
 *
 * @param locale - The locale string to evaluate.
 * @returns The application locale ('en' or 'fr').
 *
 * @example
 * // Returns 'en'
 * useAppLocale('en');
 *
 * @example
 * // Returns 'fr'
 * useAppLocale('fr');
 *
 * @example
 * // Returns 'en' for unsupported locale
 * useAppLocale('es');
 */
export function useAppLocale(locale: string): AppLocale {
  return locale === 'fr' ? 'fr' : 'en';
}

/**
 * Type-safe wrapper around i18next’s `t` function that accepts a namespaced key
 * and resolves its namespace(s) before translation.
 *
 * This helper extracts the base key and namespace(s) from a composed key
 * (e.g. `common:app-title`) and forwards them to `i18n.t`, preserving strong
 * typing for both the key and the options.
 *
 * @typeParam TOpt - The i18next options type associated with the translation key.
 * @param i18n - The i18next instance to use for translation.
 * @param key - A composed translation key including its namespace (for example: `common:app-title`).
 * @param options - Optional i18next translation options.
 * @returns The resolved translated string.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export function translateFromKey<TOpt extends TOptions = {}>(i18n: i18n, key: ParsedKeysByNamespaces<TOpt>, options?: TOpt): string {
  // @ts-expect-error `translator` and `extractFromKey` are internal i18next APIs
  // and are not exposed in the public TypeScript typings.
  // See: https://github.com/i18next/i18next/blob/15ea4575a07378a0cdb0cc66e7ca42de5d5256e5/i18next.js#L491
  const extractedKey = i18n.translator.extractFromKey(key, i18n.options) as { key: string; namespaces: string[] };

  // @ts-expect-error TypeScript cannot reconcile `i18n.t` overloads when the key
  // is dynamically derived from `extractFromKey`, even though the runtime call is valid.
  return i18n.t(($) => $[extractedKey.key], { ...options, ns: extractedKey.namespaces });
}
