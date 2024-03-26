import moize from 'moize';
import { z } from 'zod';

import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('lookup-service.server');

const preferredLanguageSchema = z.object({
  id: z.string(),
  nameEn: z.string().optional(),
  nameFr: z.string().optional(),
});

const preferredCommunicationMethodSchema = z.object({
  id: z.string(),
  nameEn: z.string().optional(),
  nameFr: z.string().optional(),
});

const accessToDentalInsurance = z.object({
  id: z.string(),
  nameEn: z.string().optional(),
  nameFr: z.string().optional(),
});

const federalDentalBenefit = z.object({
  code: z.string(),
  nameEn: z.string().optional(),
  nameFr: z.string().optional(),
});

const provincialTerritorialDentalBenefit = z.object({
  code: z.string(),
  nameEn: z.string().optional(),
  nameFr: z.string().optional(),
});

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

const maritalStatusSchema = z.object({
  id: z.string(),
  code: z.string(),
  nameEn: z.string(),
  nameFr: z.string(),
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
    LOOKUP_SVC_ALL_ACCESS_TO_DENTAL_INSURANCE_OPTIONS_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_AVOIDED_DENTAL_COST_TYPES_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_BORN_TYPES_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_COUNTRIES_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_DISABILITY_TYPES_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_EQUITY_TYPES_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_FEDERAL_DENTAL_BENEFITS_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_FEDERAL_SOCIAL_PROGRAMS_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_GENDER_TYPES_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_INDIGENOUS_GROUP_TYPES_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_INDIGENOUS_TYPES_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_LAST_TIME_DENTIST_VISIT_TYPES_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_MARITAL_STATUSES_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_MOUTH_PAIN_TYPES_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_PREFERRED_COMMUNICATION_METHODS_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_PREFERRED_LANGUAGES_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_PROVINCIAL_TERRITORIAL_DENTAL_BENEFITS_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_PROVINCIAL_TERRITORIAL_SOCIAL_PROGRAMS_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_REGIONS_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_SEX_AT_BIRTH_TYPES_CACHE_TTL_SECONDS,
    LOOKUP_SVC_PREFERRED_LANGUAGE_CACHE_TTL_SECONDS,
  } = getEnv();

  async function getAllPreferredLanguages() {
    const url = `${INTEROP_API_BASE_URI}/lookups/preferred-languages/`;
    const response = await fetch(url);

    const preferredLanguageSchemaList = z.array(preferredLanguageSchema);

    if (response.ok) {
      return preferredLanguageSchemaList.parse(await response.json());
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
    const url = `${INTEROP_API_BASE_URI}/lookups/preferred-languages/${preferredLanguageId}`;
    const response = await fetch(url);

    if (response.ok) {
      return preferredLanguageSchema.parse(await response.json());
    }

    if (response.status === 404) {
      return null;
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

  async function getAllPreferredCommunicationMethods() {
    const url = `${INTEROP_API_BASE_URI}/lookups/preferred-communication-methods/`;
    const response = await fetch(url);

    const preferredCommunicationMethodSchemaList = z.array(preferredCommunicationMethodSchema);

    if (response.ok) {
      return preferredCommunicationMethodSchemaList.parse(await response.json());
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

  async function getAllAccessToDentalInsuranceOptions() {
    const url = `${INTEROP_API_BASE_URI}/lookups/access-to-dental-insurance/`;
    const response = await fetch(url);

    const accessToDentalInsuranceOptions = z.array(accessToDentalInsurance);

    if (response.ok) {
      return accessToDentalInsuranceOptions.parse(await response.json());
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

  async function getAllFederalDentalBenefit() {
    const url = `${INTEROP_API_BASE_URI}/lookups/federal-dental-benefit/`;
    const response = await fetch(url);

    const federalDentalBenefits = z.array(federalDentalBenefit);

    if (response.ok) {
      return federalDentalBenefits.parse(await response.json());
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

  async function getAllProvincialTerritorialDentalBenefits() {
    const url = `${INTEROP_API_BASE_URI}/lookups/provincial-territorial-dental-benefit/`;
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

    const provincialTerritorialDentalBenefits = z.array(provincialTerritorialDentalBenefit);
    return provincialTerritorialDentalBenefits.parse(await response.json());
  }

  async function getAllFederalSocialPrograms() {
    const url = `${INTEROP_API_BASE_URI}/lookups/federal-social-programs/`;
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

    const federalSocialProgramsSchema = z.object({
      value: z.array(
        z.object({
          esdc_governmentinsuranceplanid: z.string(),
          esdc_nameenglish: z.string(),
          esdc_namefrench: z.string(),
        }),
      ),
    });

    const federalSocialPrograms = federalSocialProgramsSchema.parse(await response.json());
    return federalSocialPrograms.value.map((federalSocialProgram) => ({
      id: federalSocialProgram.esdc_governmentinsuranceplanid,
      nameEn: federalSocialProgram.esdc_nameenglish,
      nameFr: federalSocialProgram.esdc_namefrench,
    }));
  }

  async function getAllProvincialTerritorialSocialPrograms() {
    const url = `${INTEROP_API_BASE_URI}/lookups/provincial-territorial-social-programs/`;
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

    const provincialSocialProgramsSchema = z.object({
      value: z.array(
        z.object({
          esdc_governmentinsuranceplanid: z.string(),
          esdc_nameenglish: z.string(),
          esdc_namefrench: z.string(),
          _esdc_provinceterritorystateid_value: z.string(),
        }),
      ),
    });

    const provincialSocialPrograms = provincialSocialProgramsSchema.parse(await response.json());
    return provincialSocialPrograms.value.map((provincialSocialProgram) => ({
      id: provincialSocialProgram.esdc_governmentinsuranceplanid,
      nameEn: provincialSocialProgram.esdc_nameenglish,
      nameFr: provincialSocialProgram.esdc_namefrench,
      provinceTerritoryStateId: provincialSocialProgram._esdc_provinceterritorystateid_value,
    }));
  }

  async function getAllCountries() {
    const url = `${INTEROP_API_BASE_URI}/lookups/countries/`;
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

    const countriesSchema = z.object({
      value: z.array(
        z.object({
          esdc_countryid: z.string(),
          esdc_nameenglish: z.string(),
          esdc_namefrench: z.string(),
        }),
      ),
    });

    const parsedCountries = countriesSchema.parse(await response.json());
    return parsedCountries.value.map((country) => ({
      countryId: country.esdc_countryid,
      nameEn: country.esdc_nameenglish,
      nameFr: country.esdc_namefrench,
    }));
  }

  async function getAllRegions() {
    const url = `${INTEROP_API_BASE_URI}/lookups/regions`;
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

    const regionsSchema = z.object({
      value: z.array(
        z.object({
          esdc_provinceterritorystateid: z.string(),
          _esdc_countryid_value: z.string(),
          esdc_nameenglish: z.string(),
          esdc_namefrench: z.string(),
          esdc_internationalalphacode: z.string(),
        }),
      ),
    });

    const parsedRegions = regionsSchema.parse(await response.json());
    return parsedRegions.value.map((region) => ({
      provinceTerritoryStateId: region.esdc_provinceterritorystateid,
      countryId: region._esdc_countryid_value,
      nameEn: region.esdc_nameenglish,
      nameFr: region.esdc_namefrench,
      abbr: region.esdc_internationalalphacode,
    }));
  }

  async function getAllMaritalStatuses() {
    const url = `${INTEROP_API_BASE_URI}/lookups/marital-statuses`;
    const response = await fetch(url);

    const maritalStatusSchemaList = z.array(maritalStatusSchema);

    if (response.ok) {
      return maritalStatusSchemaList.parse(await response.json());
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

  return {
    getAllAccessToDentalInsuranceOptions: moize(getAllAccessToDentalInsuranceOptions, {
      maxAge: 1000 * LOOKUP_SVC_ALL_ACCESS_TO_DENTAL_INSURANCE_OPTIONS_CACHE_TTL_SECONDS,
      onCacheAdd: () => log.info('Creating new AllAccessToDentalInsuranceOptions memo'),
    }),
    getAllAvoidedDentalCostTypes: moize(getAllAvoidedDentalCostTypes, { maxAge: 1000 * LOOKUP_SVC_ALL_AVOIDED_DENTAL_COST_TYPES_CACHE_TTL_SECONDS, onCacheAdd: () => log.info('Creating new AllAvoidedDentalCostTypes memo') }),
    getAllBornTypes: moize(getAllBornTypes, { maxAge: 1000 * LOOKUP_SVC_ALL_BORN_TYPES_CACHE_TTL_SECONDS, onCacheAdd: () => log.info('Creating new AllBornTypes memo') }),
    getAllCountries: moize(getAllCountries, { maxAge: 1000 * LOOKUP_SVC_ALL_COUNTRIES_CACHE_TTL_SECONDS, onCacheAdd: () => log.info('Creating new AllCountries memo') }),
    getAllDisabilityTypes: moize(getAllDisabilityTypes, { maxAge: 1000 * LOOKUP_SVC_ALL_DISABILITY_TYPES_CACHE_TTL_SECONDS, onCacheAdd: () => log.info('Creating new AllDisabilityTypes memo') }),
    getAllEquityTypes: moize(getAllEquityTypes, { maxAge: 1000 * LOOKUP_SVC_ALL_EQUITY_TYPES_CACHE_TTL_SECONDS, onCacheAdd: () => log.info('Creating new AllEquityTypes memo') }),
    getAllFederalDentalBenefit: moize(getAllFederalDentalBenefit, { maxAge: 1000 * LOOKUP_SVC_ALL_FEDERAL_DENTAL_BENEFITS_CACHE_TTL_SECONDS, onCacheAdd: () => log.info('Creating new AllFederalDentalBenefit memo') }),
    getAllFederalSocialPrograms: moize(getAllFederalSocialPrograms, { maxAge: 1000 * LOOKUP_SVC_ALL_FEDERAL_SOCIAL_PROGRAMS_CACHE_TTL_SECONDS, onCacheAdd: () => log.info('Creating new AllFederalSocialPrograms memo') }),
    getAllGenderTypes: moize(getAllGenderTypes, { maxAge: 1000 * LOOKUP_SVC_ALL_GENDER_TYPES_CACHE_TTL_SECONDS, onCacheAdd: () => log.info('Creating new AllGenderTypes memo') }),
    getAllIndigenousGroupTypes: moize(getAllIndigenousGroupTypes, { maxAge: 1000 * LOOKUP_SVC_ALL_INDIGENOUS_GROUP_TYPES_CACHE_TTL_SECONDS, onCacheAdd: () => log.info('Creating new AllIndigenousGroupTypes memo') }),
    getAllIndigenousTypes: moize(getAllIndigenousTypes, { maxAge: 1000 * LOOKUP_SVC_ALL_INDIGENOUS_TYPES_CACHE_TTL_SECONDS, onCacheAdd: () => log.info('Creating new AllIndigenousTypes memo') }),
    getAllLastTimeDentistVisitTypes: moize(getAllLastTimeDentistVisitTypes, { maxAge: 1000 * LOOKUP_SVC_ALL_LAST_TIME_DENTIST_VISIT_TYPES_CACHE_TTL_SECONDS, onCacheAdd: () => log.info('Creating new AllLastTimeDentistVisitTypes memo') }),
    getAllMaritalStatuses: moize(getAllMaritalStatuses, { maxAge: 1000 * LOOKUP_SVC_ALL_MARITAL_STATUSES_CACHE_TTL_SECONDS, onCacheAdd: () => log.info('Creating new AllMaritalStatuses memo') }),
    getAllMouthPainTypes: moize(getAllMouthPainTypes, { maxAge: 1000 * LOOKUP_SVC_ALL_MOUTH_PAIN_TYPES_CACHE_TTL_SECONDS, onCacheAdd: () => log.info('Creating new AllMouthPainTypes memo') }),
    getAllPreferredCommunicationMethods: moize(getAllPreferredCommunicationMethods, { maxAge: 1000 * LOOKUP_SVC_ALL_PREFERRED_COMMUNICATION_METHODS_CACHE_TTL_SECONDS, onCacheAdd: () => log.info('Creating new AllPreferredCommunicationMethods memo') }),
    getAllPreferredLanguages: moize(getAllPreferredLanguages, { maxAge: 1000 * LOOKUP_SVC_ALL_PREFERRED_LANGUAGES_CACHE_TTL_SECONDS, onCacheAdd: () => log.info('Creating new AllPreferredLanguages memo') }),
    getAllProvincialTerritorialDentalBenefits: moize(getAllProvincialTerritorialDentalBenefits, {
      maxAge: 1000 * LOOKUP_SVC_ALL_PROVINCIAL_TERRITORIAL_DENTAL_BENEFITS_CACHE_TTL_SECONDS,
      onCacheAdd: () => log.info('Creating new AllProvincialTerritorialDentalBenefits memo'),
    }),
    getAllProvincialTerritorialSocialPrograms: moize(getAllProvincialTerritorialSocialPrograms, {
      maxAge: 1000 * LOOKUP_SVC_ALL_PROVINCIAL_TERRITORIAL_SOCIAL_PROGRAMS_CACHE_TTL_SECONDS,
      onCacheAdd: () => log.info('Creating new AllProvincialTerritorialSocialPrograms memo'),
    }),
    getAllRegions: moize(getAllRegions, { maxAge: 1000 * LOOKUP_SVC_ALL_REGIONS_CACHE_TTL_SECONDS, onCacheAdd: () => log.info('Creating new AllRegions memo') }),
    getAllSexAtBirthTypes: moize(getAllSexAtBirthTypes, { maxAge: 1000 * LOOKUP_SVC_ALL_SEX_AT_BIRTH_TYPES_CACHE_TTL_SECONDS, onCacheAdd: () => log.info('Creating new AllSexAtBirthTypes memo') }),
    getPreferredLanguage: moize(getPreferredLanguage, { maxAge: 1000 * LOOKUP_SVC_PREFERRED_LANGUAGE_CACHE_TTL_SECONDS, onCacheAdd: () => log.info('Creating new PreferredLanguage memo') }),
  };
}
