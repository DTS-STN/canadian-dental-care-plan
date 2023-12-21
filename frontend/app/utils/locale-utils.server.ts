import { parse } from 'cookie';
import { createInstance, type Namespace } from 'i18next';
import I18NexFsBackend from 'i18next-fs-backend';
import { resolve } from 'node:path';

export const langCookieName = '_gc_lang';

export const langCookieSerializeOptions = {
  // domain: undefined, // TODO :: GjB :: make configurable
  httpOnly: true, // TODO :: GjB :: make configurable
  path: '/', // TODO :: GjB :: make configurable
  maxAge: 50000000000000000,
};

/**
 * Returns a t function that defaults to the language resolved through the request.
 *
 * @param {Request} request - The request object.
 * @param {Namespace} namespaces - The namespace object (a string, array of strings, or null).
 */
export async function getFixedT<N extends Namespace>(request: Request, namespaces: N) {
  const i18n = createInstance();

  await i18n.use(I18NexFsBackend).init({
    backend: { loadPath: resolve('./public/locales/{{lng}}/{{ns}}.json') },
    fallbackLng: await getLocale(request),
    interpolation: { escapeValue: false },
    lng: await getLocale(request),
    ns: namespaces,
  });

  return i18n.getFixedT(null, null);
}

/**
 * Retrieves the locale using a deterministic lookup algorithm.
 *
 * @param {Request} request - The request to retrieve the locale from.
 */
export async function getLocale(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const searchParamsLang = searchParams.get('lang'); // TODO :: GjB :: make configurable

  if (searchParamsLang === 'en') {
    return 'en';
  }
  if (searchParamsLang === 'fr') {
    return 'fr';
  }

  //
  // no language found in URL; check cookie
  //
  const cookies = parse(request.headers.get('Cookie') ?? '');
  const lang = cookies[langCookieName];

  if (lang === 'en') {
    return 'en';
  }
  if (lang === 'fr') {
    return 'fr';
  }

  //
  // epic fail; no language detected
  //

  return undefined;
}
