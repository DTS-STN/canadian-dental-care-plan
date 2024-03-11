import { useLocation } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { getClientEnv } from '~/utils/env-utils';
import { useI18nNamespaces } from '~/utils/route-utils';

/**
 * Custom hook to generate a canonical URL based on the current location and language.
 * @param origin - The origin URL. For more information on the origin URL, see {@link https://developer.mozilla.org/en-US/docs/Web/API/URL/origin}.
 * @returns The canonical URL.
 */
export function useCanonicalURL(origin: string) {
  const { LANG_QUERY_PARAM } = getClientEnv();
  const location = useLocation();
  const ns = useI18nNamespaces();
  const { i18n } = useTranslation(ns);

  const url = new URL(`${origin}${location.pathname}`);
  new URLSearchParams(location.search).forEach((value, name) => {
    url.searchParams.set(name, value);
  });

  // add lang query if pathname not root
  if (url.pathname !== '/') {
    url.searchParams.set(LANG_QUERY_PARAM, i18n.language);
  }

  return url.toString();
}

/**
 * Custom hook to generate alternate language URLs based on the current location.
 * @param origin - The origin URL. For more information on the origin URL, see {@link https://developer.mozilla.org/en-US/docs/Web/API/URL/origin}.
 * @returns An array of objects containing the hreflang and href for alternate language URLs.
 */
export function useAlternateLanguages(origin: string, languages: Array<string> = ['en', 'fr']) {
  const { LANG_QUERY_PARAM } = getClientEnv();
  const location = useLocation();

  const baseUrl = new URL(`${origin}${location.pathname}`);
  new URLSearchParams(location.search).forEach((value, name) => {
    baseUrl.searchParams.set(name, value);
  });

  return languages.map((lang) => {
    const url = new URL(baseUrl);
    url.searchParams.set(LANG_QUERY_PARAM, lang);
    return {
      href: url.toString(),
      hrefLang: lang,
    };
  });
}

/**
 * Generates meta tags for title.
 * @param title - The title to be included in meta tags.
 * @returns An array of meta tag objects.
 */
export function getTitleMetaTags(title: string) {
  return [{ title: title }, { property: 'og:title', content: title }];
}

/**
 * Generates meta tags for description.
 * @param description - The description to be included in meta tags.
 * @returns An array of meta tag objects.
 */
export function getDescriptionMetaTags(description: string) {
  return [
    { name: 'description', content: description },
    { property: 'og:description', content: description },
  ];
}
