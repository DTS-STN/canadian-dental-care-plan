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

const accessToDentalProvincialTerritorialDentalBenefit = z.object({
  code: z.string(),
  nameEn: z.string().optional(),
  nameFr: z.string().optional(),
});

const federalSocialProgram = z.object({
  code: z.string(),
  nameEn: z.string().optional(),
  nameFr: z.string().optional(),
})

const countrySchema = z.object({
  countryId: z.string(),
  nameEnglish: z.string(),
  nameFrench: z.string(),
});

const regionSchema = z.object({
  provinceTerritoryStateId: z.string(),
  countryId: z.string(),
  nameEnglish: z.string(),
  nameFrench: z.string(),
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

const taxFilingIndicationSchema = z.object({
  id: z.string(),
  code: z.string(),
  nameEn: z.string(),
  nameFr: z.string(),
});

const applicationTypesSchema = z.object({
  id: z.string(),
  code: z.string(),
  nameEn: z.string(),
  nameFr: z.string(),
});

export type PreferredLanguageInfo = z.infer<typeof preferredLanguageSchema>;
export type RegionInfo = z.infer<typeof regionSchema>;

/**
 * Return a singleton instance (by means of memomization) of the lookup service.
 */
export const getLookupService = moize(createLookupService, { onCacheAdd: () => log.info('Creating new lookup service') });

function createLookupService() {
  const {
    INTEROP_API_BASE_URI,
    LOOKUP_SVC_ALLPREFERREDLANGUAGES_CACHE_TTL_MILLISECONDS,
    LOOKUP_SVC_PREFERREDLANGUAGE_CACHE_TTL_MILLISECONDS,
    LOOKUP_SVC_ALLCOUNTRIES_CACHE_TTL_MILLISECONDS,
    LOOKUP_SVC_ALLREGIONS_CACHE_TTL_MILLISECONDS,
    LOOKUP_SVC_ALLBORNTYPES_CACHE_TTL_MILLISECONDS,
    LOOKUP_SVC_ALLDISABILITYTYPES_CACHE_TTL_MILLISECONDS,
    LOOKUP_SVC_ALLSEXATBIRTHTYPES_CACHE_TTL_MILLISECONDS,
    LOOKUP_SVC_MARITALSTATUSES_CACHE_TTL_MILLISECONDS,
    LOOKUP_SVC_ALLMOUTHPAINTYPES_CACHE_TTL_MILLISECONDS,
    LOOKUP_SVC_LASTTIMEDENTISTVISITTYPES_CACHE_TTL_MILLISECONDS,
    LOOKUP_SVC_AVOIDEDDENTALCOSTTYPES_CACHE_TTL_MILLISECONDS,
    LOOKUP_SVC_GENDERTYPES_CACHE_TTL_MILLISECONDS,
    LOOKUP_SVC_TAXFILINGINDICATIONS_CACHE_TTL_MILLISECONDS,
    LOOKUP_SVC_APPLICATIONTYPES_CACHE_TTL_MILLISECONDS,
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

  async function getAllAccessToProvincialTerritorialDentalBenefit() {
    const url = `${INTEROP_API_BASE_URI}/lookups/provincial-territorial/`;
    const response = await fetch(url);

    const accessToProvincialTerritorialDentalBenefit = z.array(accessToDentalProvincialTerritorialDentalBenefit);

    if (response.ok) {
      return accessToProvincialTerritorialDentalBenefit.parse(await response.json());
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

  async function getAllFederalSocialPrograms() {
    const url = `${INTEROP_API_BASE_URI}/lookups/federal-social-programs/`;
    const response = await fetch(url);

    const federalSocialPrograms= z.array(federalSocialProgram);

    if (response.ok) {
      return federalSocialPrograms.parse(await response.json());
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

  async function getAllCountries() {
    const url = `${INTEROP_API_BASE_URI}/lookups/countries/`;
    const response = await fetch(url);

    const countryListSchema = z.array(countrySchema);

    if (response.ok) {
      const parsedCountries = countryListSchema.parse(await response.json());
      return parsedCountries.map((country) => ({
        countryId: country.countryId,
        nameEnglish: country.nameEnglish,
        nameFrench: country.nameFrench,
      }));
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

  async function getAllRegions() {
    const url = `${INTEROP_API_BASE_URI}/lookups/regions`;
    const response = await fetch(url);

    const regionListSchema = z.array(regionSchema);

    if (response.ok) {
      const parsedRegions = regionListSchema.parse(await response.json());
      return parsedRegions.map((region) => ({
        provinceTerritoryStateId: region.provinceTerritoryStateId,
        countryId: region.countryId,
        nameEnglish: region.nameEnglish,
        nameFrench: region.nameFrench,
      }));
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

  async function getAllTaxFilingIndications() {
    const url = `${INTEROP_API_BASE_URI}/lookups/tax-filing-indications`;
    const response = await fetch(url);

    const taxFilingIndicationSchemaList = z.array(taxFilingIndicationSchema);

    if (response.ok) {
      return taxFilingIndicationSchemaList.parse(await response.json());
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

  async function getAllApplicationTypes() {
    const url = `${INTEROP_API_BASE_URI}/lookups/application-types`;
    const response = await fetch(url);

    const applicationTypesSchemaList = z.array(applicationTypesSchema);

    if (response.ok) {
      return applicationTypesSchemaList.parse(await response.json());
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

  return {
    getAllPreferredLanguages: moize(getAllPreferredLanguages, { maxAge: LOOKUP_SVC_ALLPREFERREDLANGUAGES_CACHE_TTL_MILLISECONDS, onCacheAdd: () => log.info('Creating new AllPreferredLanguages memo') }),
    getPreferredLanguage: moize(getPreferredLanguage, { maxAge: LOOKUP_SVC_PREFERREDLANGUAGE_CACHE_TTL_MILLISECONDS, onCacheAdd: () => log.info('Creating new PreferredLanguage memo') }),
    getAllPreferredCommunicationMethods: moize(getAllPreferredCommunicationMethods, { maxAge: LOOKUP_SVC_ALLPREFERREDLANGUAGES_CACHE_TTL_MILLISECONDS, onCacheAdd: () => log.info('Creating new AllPreferredCommunicationMethods memo') }),
    getAllAccessToDentalInsuranceOptions: moize(getAllAccessToDentalInsuranceOptions, { maxAge: LOOKUP_SVC_ALLPREFERREDLANGUAGES_CACHE_TTL_MILLISECONDS, onCacheAdd: () => log.info('Creating new AllAccessToDentalInsuranceOptions memo') }),
    getAllAccessToProvincialTerritorialDentalBenefit: moize(getAllAccessToProvincialTerritorialDentalBenefit, { maxAge: LOOKUP_SVC_ALLPREFERREDLANGUAGES_CACHE_TTL_MILLISECONDS, onCacheAdd: () => log.info('Creating new AllAccessToDentalInsuranceOptions memo') }),
    getAllFederalSocialPrograms: moize(getAllFederalSocialPrograms, { maxAge: LOOKUP_SVC_ALLPREFERREDLANGUAGES_CACHE_TTL_MILLISECONDS, onCacheAdd: () => log.info('Creating new AllAccessToDentalInsuranceOptions memo') }),
    getAllCountries: moize(getAllCountries, { maxAge: LOOKUP_SVC_ALLCOUNTRIES_CACHE_TTL_MILLISECONDS, onCacheAdd: () => log.info('Creating new AllCountries memo') }),
    getAllRegions: moize(getAllRegions, { maxAge: LOOKUP_SVC_ALLREGIONS_CACHE_TTL_MILLISECONDS, onCacheAdd: () => log.info('Creating new AllRegions memo') }),
    getAllBornTypes: moize(getAllBornTypes, { maxAge: LOOKUP_SVC_ALLBORNTYPES_CACHE_TTL_MILLISECONDS, onCacheAdd: () => log.info('Creating new AllBornTypes memo') }),
    getAllDisabilityTypes: moize(getAllDisabilityTypes, { maxAge: LOOKUP_SVC_ALLDISABILITYTYPES_CACHE_TTL_MILLISECONDS, onCacheAdd: () => log.info('Creating new AllDisabilityTypes memo') }),
    getAllSexAtBirthTypes: moize(getAllSexAtBirthTypes, { maxAge: LOOKUP_SVC_ALLSEXATBIRTHTYPES_CACHE_TTL_MILLISECONDS, onCacheAdd: () => log.info('Creating new AllSexAtBirthTypes memo') }),
    getAllMaritalStatuses: moize(getAllMaritalStatuses, { maxAge: LOOKUP_SVC_MARITALSTATUSES_CACHE_TTL_MILLISECONDS, onCacheAdd: () => log.info('Creating new AllMaritalStatuses memo') }),
    getAllMouthPaintTypes: moize(getAllMouthPainTypes, { maxAge: LOOKUP_SVC_ALLMOUTHPAINTYPES_CACHE_TTL_MILLISECONDS, onCacheAdd: () => log.info('Creating new AllMouthPaintTypes memo') }),
    getAllAvoidedDentalCostTypes: moize(getAllAvoidedDentalCostTypes, { maxAge: LOOKUP_SVC_AVOIDEDDENTALCOSTTYPES_CACHE_TTL_MILLISECONDS, onCacheAdd: () => log.info('Creating new AllAvoidedDentalCostTypes memo') }),
    getAllLastTimeDentistVisitTypes: moize(getAllLastTimeDentistVisitTypes, { maxAge: LOOKUP_SVC_LASTTIMEDENTISTVISITTYPES_CACHE_TTL_MILLISECONDS, onCacheAdd: () => log.info('Creating new AllLastTimeDentistVisitTypes memo') }),
    getAllTaxFilingIndications: moize(getAllTaxFilingIndications, { maxAge: LOOKUP_SVC_TAXFILINGINDICATIONS_CACHE_TTL_MILLISECONDS, onCacheAdd: () => log.info('Creating new AllTaxFilingIndications memo') }),
    getAllGenderTypes: moize(getAllGenderTypes, { maxAge: LOOKUP_SVC_GENDERTYPES_CACHE_TTL_MILLISECONDS, onCacheAdd: () => log.info('Creating new AllGenderTypes memo') }),
    getAllApplicationTypes: moize(getAllApplicationTypes, { maxAge: LOOKUP_SVC_APPLICATIONTYPES_CACHE_TTL_MILLISECONDS, onCacheAdd: () => log.info('Creating new AllApplicationTypes memo') }),
  };
}
