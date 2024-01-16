import { createCookie } from '@remix-run/node';

import { parse, serialize } from 'cookie';
import { type Namespace, createInstance } from 'i18next';
import I18NexFsBackend from 'i18next-fs-backend';
import { resolve } from 'node:path';
import { initReactI18next } from 'react-i18next';

import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('locale-utils.server');

/**
 * Creates a cookie object for the language.
 */
export function createLangCookie() {
  const env = getEnv();

  const cookieName = env.LANG_COOKIE_NAME;

  const cookieOptions = {
    domain: env.LANG_COOKIE_DOMAIN,
    httpOnly: env.LANG_COOKIE_HTTP_ONLY,
    path: env.LANG_COOKIE_PATH,
    secure: env.LANG_COOKIE_SECURE,
  };

  const cookie = createCookie(cookieName, cookieOptions);
  log.debug(`Created language cookie [${cookieName}] with options: [${JSON.stringify(cookieOptions)}]`);

  // Remix will JSON.stringify() cookies by default; to prevent this, we supply custom parse() and serialize() functions
  cookie.parse = async (cookieHeader, parseOptions) => cookieHeader && parse(cookieHeader, { ...cookieOptions, ...parseOptions })[cookieName];
  cookie.serialize = async (value, serializeOptions) => serialize(cookieName, value, { ...cookieOptions, ...serializeOptions });

  return cookie;
}

/**
 * Returns a t function that defaults to the language resolved through the request.
 * @see https://www.i18next.com/overview/api#getfixedt
 */
export async function getFixedT<N extends Namespace>(request: Request, namespaces: N) {
  const locale = await getLocale(request);
  const i18n = await initI18n(locale, namespaces);
  return i18n.getFixedT(locale ?? null, namespaces);
}

/**
 * Retrieves the locale using a deterministic lookup algorithm (URL → cookies → 🤷).
 */
export async function getLocale(request: Request) {
  const env = getEnv();

  const searchParams = new URL(request.url).searchParams;
  const searchParamsLang = searchParams.get(env.LANG_QUERY_PARAM);

  if (searchParamsLang === 'en') {
    log.debug('Locale [en] detected in URL search params');
    return 'en';
  }

  if (searchParamsLang === 'fr') {
    log.debug('Locale [fr] detected in URL search params');
    return 'fr';
  }

  log.debug('No locale detected in URL search params; checking cookies');

  const langCookie = createLangCookie();
  const lang = await langCookie.parse(request.headers.get('Cookie'));

  if (lang === 'en') {
    log.debug('Locale [en] detected cookies');
    return 'en';
  }

  if (lang === 'fr') {
    log.debug('Locale [fr] detected cookies');
    return 'fr';
  }

  log.debug('Epic fail: no locale detected in URL search params or cookies; returning default [en]');
  return 'en';
}

/**
 * Initializes the server instance of i18next.
 * @see https://www.i18next.com/overview/api#createinstance
 */
export async function initI18n<N extends Namespace>(locale: string | undefined, namespaces: N) {
  const { I18NEXT_DEBUG } = getEnv();
  const i18n = createInstance();

  await i18n
    .use(initReactI18next)
    .use(I18NexFsBackend)
    .init({
      appendNamespaceToMissingKey: true,
      debug: I18NEXT_DEBUG,
      backend: {
        loadPath: resolve('./public/locales/{{lng}}/{{ns}}.json'),
      },
      fallbackLng: false,
      interpolation: {
        escapeValue: false,
      },
      lng: locale,
      ns: namespaces,
    });

  log.debug('i18next initialization complete');
  return i18n;
}
