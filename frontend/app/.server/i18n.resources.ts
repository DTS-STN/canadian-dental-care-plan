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

type I18nResources = typeof i18nResourcesEn;

const i18nResourcesEn = {
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
} as const;

const i18nResourcesFr = {
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
} as const satisfies I18nResources;

export const i18nResources = {
  en: i18nResourcesEn,
  fr: i18nResourcesFr,
} as const;
