import applicationEn from '~/.server/locales/en/application';
import applicationFullAdultEn from '~/.server/locales/en/application-full-adult';
import applicationFullChildEn from '~/.server/locales/en/application-full-child';
import applicationFullFamilyEn from '~/.server/locales/en/application-full-family';
import applicationSimplifiedAdultEn from '~/.server/locales/en/application-simplified-adult';
import applicationSimplifiedChildEn from '~/.server/locales/en/application-simplified-child';
import applicationSimplifiedFamilyEn from '~/.server/locales/en/application-simplified-family';
import applicationSpokesEn from '~/.server/locales/en/application-spokes';
import commonEn from '~/.server/locales/en/common';
import dataUnavailableEn from '~/.server/locales/en/data-unavailable';
import documentsEn from '~/.server/locales/en/documents';
import gcwebEn from '~/.server/locales/en/gcweb';
import lettersEn from '~/.server/locales/en/letters';
import protectedApplicationEn from '~/.server/locales/en/protected-application';
import protectedApplicationIntakeAdultEn from '~/.server/locales/en/protected-application-intake-adult';
import protectedApplicationIntakeChildEn from '~/.server/locales/en/protected-application-intake-child';
import protectedApplicationIntakeFamilyEn from '~/.server/locales/en/protected-application-intake-family';
import protectedApplicationRenewalAdultEn from '~/.server/locales/en/protected-application-renewal-adult';
import protectedApplicationRenewalChildEn from '~/.server/locales/en/protected-application-renewal-child';
import protectedApplicationRenewalFamilyEn from '~/.server/locales/en/protected-application-renewal-family';
import protectedApplicationSpokesEn from '~/.server/locales/en/protected-application-spokes';
import protectedProfileEn from '~/.server/locales/en/protected-profile';
import statusEn from '~/.server/locales/en/status';
import stubLoginEn from '~/.server/locales/en/stub-login';
import unableToProcessRequestEn from '~/.server/locales/en/unable-to-process-request';
import applicationFr from '~/.server/locales/fr/application';
import applicationFullAdultFr from '~/.server/locales/fr/application-full-adult';
import applicationFullChildFr from '~/.server/locales/fr/application-full-child';
import applicationFullFamilyFr from '~/.server/locales/fr/application-full-family';
import applicationSimplifiedAdultFr from '~/.server/locales/fr/application-simplified-adult';
import applicationSimplifiedChildFr from '~/.server/locales/fr/application-simplified-child';
import applicationSimplifiedFamilyFr from '~/.server/locales/fr/application-simplified-family';
import applicationSpokesFr from '~/.server/locales/fr/application-spokes';
import commonFr from '~/.server/locales/fr/common';
import dataUnavailableFr from '~/.server/locales/fr/data-unavailable';
import documentsFr from '~/.server/locales/fr/documents';
import gcwebFr from '~/.server/locales/fr/gcweb';
import lettersFr from '~/.server/locales/fr/letters';
import protectedApplicationFr from '~/.server/locales/fr/protected-application';
import protectedApplicationIntakeAdultFr from '~/.server/locales/fr/protected-application-intake-adult';
import protectedApplicationIntakeChildFr from '~/.server/locales/fr/protected-application-intake-child';
import protectedApplicationIntakeFamilyFr from '~/.server/locales/fr/protected-application-intake-family';
import protectedApplicationRenewalAdultFr from '~/.server/locales/fr/protected-application-renewal-adult';
import protectedApplicationRenewalChildFr from '~/.server/locales/fr/protected-application-renewal-child';
import protectedApplicationRenewalFamilyFr from '~/.server/locales/fr/protected-application-renewal-family';
import protectedApplicationSpokesFr from '~/.server/locales/fr/protected-application-spokes';
import protectedProfileFr from '~/.server/locales/fr/protected-profile';
import statusFr from '~/.server/locales/fr/status';
import stubLoginFr from '~/.server/locales/fr/stub-login';
import unableToProcessRequestFr from '~/.server/locales/fr/unable-to-process-request';

type I18nResources = typeof i18nResourcesEn;

const i18nResourcesEn = {
  application: applicationEn,
  'application-spokes': applicationSpokesEn,
  'application-full-adult': applicationFullAdultEn,
  'application-full-child': applicationFullChildEn,
  'application-full-family': applicationFullFamilyEn,
  'application-simplified-adult': applicationSimplifiedAdultEn,
  'application-simplified-child': applicationSimplifiedChildEn,
  'application-simplified-family': applicationSimplifiedFamilyEn,
  common: commonEn,
  'data-unavailable': dataUnavailableEn,
  documents: documentsEn,
  gcweb: gcwebEn,
  letters: lettersEn,
  'protected-application': protectedApplicationEn,
  'protected-application-intake-adult': protectedApplicationIntakeAdultEn,
  'protected-application-intake-child': protectedApplicationIntakeChildEn,
  'protected-application-intake-family': protectedApplicationIntakeFamilyEn,
  'protected-application-renewal-adult': protectedApplicationRenewalAdultEn,
  'protected-application-renewal-child': protectedApplicationRenewalChildEn,
  'protected-application-renewal-family': protectedApplicationRenewalFamilyEn,
  'protected-application-spokes': protectedApplicationSpokesEn,
  'protected-profile': protectedProfileEn,
  status: statusEn,
  'stub-login': stubLoginEn,
  'unable-to-process-request': unableToProcessRequestEn,
} as const;

const i18nResourcesFr = {
  application: applicationFr,
  'application-full-adult': applicationFullAdultFr,
  'application-full-child': applicationFullChildFr,
  'application-full-family': applicationFullFamilyFr,
  'application-simplified-adult': applicationSimplifiedAdultFr,
  'application-simplified-child': applicationSimplifiedChildFr,
  'application-simplified-family': applicationSimplifiedFamilyFr,
  'application-spokes': applicationSpokesFr,
  common: commonFr,
  'data-unavailable': dataUnavailableFr,
  documents: documentsFr,
  gcweb: gcwebFr,
  letters: lettersFr,
  'protected-application': protectedApplicationFr,
  'protected-application-intake-adult': protectedApplicationIntakeAdultFr,
  'protected-application-intake-child': protectedApplicationIntakeChildFr,
  'protected-application-intake-family': protectedApplicationIntakeFamilyFr,
  'protected-application-renewal-adult': protectedApplicationRenewalAdultFr,
  'protected-application-renewal-child': protectedApplicationRenewalChildFr,
  'protected-application-renewal-family': protectedApplicationRenewalFamilyFr,
  'protected-application-spokes': protectedApplicationSpokesFr,
  'protected-profile': protectedProfileFr,
  status: statusFr,
  'stub-login': stubLoginFr,
  'unable-to-process-request': unableToProcessRequestFr,
} as const satisfies I18nResources;

export const i18nResources = {
  en: i18nResourcesEn,
  fr: i18nResourcesFr,
} as const;
