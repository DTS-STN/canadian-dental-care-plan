import moize from 'moize';
import { z } from 'zod';

import clientFriendlyStatusesJson from '~/resources/power-platform/client-friendly-statuses.json';
import countriesJson from '~/resources/power-platform/countries.json';
import federalProgramsJson from '~/resources/power-platform/federal-programs.json';
import maritalStatusesJson from '~/resources/power-platform/marital-statuses.json';
import preferredLanguageJson from '~/resources/power-platform/preferred-language.json';
import preferredMethodOfCommunicationJson from '~/resources/power-platform/preferred-method-of-communication.json';
import provincialProgramsJson from '~/resources/power-platform/provincial-programs.json';
import regionsJson from '~/resources/power-platform/regions.json';
import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('lookup-service.server');

const bornTypeSchema = z.object({
  id: z.string(),
  nameEn: z.string().optional(),
  nameFr: z.string().optional(),
});

const mouthPainTypeSchema = z.object({
  id: z.string(),
  nameEn: z.string().optional(),
  nameFr: z.string().optional(),
});

const disabilityTypeSchema = z.object({
  id: z.string(),
  nameEn: z.string().optional(),
  nameFr: z.string().optional(),
});

const sexAtBirthTypeSchema = z.object({
  id: z.string(),
  nameEn: z.string().optional(),
  nameFr: z.string().optional(),
});

const lastTimeDentistVisitTypeSchema = z.object({
  id: z.string(),
  nameEn: z.string().optional(),
  nameFr: z.string().optional(),
});

const genderTypeSchema = z.object({
  id: z.string(),
  nameEn: z.string().optional(),
  nameFr: z.string().optional(),
});

const avoidedDentalCostTypeSchema = z.object({
  id: z.string(),
  nameEn: z.string().optional(),
  nameFr: z.string().optional(),
});

const equityTypeSchema = z.object({
  id: z.string(),
  nameEn: z.string().optional(),
  nameFr: z.string().optional(),
});

const indigenousTypeSchema = z.object({
  id: z.string(),
  nameEn: z.string().optional(),
  nameFr: z.string().optional(),
});

const indigenousGroupSchema = z.object({
  id: z.string(),
  nameEn: z.string().optional(),
  nameFr: z.string().optional(),
});

/**
 * Return a singleton instance (by means of memomization) of the lookup service.
 */
export const getLookupService = moize(createLookupService, { onCacheAdd: () => log.info('Creating new lookup service') });

