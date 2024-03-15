import { useLocation } from '@remix-run/react';

import { removeLanguageFromPath } from '~/utils/locale-utils';

/**
 * Custom hook to generate a canonical URL based on the current location and language.
 * @param origin - The origin URL. For more information on the origin URL, see {@link https://developer.mozilla.org/en-US/docs/Web/API/URL/origin}.
 * @returns The canonical URL.
 */
export function useCanonicalURL(origin: string) {
  const { pathname, search } = useLocation();

  const url = new URL(pathname, origin);
  url.search = new URLSearchParams(search).toString();

  return url.toString();
}

/**
 * Custom hook to generate alternate language URLs based on the current location.
 * @param origin - The origin URL. For more information on the origin URL, see {@link https://developer.mozilla.org/en-US/docs/Web/API/URL/origin}.
 * @returns An array of objects containing the hreflang and href for alternate language URLs.
 */
export function useAlternateLanguages(origin: string, languages: Array<string> = ['en', 'fr']) {
  const { pathname, search } = useLocation();
  const pathWithoutLang = removeLanguageFromPath(pathname);

  return languages.map((lang) => {
    const url = new URL(`/${lang}${pathWithoutLang}`, origin);
    url.search = new URLSearchParams(search).toString();
    return { href: url.toString(), hrefLang: lang };
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
