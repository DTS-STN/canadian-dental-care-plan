import applicationNewAdultEn from '~/../public/locales/en/application-new-adult.json';
import applicationNewChildEn from '~/../public/locales/en/application-new-child.json';
import applicationNewFamilyEn from '~/../public/locales/en/application-new-family.json';
import applicationRenewAdultEn from '~/../public/locales/en/application-renew-adult.json';
import applicationSpokesEn from '~/../public/locales/en/application-spokes.json';
import applicationEn from '~/../public/locales/en/application.json';
import applyAdultChildEn from '~/../public/locales/en/apply-adult-child.json';
import applyAdultEn from '~/../public/locales/en/apply-adult.json';
import applyChildEn from '~/../public/locales/en/apply-child.json';
import applyEn from '~/../public/locales/en/apply.json';
import commonEn from '~/../public/locales/en/common.json';
import dataUnavailableEn from '~/../public/locales/en/data-unavailable.json';
import documentsEn from '~/../public/locales/en/documents.json';
import gcwebEn from '~/../public/locales/en/gcweb.json';
import lettersEn from '~/../public/locales/en/letters.json';
import protectedApplyAdultChildEn from '~/../public/locales/en/protected-apply-adult-child.json';
import protectedApplyAdultEn from '~/../public/locales/en/protected-apply-adult.json';
import protectedApplyChildEn from '~/../public/locales/en/protected-apply-child.json';
import protectedApplyEn from '~/../public/locales/en/protected-apply.json';
import protectedProfileEn from '~/../public/locales/en/protected-profile.json';
import protectedRenewEn from '~/../public/locales/en/protected-renew.json';
import renewAdultChildEn from '~/../public/locales/en/renew-adult-child.json';
import renewAdultEn from '~/../public/locales/en/renew-adult.json';
import renewChildEn from '~/../public/locales/en/renew-child.json';
import renewItaEn from '~/../public/locales/en/renew-ita.json';
import renewEn from '~/../public/locales/en/renew.json';
import statusEn from '~/../public/locales/en/status.json';
import stubLoginEn from '~/../public/locales/en/stub-login.json';
import unableToProcessRequestEn from '~/../public/locales/en/unable-to-process-request.json';
import applicationNewAdultFr from '~/../public/locales/fr/application-new-adult.json';
import applicationNewChildFr from '~/../public/locales/fr/application-new-child.json';
import applicationNewFamilyFr from '~/../public/locales/fr/application-new-family.json';
import applicationRenewAdultFr from '~/../public/locales/fr/application-renew-adult.json';
import applicationSpokesFr from '~/../public/locales/fr/application-spokes.json';
import applicationFr from '~/../public/locales/fr/application.json';
import applyAdultChildFr from '~/../public/locales/fr/apply-adult-child.json';
import applyAdultFr from '~/../public/locales/fr/apply-adult.json';
import applyChildFr from '~/../public/locales/fr/apply-child.json';
import applyFr from '~/../public/locales/fr/apply.json';
import commonFr from '~/../public/locales/fr/common.json';
import dataUnavailableFr from '~/../public/locales/fr/data-unavailable.json';
import documentsFr from '~/../public/locales/fr/documents.json';
import gcwebFr from '~/../public/locales/fr/gcweb.json';
import lettersFr from '~/../public/locales/fr/letters.json';
import protectedApplyAdultChildFr from '~/../public/locales/fr/protected-apply-adult-child.json';
import protectedApplyAdultFr from '~/../public/locales/fr/protected-apply-adult.json';
import protectedApplyChildFr from '~/../public/locales/fr/protected-apply-child.json';
import protectedApplyFr from '~/../public/locales/fr/protected-apply.json';
import protectedProfileFr from '~/../public/locales/fr/protected-profile.json';
import protectedRenewFr from '~/../public/locales/fr/protected-renew.json';
import renewAdultChildFr from '~/../public/locales/fr/renew-adult-child.json';
import renewAdultFr from '~/../public/locales/fr/renew-adult.json';
import renewChildFr from '~/../public/locales/fr/renew-child.json';
import renewItaFr from '~/../public/locales/fr/renew-ita.json';
import renewFr from '~/../public/locales/fr/renew.json';
import statusFr from '~/../public/locales/fr/status.json';
import stubLoginFr from '~/../public/locales/fr/stub-login.json';
import unableToProcessRequestFr from '~/../public/locales/fr/unable-to-process-request.json';

type I18nResources = typeof i18nResourcesEn;

const i18nResourcesEn = {
  application: applicationEn,
  'application-spokes': applicationSpokesEn,
  'application-new-adult': applicationNewAdultEn,
  'application-new-child': applicationNewChildEn,
  'application-new-family': applicationNewFamilyEn,
  'application-renew-adult': applicationRenewAdultEn,
  'apply-adult-child': applyAdultChildEn,
  'apply-adult': applyAdultEn,
  'protected-apply-adult': protectedApplyAdultEn,
  'apply-child': applyChildEn,
  apply: applyEn,
  common: commonEn,
  'data-unavailable': dataUnavailableEn,
  documents: documentsEn,
  gcweb: gcwebEn,
  letters: lettersEn,
  'protected-apply': protectedApplyEn,
  'protected-apply-adult-child': protectedApplyAdultChildEn,
  'protected-apply-child': protectedApplyChildEn,
  'protected-renew': protectedRenewEn,
  'protected-profile': protectedProfileEn,
  'renew-adult-child': renewAdultChildEn,
  'renew-child': renewChildEn,
  'renew-ita': renewItaEn,
  'renew-adult': renewAdultEn,
  renew: renewEn,
  status: statusEn,
  'stub-login': stubLoginEn,
  'unable-to-process-request': unableToProcessRequestEn,
} as const;

const i18nResourcesFr = {
  application: applicationFr,
  'application-new-adult': applicationNewAdultFr,
  'application-new-child': applicationNewChildFr,
  'application-new-family': applicationNewFamilyFr,
  'application-renew-adult': applicationRenewAdultFr,
  'application-spokes': applicationSpokesFr,
  'apply-adult-child': applyAdultChildFr,
  'apply-adult': applyAdultFr,
  'protected-apply-adult': protectedApplyAdultFr,
  'apply-child': applyChildFr,
  apply: applyFr,
  common: commonFr,
  'data-unavailable': dataUnavailableFr,
  documents: documentsFr,
  gcweb: gcwebFr,
  letters: lettersFr,
  'protected-apply': protectedApplyFr,
  'protected-apply-adult-child': protectedApplyAdultChildFr,
  'protected-apply-child': protectedApplyChildFr,
  'protected-renew': protectedRenewFr,
  'protected-profile': protectedProfileFr,
  'renew-adult-child': renewAdultChildFr,
  'renew-child': renewChildFr,
  'renew-ita': renewItaFr,
  'renew-adult': renewAdultFr,
  renew: renewFr,
  status: statusFr,
  'stub-login': stubLoginFr,
  'unable-to-process-request': unableToProcessRequestFr,
} as const satisfies I18nResources;

export const i18nResources = {
  en: i18nResourcesEn,
  fr: i18nResourcesFr,
} as const;
