import { type Cookie, createCookie } from '@remix-run/node';

import { parse, serialize } from 'cookie';
import { type InitOptions, type Namespace, createInstance } from 'i18next';
import I18NexFsBackend from 'i18next-fs-backend';
import { resolve } from 'node:path';
import { initReactI18next } from 'react-i18next';

import { getEnv } from '~/utils/environment.server';

/**
 * Creates a cookie object for the language.
 */
export function createLangCookie() {
  const cookieName = getEnv('LANG_COOKIE_NAME') ?? '_gc_lang';

  const cookieOptions = {
    domain: getEnv('LANG_COOKIE_DOMAIN'),
    httpOnly: getEnv('LANG_COOKIE_HTTP_ONLY') === 'true',
    path: getEnv('LANG_COOKIE_PATH') ?? '/',
    secure: getEnv('LANG_COOKIE_SECURE') === 'true',
  };

  // Remix will JSON.stringify() cookies by default; to prevent this, we supply custom parse() and serialize() functions
  const cookie = createCookie(cookieName, cookieOptions);
  cookie.parse = async (cookieHeader, parseOptions) => cookieHeader && parse(cookieHeader, { ...cookieOptions, ...parseOptions })[cookieName];
  cookie.serialize = async (value, serializeOptions) => serialize(cookieName, value, { ...cookieOptions, ...serializeOptions });

  return cookie;
}

/**
 * Returns a t function that defaults to the language resolved through the request.
 *
 * @param {Request} request - The request object.
 * @param {Namespace} namespaces - The namespace object (a string, array of strings, or null).
 */
export async function getFixedT<N extends Namespace>(request: Request, namespaces: N, options?: Omit<InitOptions, 'react'>) {
  const i18n = createInstance(options);

  await i18n.use(I18NexFsBackend).init({
    backend: { loadPath: resolve('./public/locales/{{lng}}/{{ns}}.json') },
    fallbackLng: false,
    interpolation: { escapeValue: false },
    lng: await getLocale(request),
    ns: namespaces,
  });

  // see https://www.i18next.com/overview/api#getfixedt
  return i18n.getFixedT(null, null);
}

/**
 * Retrieves the locale using a deterministic lookup algorithm.
 *
 * @param {Request} request - The request to retrieve the locale from.
 */
export async function getLocale(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const searchParamsLang = searchParams.get(getEnv('LANG_PARAM') ?? 'lang');

  if (searchParamsLang === 'en') {
    return 'en';
  }

  if (searchParamsLang === 'fr') {
    return 'fr';
  }

  //
  // no language found in URL; check cookie
  //

  const langCookie = createLangCookie();
  const lang = await langCookie.parse(request.headers.get('Cookie'));

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

/**
 * Initializes the server instance of i18next.
 */
export async function initI18n(locale: string, namespaces: string[]) {
  const i18n = createInstance();

  await i18n
    .use(initReactI18next)
    .use(I18NexFsBackend)
    .init({
      backend: { loadPath: resolve('./public/locales/{{lng}}/{{ns}}.json') },
      fallbackLng: false,
      interpolation: { escapeValue: false },
      lng: locale,
      ns: namespaces,
    });

  return i18n;
}
