import type { Params } from '@remix-run/react';

import type { Namespace } from 'i18next';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import addressValidationEn from '~/../public/locales/en/address-validation.json';
import applyAdultChildEn from '~/../public/locales/en/apply-adult-child.json';
import applyAdultEn from '~/../public/locales/en/apply-adult.json';
import applyChildEn from '~/../public/locales/en/apply-child.json';
import applyEn from '~/../public/locales/en/apply.json';
import dataUnavailableEn from '~/../public/locales/en/data-unavailable.json';
import gcwebEn from '~/../public/locales/en/gcweb.json';
import indexEn from '~/../public/locales/en/index.json';
import lettersEn from '~/../public/locales/en/letters.json';
import protectedRenewEn from '~/../public/locales/en/protected-renew.json';
import renewAdultChildEn from '~/../public/locales/en/renew-adult-child.json';
import renewChildEn from '~/../public/locales/en/renew-child.json';
import renewItaEn from '~/../public/locales/en/renew-ita.json';
import renewEn from '~/../public/locales/en/renew.json';
import statusEn from '~/../public/locales/en/status.json';
import stubLoginEn from '~/../public/locales/en/stub-login.json';
import unableToProcessRequestEn from '~/../public/locales/en/unable-to-process-request.json';
import addressValidationFr from '~/../public/locales/fr/address-validation.json';
import applyAdultChildFr from '~/../public/locales/fr/apply-adult-child.json';
import applyAdultFr from '~/../public/locales/fr/apply-adult.json';
import applyChildFr from '~/../public/locales/fr/apply-child.json';
import applyFr from '~/../public/locales/fr/apply.json';
import dataUnavailableFr from '~/../public/locales/fr/data-unavailable.json';
import gcwebFr from '~/../public/locales/fr/gcweb.json';
import indexFr from '~/../public/locales/fr/index.json';
import lettersFr from '~/../public/locales/fr/letters.json';
import protectedRenewFr from '~/../public/locales/fr/protected-renew.json';
import renewAdultChildFr from '~/../public/locales/fr/renew-adult-child.json';
import renewChildFr from '~/../public/locales/fr/renew-child.json';
import renewItaFr from '~/../public/locales/fr/renew-ita.json';
import renewFr from '~/../public/locales/fr/renew.json';
import statusFr from '~/../public/locales/fr/status.json';
import stubLoginFr from '~/../public/locales/fr/stub-login.json';
import unableToProcessRequestFr from '~/../public/locales/fr/unable-to-process-request.json';
import { getEnv } from '~/.server/utils/env.utils';
import { getLogger } from '~/.server/utils/logging.utils';
import { APP_LOCALES } from '~/utils/locale-utils';

export const i18nResources = {
  en: {
    'address-validation': addressValidationEn,
    'apply-adult-child': applyAdultChildEn,
    'apply-adult': applyAdultEn,
    'apply-child': applyChildEn,
    apply: applyEn,
    'data-unavailable': dataUnavailableEn,
    gcweb: gcwebEn,
    index: indexEn,
    letters: lettersEn,
    'protected-renew': protectedRenewEn,
    'renew-adult-child': renewAdultChildEn,
    'renew-child': renewChildEn,
    'renew-ita': renewItaEn,
    renew: renewEn,
    status: statusEn,
    'stub-login': stubLoginEn,
    'unable-to-process-request': unableToProcessRequestEn,
  },
  fr: {
    'address-validation': addressValidationFr,
    'apply-adult-child': applyAdultChildFr,
    'apply-adult': applyAdultFr,
    'apply-child': applyChildFr,
    apply: applyFr,
    'data-unavailable': dataUnavailableFr,
    gcweb: gcwebFr,
    index: indexFr,
    letters: lettersFr,
    'protected-renew': protectedRenewFr,
    'renew-adult-child': renewAdultChildFr,
    'renew-child': renewChildFr,
    'renew-ita': renewItaFr,
    renew: renewFr,
    status: statusFr,
    'stub-login': stubLoginFr,
    'unable-to-process-request': unableToProcessRequestFr,
  },
};

/**
 * Returns a t function that defaults to the language resolved through the request.
 * @see https://www.i18next.com/overview/api#getfixedt
 */
export async function getFixedT<N extends Namespace>(localeOrRequest: AppLocale | Request, namespaces: N) {
  const locale = typeof localeOrRequest === 'string' ? localeOrRequest : getLocale(localeOrRequest);
  const i18n = await initI18n(locale, namespaces);
  return i18n.getFixedT(locale, namespaces);
}

/**
 * Extracts and returns the locale from the provided request URL.
 *
 * This function analyzes the pathname of the given `request` URL to determine the locale. It supports
 * English (`'en'`) and French (`'fr'`). If the pathname does not start with `/en` or `/fr`, the function
 * defaults to English (`'en'`).
 *
 * @param request - The HTTP request object containing the URL from which to extract the locale.
 * @returns The detected locale, either `'en'` or `'fr'`. Defaults to `'en'` if no valid locale is found.
 */
export function getLocale(request: Request): AppLocale {
  const log = getLogger('locale-utils.server/getLocale');
  const { pathname } = new URL(request.url);

  if (pathname.startsWith('/en')) {
    log.debug('Locale [en] detected in URL; pathname: [%s]', pathname);
    return 'en';
  }

  if (pathname.startsWith('/fr')) {
    log.debug('Locale [fr] detected in URL; pathname: [%s]', pathname);
    return 'fr';
  }

  log.debug('No locale detected in URL; returning default [en]; pathname: [%s]', pathname);
  return 'en';
}

/**
 * Extracts and returns the locale from the provided parameters.
 *
 * This function checks the `lang` property in the given `params` object to determine the locale to use.
 * It supports English (`'en'`) and French (`'fr'`). If the `lang` property is not recognized or is
 * not provided, the function defaults to English (`'en'`).
 *
 * @param params - The parameters object containing the `lang` property.
 * @returns The detected locale, either `'en'` or `'fr'`. Defaults to `'en'` if no valid locale is found.
 */
export function getLocaleFromParams(params: Params): AppLocale {
  const log = getLogger('locale-utils.server/getLocaleFromParams');
  const lang = params.lang;

  if (lang === 'en') {
    log.debug("Locale [en] detected in 'lang' param; lang: [%s]", lang);
    return 'en';
  }

  if (lang === 'fr') {
    log.debug("Locale [fr] detected in 'lang' param; lang: [%s]", lang);
    return 'fr';
  }

  log.debug("No locale detected in 'lang' param; returning default [en]; lang: [%s]", lang);
  return 'en';
}

/**
 * Initializes the server instance of i18next.
 * @see https://www.i18next.com/overview/api#createinstance
 */
export async function initI18n<N extends Namespace>(locale: string | undefined, namespaces: N) {
  const log = getLogger('locale-utils.server/initI18n');
  const { I18NEXT_DEBUG } = getEnv();
  const i18n = createInstance();

  await i18n.use(initReactI18next).init({
    appendNamespaceToMissingKey: true,
    debug: I18NEXT_DEBUG,
    defaultNS: false,
    fallbackLng: false,
    interpolation: { escapeValue: false },
    lng: locale,
    ns: namespaces,
    preload: APP_LOCALES,
    react: { useSuspense: false },
    resources: i18nResources,
  });

  log.debug('i18next initialization complete');
  return i18n;
}