function createLookupService() {
  const {
    INTEROP_API_BASE_URI,
    LOOKUP_SVC_ALL_AVOIDED_DENTAL_COST_TYPES_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_BORN_TYPES_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_CLIENT_FRIENDLY_STATUSES_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_COUNTRIES_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_DISABILITY_TYPES_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_EQUITY_TYPES_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_FEDERAL_SOCIAL_PROGRAMS_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_GENDER_TYPES_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_INDIGENOUS_GROUP_TYPES_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_INDIGENOUS_TYPES_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_LAST_TIME_DENTIST_VISIT_TYPES_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_MARITAL_STATUSES_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_MOUTH_PAIN_TYPES_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_PREFERRED_COMMUNICATION_METHODS_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_PREFERRED_LANGUAGES_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_PROVINCIAL_TERRITORIAL_SOCIAL_PROGRAMS_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_REGIONS_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_SEX_AT_BIRTH_TYPES_CACHE_TTL_SECONDS,
    LOOKUP_SVC_PREFERRED_LANGUAGE_CACHE_TTL_SECONDS,
    ENGLISH_LANGUAGE_CODE,
    FRENCH_LANGUAGE_CODE,
  } = getEnv();

  async function getAllPreferredLanguages() {
    log.debug('Fetching all preferred languages');

    const preferredLanguages = preferredLanguageJson.value[0].OptionSet.Options.map((o) => ({
      id: o.Value.toString(),
      nameEn: o.Label.LocalizedLabels.find((label) => label.LanguageCode === ENGLISH_LANGUAGE_CODE)?.Label,
      nameFr: o.Label.LocalizedLabels.find((label) => label.LanguageCode === FRENCH_LANGUAGE_CODE)?.Label,
    }));

    log.trace('Returning preferred languages: [%j]', preferredLanguages);
    return preferredLanguages;
  }

  async function getAllIndigenousTypes() {
    const url = `${INTEROP_API_BASE_URI}/lookups/indigenous-types/`;
    const response = await fetch(url);

    const indigenousTypeSchemaList = z.array(indigenousTypeSchema);

    if (response.ok) {
      return indigenousTypeSchemaList.parse(await response.json());
    }

    log.error('%j', {
      message: 'Failed to fetch data',
      status: response.status,
      statusText: response.statusText,
      url: url,
      responseBody: await response.text(),
    });

    throw new Error(`Failed to fetch data. Status: ${response.status}, Status Text: ${response.statusText}`);
  }
  async function getAllIndigenousGroupTypes() {
    const url = `${INTEROP_API_BASE_URI}/lookups/indigenous-group-types/`;
    const response = await fetch(url);

    const indigenousGroupSchemaList = z.array(indigenousGroupSchema);

    if (response.ok) {
      return indigenousGroupSchemaList.parse(await response.json());
    }

    log.error('%j', {
      message: 'Failed to fetch data',
      status: response.status,
      statusText: response.statusText,
      url: url,
      responseBody: await response.text(),
    });

    throw new Error(`Failed to fetch data. Status: ${response.status}, Status Text: ${response.statusText}`);
  }

  async function getAllAvoidedDentalCostTypes() {
    const url = `${INTEROP_API_BASE_URI}/lookups/avoided-dental-cost-types/`;
    const response = await fetch(url);

    const avoidedDentalCostTypeSchemaList = z.array(avoidedDentalCostTypeSchema);

    if (response.ok) {
      return avoidedDentalCostTypeSchemaList.parse(await response.json());
    }

    log.error('%j', {
      message: 'Failed to fetch data',
      status: response.status,
      statusText: response.statusText,
      url: url,
      responseBody: await response.text(),
    });

    throw new Error(`Failed to fetch data. Status: ${response.status}, Status Text: ${response.statusText}`);
  }

  async function getAllGenderTypes() {
    const url = `${INTEROP_API_BASE_URI}/lookups/gender-types/`;
    const response = await fetch(url);

    const genderTypeSchemaList = z.array(genderTypeSchema);

    if (response.ok) {
      return genderTypeSchemaList.parse(await response.json());
    }
    log.error('%j', {
      message: 'Failed to fetch data',
      status: response.status,
      statusText: response.statusText,
      url: url,
      responseBody: await response.text(),
    });

    throw new Error(`Failed to fetch data. Status: ${response.status}, Status Text: ${response.statusText}`);
  }

  async function getAllLastTimeDentistVisitTypes() {
    const url = `${INTEROP_API_BASE_URI}/lookups/last-time-visited-dentist-types/`;
    const response = await fetch(url);

    const lastTimeDentistVisitTypeSchemaList = z.array(lastTimeDentistVisitTypeSchema);

    if (response.ok) {
      return lastTimeDentistVisitTypeSchemaList.parse(await response.json());
    }

    log.error('%j', {
      message: 'Failed to fetch data',
      status: response.status,
      statusText: response.statusText,
      url: url,
      responseBody: await response.text(),
    });

    throw new Error(`Failed to fetch data. Status: ${response.status}, Status Text: ${response.statusText}`);
  }

  async function getAllSexAtBirthTypes() {
    const url = `${INTEROP_API_BASE_URI}/lookups/sex-at-birth-types/`;
    const response = await fetch(url);

    const sexAtBirthTypeSchemaList = z.array(sexAtBirthTypeSchema);

    if (response.ok) {
      return sexAtBirthTypeSchemaList.parse(await response.json());
    }

    log.error('%j', {
      message: 'Failed to fetch data',
      status: response.status,
      statusText: response.statusText,
      url: url,
      responseBody: await response.text(),
    });

    throw new Error(`Failed to fetch data. Status: ${response.status}, Status Text: ${response.statusText}`);
  }

  async function getAllDisabilityTypes() {
    const url = `${INTEROP_API_BASE_URI}/lookups/disability-types/`;
    const response = await fetch(url);

    const disabilityTypeSchemaList = z.array(disabilityTypeSchema);

    if (response.ok) {
      return disabilityTypeSchemaList.parse(await response.json());
    }

    log.error('%j', {
      message: 'Failed to fetch data',
      status: response.status,
      statusText: response.statusText,
      url: url,
      responseBody: await response.text(),
    });

    throw new Error(`Failed to fetch data. Status: ${response.status}, Status Text: ${response.statusText}`);
  }

  async function getAllMouthPainTypes() {
    const url = `${INTEROP_API_BASE_URI}/lookups/mouth-pain-types/`;
    const response = await fetch(url);

    const mouthPainTypeSchemaList = z.array(mouthPainTypeSchema);

    if (response.ok) {
      return mouthPainTypeSchemaList.parse(await response.json());
    }

    log.error('%j', {
      message: 'Failed to fetch data',
      status: response.status,
      statusText: response.statusText,
      url: url,
      responseBody: await response.text(),
    });

    throw new Error(`Failed to fetch data. Status: ${response.status}, Status Text: ${response.statusText}`);
  }

  async function getAllBornTypes() {
    const url = `${INTEROP_API_BASE_URI}/lookups/born-types/`;
    const response = await fetch(url);

    const bornTypeSchemaList = z.array(bornTypeSchema);

    if (response.ok) {
      return bornTypeSchemaList.parse(await response.json());
    }

    log.error('%j', {
      message: 'Failed to fetch data',
      status: response.status,
      statusText: response.statusText,
      url: url,
      responseBody: await response.text(),
    });

    throw new Error(`Failed to fetch data. Status: ${response.status}, Status Text: ${response.statusText}`);
  }

  async function getPreferredLanguage(preferredLanguageId: string) {
    const preferredLanguage = preferredLanguageJson.value[0].OptionSet.Options.find(({ Value }) => Value.toString() === preferredLanguageId);

    if (!preferredLanguage) {
      return null;
    }

    return {
      id: preferredLanguage.Value.toString(),
      nameEn: preferredLanguage.Label.LocalizedLabels.find((label) => label.LanguageCode === ENGLISH_LANGUAGE_CODE)?.Label,
      nameFr: preferredLanguage.Label.LocalizedLabels.find((label) => label.LanguageCode === FRENCH_LANGUAGE_CODE)?.Label,
    };
  }

  async function getAllPreferredCommunicationMethods() {
    log.debug('Fetching all preferred communication methods');

    const preferredCommunicationMethods = preferredMethodOfCommunicationJson.value[0].OptionSet.Options.map((o) => ({
      id: o.Value.toString(),
      nameEn: o.Label.LocalizedLabels.find((label) => label.LanguageCode === ENGLISH_LANGUAGE_CODE)?.Label,
      nameFr: o.Label.LocalizedLabels.find((label) => label.LanguageCode === FRENCH_LANGUAGE_CODE)?.Label,
    }));

    log.trace('Returning preferred communication methods: [%j]', preferredCommunicationMethods);
    return preferredCommunicationMethods;
  }

  async function getAllFederalSocialPrograms() {
    log.debug('Fetching all federal social programs');

    const federalSocialPrograms = federalProgramsJson.value.map((federalSocialProgram) => ({
      id: federalSocialProgram.esdc_governmentinsuranceplanid,
      nameEn: federalSocialProgram.esdc_nameenglish,
      nameFr: federalSocialProgram.esdc_namefrench,
    }));

    log.trace('Returning federal social programs: [%j]', federalSocialPrograms);
    return federalSocialPrograms;
  }

  async function getAllProvincialTerritorialSocialPrograms() {
    log.debug('Fetching all provincial/territorial social programs');

    const provincialTerritorialSocialPrograms = provincialProgramsJson.value.map((provincialSocialProgram) => ({
      id: provincialSocialProgram.esdc_governmentinsuranceplanid,
      nameEn: provincialSocialProgram.esdc_nameenglish,
      nameFr: provincialSocialProgram.esdc_namefrench,
      provinceTerritoryStateId: provincialSocialProgram._esdc_provinceterritorystateid_value,
    }));

    log.trace('Returning provincial/territorial social programs: [%j]', provincialTerritorialSocialPrograms);
    return provincialTerritorialSocialPrograms;
  }

  async function getAllCountries() {
    log.debug('Fetching all countries');

    const countries = countriesJson.value.map((country) => ({
      countryId: country.esdc_countryid,
      nameEn: country.esdc_nameenglish,
      nameFr: country.esdc_namefrench,
    }));

    log.trace('Returning countries: [%j]', countries);
    return countries;
  }

  async function getAllRegions() {
    log.debug('Fetching all regions');

    const regions = regionsJson.value.map((region) => ({
      provinceTerritoryStateId: region.esdc_provinceterritorystateid,
      countryId: region._esdc_countryid_value,
      nameEn: region.esdc_nameenglish,
      nameFr: region.esdc_namefrench,
      abbr: region.esdc_internationalalphacode,
    }));

    log.trace('Returning regions: [%j]', regions);
    return regions;
  }

  async function getAllMaritalStatuses() {
    log.debug('Fetching all marital statuses');

    const maritalStatuses = maritalStatusesJson.value[0].OptionSet.Options.map((o) => ({
      id: o.Value.toString(),
      nameEn: o.Label.LocalizedLabels.find((label) => label.LanguageCode === ENGLISH_LANGUAGE_CODE)?.Label,
      nameFr: o.Label.LocalizedLabels.find((label) => label.LanguageCode === FRENCH_LANGUAGE_CODE)?.Label,
    }));

    log.trace('Returning marital statuses: [%j]', maritalStatuses);
    return maritalStatuses;
  }

  async function getAllEquityTypes() {
    const url = `${INTEROP_API_BASE_URI}/lookups/equity-types/`;
    const response = await fetch(url);

    if (!response.ok) {
      log.error('%j', {
        message: 'Failed to fetch data',
        status: response.status,
        statusText: response.statusText,
        url: url,
        responseBody: await response.text(),
      });
      throw new Error(`Failed to fetch data. Status: ${response.status}, Status Text: ${response.statusText}`);
    }

    const equityTypeSchemaList = z.array(equityTypeSchema);
    return equityTypeSchemaList.parse(await response.json());
  }

  async function getAllClientFriendlyStatuses() {
    return clientFriendlyStatusesJson.value.map((clientFriendlyStatus) => ({
      id: clientFriendlyStatus.esdc_clientfriendlystatusid,
      nameEn: clientFriendlyStatus.esdc_descriptionenglish,
      nameFr: clientFriendlyStatus.esdc_descriptionfrench,
    }));
  }

  return {
    getAllAvoidedDentalCostTypes: moize(getAllAvoidedDentalCostTypes, { maxAge: 1000 * LOOKUP_SVC_ALL_AVOIDED_DENTAL_COST_TYPES_CACHE_TTL_SECONDS, onCacheAdd: () => log.info('Creating new AllAvoidedDentalCostTypes memo') }),
    getAllBornTypes: moize(getAllBornTypes, { maxAge: 1000 * LOOKUP_SVC_ALL_BORN_TYPES_CACHE_TTL_SECONDS, onCacheAdd: () => log.info('Creating new AllBornTypes memo') }),
    getAllClientFriendlyStatuses: moize(getAllClientFriendlyStatuses, { maxAge: 1000 * LOOKUP_SVC_ALL_CLIENT_FRIENDLY_STATUSES_CACHE_TTL_SECONDS, onCacheAdd: () => log.info('Creating new AllClientFriendlyStatuses memo') }),
    getAllCountries: moize(getAllCountries, { maxAge: 1000 * LOOKUP_SVC_ALL_COUNTRIES_CACHE_TTL_SECONDS, onCacheAdd: () => log.info('Creating new AllCountries memo') }),
    getAllDisabilityTypes: moize(getAllDisabilityTypes, { maxAge: 1000 * LOOKUP_SVC_ALL_DISABILITY_TYPES_CACHE_TTL_SECONDS, onCacheAdd: () => log.info('Creating new AllDisabilityTypes memo') }),
    getAllEquityTypes: moize(getAllEquityTypes, { maxAge: 1000 * LOOKUP_SVC_ALL_EQUITY_TYPES_CACHE_TTL_SECONDS, onCacheAdd: () => log.info('Creating new AllEquityTypes memo') }),
    getAllFederalSocialPrograms: moize(getAllFederalSocialPrograms, { maxAge: 1000 * LOOKUP_SVC_ALL_FEDERAL_SOCIAL_PROGRAMS_CACHE_TTL_SECONDS, onCacheAdd: () => log.info('Creating new AllFederalSocialPrograms memo') }),
    getAllGenderTypes: moize(getAllGenderTypes, { maxAge: 1000 * LOOKUP_SVC_ALL_GENDER_TYPES_CACHE_TTL_SECONDS, onCacheAdd: () => log.info('Creating new AllGenderTypes memo') }),
    getAllIndigenousGroupTypes: moize(getAllIndigenousGroupTypes, { maxAge: 1000 * LOOKUP_SVC_ALL_INDIGENOUS_GROUP_TYPES_CACHE_TTL_SECONDS, onCacheAdd: () => log.info('Creating new AllIndigenousGroupTypes memo') }),
    getAllIndigenousTypes: moize(getAllIndigenousTypes, { maxAge: 1000 * LOOKUP_SVC_ALL_INDIGENOUS_TYPES_CACHE_TTL_SECONDS, onCacheAdd: () => log.info('Creating new AllIndigenousTypes memo') }),
    getAllLastTimeDentistVisitTypes: moize(getAllLastTimeDentistVisitTypes, { maxAge: 1000 * LOOKUP_SVC_ALL_LAST_TIME_DENTIST_VISIT_TYPES_CACHE_TTL_SECONDS, onCacheAdd: () => log.info('Creating new AllLastTimeDentistVisitTypes memo') }),
    getAllMaritalStatuses: moize(getAllMaritalStatuses, { maxAge: 1000 * LOOKUP_SVC_ALL_MARITAL_STATUSES_CACHE_TTL_SECONDS, onCacheAdd: () => log.info('Creating new AllMaritalStatuses memo') }),
    getAllMouthPainTypes: moize(getAllMouthPainTypes, { maxAge: 1000 * LOOKUP_SVC_ALL_MOUTH_PAIN_TYPES_CACHE_TTL_SECONDS, onCacheAdd: () => log.info('Creating new AllMouthPainTypes memo') }),
    getAllPreferredCommunicationMethods: moize(getAllPreferredCommunicationMethods, { maxAge: 1000 * LOOKUP_SVC_ALL_PREFERRED_COMMUNICATION_METHODS_CACHE_TTL_SECONDS, onCacheAdd: () => log.info('Creating new AllPreferredCommunicationMethods memo') }),
    getAllPreferredLanguages: moize(getAllPreferredLanguages, { maxAge: 1000 * LOOKUP_SVC_ALL_PREFERRED_LANGUAGES_CACHE_TTL_SECONDS, onCacheAdd: () => log.info('Creating new AllPreferredLanguages memo') }),
    getAllProvincialTerritorialSocialPrograms: moize(getAllProvincialTerritorialSocialPrograms, {
      maxAge: 1000 * LOOKUP_SVC_ALL_PROVINCIAL_TERRITORIAL_SOCIAL_PROGRAMS_CACHE_TTL_SECONDS,
      onCacheAdd: () => log.info('Creating new AllProvincialTerritorialSocialPrograms memo'),
    }),
    getAllRegions: moize(getAllRegions, { maxAge: 1000 * LOOKUP_SVC_ALL_REGIONS_CACHE_TTL_SECONDS, onCacheAdd: () => log.info('Creating new AllRegions memo') }),
    getAllSexAtBirthTypes: moize(getAllSexAtBirthTypes, { maxAge: 1000 * LOOKUP_SVC_ALL_SEX_AT_BIRTH_TYPES_CACHE_TTL_SECONDS, onCacheAdd: () => log.info('Creating new AllSexAtBirthTypes memo') }),
    getPreferredLanguage: moize(getPreferredLanguage, { maxAge: 1000 * LOOKUP_SVC_PREFERRED_LANGUAGE_CACHE_TTL_SECONDS, onCacheAdd: () => log.info('Creating new PreferredLanguage memo') }),
  };
}
