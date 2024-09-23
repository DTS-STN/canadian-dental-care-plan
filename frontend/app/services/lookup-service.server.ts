import moize from 'moize';
import { z } from 'zod';

import provincialProgramsJson from '~/resources/power-platform/provincial-programs.json';
import regionsJson from '~/resources/power-platform/regions.json';
import { getEnv } from '~/utils/env-utils.server';
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
    LOOKUP_SVC_ALL_DISABILITY_TYPES_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_EQUITY_TYPES_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_GENDER_TYPES_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_INDIGENOUS_GROUP_TYPES_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_INDIGENOUS_TYPES_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_LAST_TIME_DENTIST_VISIT_TYPES_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_MOUTH_PAIN_TYPES_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_PROVINCE_TERRITORY_STATES_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_PROVINCIAL_GOVERNMENT_INSURANCE_PLANS_CACHE_TTL_SECONDS,
    LOOKUP_SVC_ALL_SEX_AT_BIRTH_TYPES_CACHE_TTL_SECONDS,
    LOOKUP_SVC_PROVINCIAL_GOVERNMENT_INSURANCE_PLAN_CACHE_TTL_SECONDS,
  } = getEnv();

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
    log.debug('Fetching all indigenous group types');
    const url = `${INTEROP_API_BASE_URI}/lookups/indigenous-group-types/`;
    const response = await fetch(url);

    const indigenousGroupSchemaList = z.array(indigenousGroupSchema);

    if (response.ok) {
      const data = await response.json();
      log.trace('Returning indigenous group types: [%j]', data);
      return indigenousGroupSchemaList.parse(data);
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
    log.debug('Fetching avoided dental cost types');
    const url = `${INTEROP_API_BASE_URI}/lookups/avoided-dental-cost-types/`;
    const response = await fetch(url);

    const avoidedDentalCostTypeSchemaList = z.array(avoidedDentalCostTypeSchema);

    if (response.ok) {
      const data = await response.json();
      log.trace('Returning avoided dental cost types: [%j]', data);
      return avoidedDentalCostTypeSchemaList.parse(data);
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
    log.debug('Fetching all gender types');
    const url = `${INTEROP_API_BASE_URI}/lookups/gender-types/`;
    const response = await fetch(url);

    const genderTypeSchemaList = z.array(genderTypeSchema);

    if (response.ok) {
      const data = await response.json();
      log.trace('Returning gender types: [%j]', data);
      return genderTypeSchemaList.parse(data);
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
    log.debug('Fetching all last time dentist visit types');
    const url = `${INTEROP_API_BASE_URI}/lookups/last-time-visited-dentist-types/`;
    const response = await fetch(url);

    const lastTimeDentistVisitTypeSchemaList = z.array(lastTimeDentistVisitTypeSchema);

    if (response.ok) {
      const data = await response.json();
      log.trace('Returning last time dentist visit types: [%j]', data);
      return lastTimeDentistVisitTypeSchemaList.parse(data);
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
    log.debug('Fetching all sex at birth types');
    const url = `${INTEROP_API_BASE_URI}/lookups/sex-at-birth-types/`;
    const response = await fetch(url);

    const sexAtBirthTypeSchemaList = z.array(sexAtBirthTypeSchema);

    if (response.ok) {
      const data = await response.json();
      log.trace('Returning sex at birth types: [%j]', data);
      return sexAtBirthTypeSchemaList.parse(data);
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
    log.debug('Fetching all disability types');
    const url = `${INTEROP_API_BASE_URI}/lookups/disability-types/`;
    const response = await fetch(url);

    const disabilityTypeSchemaList = z.array(disabilityTypeSchema);

    if (response.ok) {
      const data = await response.json();
      log.trace('Returning disability types: [%j]', data);
      return disabilityTypeSchemaList.parse(data);
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
    log.debug('Fetching all mouth pain types');
    const url = `${INTEROP_API_BASE_URI}/lookups/mouth-pain-types/`;
    const response = await fetch(url);

    const mouthPainTypeSchemaList = z.array(mouthPainTypeSchema);

    if (response.ok) {
      const data = await response.json();
      log.trace('Returning mouth pain types: [%j]', data);
      return mouthPainTypeSchemaList.parse(data);
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
    log.debug('Fetching all born types');
    const url = `${INTEROP_API_BASE_URI}/lookups/born-types/`;
    const response = await fetch(url);

    const bornTypeSchemaList = z.array(bornTypeSchema);

    if (response.ok) {
      const data = await response.json();
      log.trace('Returning born types: [%j]', data);
      return bornTypeSchemaList.parse(data);
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

  function getAllProvincialTerritorialSocialPrograms() {
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

  function getProvincialTerritorialSocialProgramById(id: string) {
    log.debug('Fetching provincial/territorial social program with id: [%s]', id);

    const provincialTerritorialSocialProgram = getAllProvincialTerritorialSocialPrograms().find((program) => program.id === id);

    if (!provincialTerritorialSocialProgram) {
      throw new Error(`Failed to find provincial/territorial social program; id: ${id}`);
    }

    log.trace('Returning provincial/territorial social program: [%j]', provincialTerritorialSocialProgram);
    return provincialTerritorialSocialProgram;
  }

  function getAllRegions() {
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

  async function getAllEquityTypes() {
    log.debug('Fetching all equality types');
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

    const data = await response.json();
    log.trace('Returning equity types: [%j]', data);
    const equityTypeSchemaList = z.array(equityTypeSchema);
    return equityTypeSchemaList.parse(data);
  }

  return {
    getAllAvoidedDentalCostTypes: moize.promise(getAllAvoidedDentalCostTypes, {
      maxAge: 1000 * LOOKUP_SVC_ALL_AVOIDED_DENTAL_COST_TYPES_CACHE_TTL_SECONDS,
      onCacheAdd: () => log.info('Creating new AllAvoidedDentalCostTypes memo'),
    }),
    getAllBornTypes: moize.promise(getAllBornTypes, {
      maxAge: 1000 * LOOKUP_SVC_ALL_BORN_TYPES_CACHE_TTL_SECONDS,
      onCacheAdd: () => log.info('Creating new AllBornTypes memo'),
    }),
    getAllDisabilityTypes: moize.promise(getAllDisabilityTypes, {
      maxAge: 1000 * LOOKUP_SVC_ALL_DISABILITY_TYPES_CACHE_TTL_SECONDS,
      onCacheAdd: () => log.info('Creating new AllDisabilityTypes memo'),
    }),
    getAllEquityTypes: moize.promise(getAllEquityTypes, {
      maxAge: 1000 * LOOKUP_SVC_ALL_EQUITY_TYPES_CACHE_TTL_SECONDS,
      onCacheAdd: () => log.info('Creating new AllEquityTypes memo'),
    }),
    getAllGenderTypes: moize.promise(getAllGenderTypes, {
      maxAge: 1000 * LOOKUP_SVC_ALL_GENDER_TYPES_CACHE_TTL_SECONDS,
      onCacheAdd: () => log.info('Creating new AllGenderTypes memo'),
    }),
    getAllIndigenousGroupTypes: moize.promise(getAllIndigenousGroupTypes, {
      maxAge: 1000 * LOOKUP_SVC_ALL_INDIGENOUS_GROUP_TYPES_CACHE_TTL_SECONDS,
      onCacheAdd: () => log.info('Creating new AllIndigenousGroupTypes memo'),
    }),
    getAllIndigenousTypes: moize.promise(getAllIndigenousTypes, {
      maxAge: 1000 * LOOKUP_SVC_ALL_INDIGENOUS_TYPES_CACHE_TTL_SECONDS,
      onCacheAdd: () => log.info('Creating new AllIndigenousTypes memo'),
    }),
    getAllLastTimeDentistVisitTypes: moize.promise(getAllLastTimeDentistVisitTypes, {
      maxAge: 1000 * LOOKUP_SVC_ALL_LAST_TIME_DENTIST_VISIT_TYPES_CACHE_TTL_SECONDS,
      onCacheAdd: () => log.info('Creating new AllLastTimeDentistVisitTypes memo'),
    }),
    getAllMouthPainTypes: moize.promise(getAllMouthPainTypes, {
      maxAge: 1000 * LOOKUP_SVC_ALL_MOUTH_PAIN_TYPES_CACHE_TTL_SECONDS,
      onCacheAdd: () => log.info('Creating new AllMouthPainTypes memo'),
    }),
    getAllProvincialTerritorialSocialPrograms: moize(getAllProvincialTerritorialSocialPrograms, {
      maxAge: 1000 * LOOKUP_SVC_ALL_PROVINCIAL_GOVERNMENT_INSURANCE_PLANS_CACHE_TTL_SECONDS,
      onCacheAdd: () => log.info('Creating new AllProvincialTerritorialSocialPrograms memo'),
    }),
    getProvincialTerritorialSocialProgramById: moize(getProvincialTerritorialSocialProgramById, {
      maxAge: 1000 * LOOKUP_SVC_PROVINCIAL_GOVERNMENT_INSURANCE_PLAN_CACHE_TTL_SECONDS,
      maxSize: Infinity,
      onCacheAdd: () => log.info('Creating new ProvincialTerritorialSocialProgramById memo'),
    }),
    getAllRegions: moize(getAllRegions, {
      maxAge: 1000 * LOOKUP_SVC_ALL_PROVINCE_TERRITORY_STATES_CACHE_TTL_SECONDS,
      onCacheAdd: () => log.info('Creating new AllRegions memo'),
    }),
    getAllSexAtBirthTypes: moize.promise(getAllSexAtBirthTypes, {
      maxAge: 1000 * LOOKUP_SVC_ALL_SEX_AT_BIRTH_TYPES_CACHE_TTL_SECONDS,
      onCacheAdd: () => log.info('Creating new AllSexAtBirthTypes memo'),
    }),
  };
}

export type GetLookupService = typeof getLookupService;

export type GetAllRegions = Pick<ReturnType<typeof getLookupService>, 'getAllRegions'>['getAllRegions'];
export type Region = ReturnType<GetAllRegions>[number];

export type GetAllProvincialTerritorialSocialPrograms = Pick<ReturnType<typeof getLookupService>, 'getAllProvincialTerritorialSocialPrograms'>['getAllProvincialTerritorialSocialPrograms'];
export type ProvincialTerritorialSocialProgram = ReturnType<GetAllProvincialTerritorialSocialPrograms>[number];
