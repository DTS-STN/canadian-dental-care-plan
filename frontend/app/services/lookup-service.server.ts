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

export type PreferredLanguageInfo = z.infer<typeof preferredLanguageSchema>;
export type RegionInfo = z.infer<typeof regionSchema>;

/**
 * Return a singleton instance (by means of memomization) of the lookup service.
 */
export const getLookupService = moize(createLookupService, { onCacheAdd: () => log.info('Creating new lookup service') });

function createLookupService() {
  const { INTEROP_API_BASE_URI, LOOKUP_SVC_ALLPREFERREDLANGUAGES_CACHE_TTL_MILISECONDS, LOOKUP_SVC_PREFERREDLANGUAGE_CACHE_TTL_MILISECONDS, LOOKUP_SVC_ALLCOUNTRIES_CACHE_TTL_MILISECONDS, LOOKUP_SVC_ALLREGIONS_CACHE_TTL_MILISECONDS } = getEnv();

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

  return {
    getAllPreferredLanguages: moize(getAllPreferredLanguages, { maxAge: LOOKUP_SVC_ALLPREFERREDLANGUAGES_CACHE_TTL_MILISECONDS, onCacheAdd: () => log.info('Creating new AllPreferredLanguages memo') }),
    getPreferredLanguage: moize(getPreferredLanguage, { maxAge: LOOKUP_SVC_PREFERREDLANGUAGE_CACHE_TTL_MILISECONDS, onCacheAdd: () => log.info('Creating new PreferredLanguage memo') }),
    getAllCountries: moize(getAllCountries, { maxAge: LOOKUP_SVC_ALLCOUNTRIES_CACHE_TTL_MILISECONDS, onCacheAdd: () => log.info('Creating new AllCountries memo') }),
    getAllRegions: moize(getAllRegions, { maxAge: LOOKUP_SVC_ALLREGIONS_CACHE_TTL_MILISECONDS, onCacheAdd: () => log.info('Creating new AllRegions memo') }),
  };
}
