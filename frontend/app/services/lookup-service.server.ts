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
  code: z.string(),
  nameEn: z.string(),
  nameFr: z.string(),
});

const regionSchema = z.object({
  code: z.string(),
  country: z.object({
    code: z.string(),
    nameEn: z.string(),
    nameFr: z.string(),
  }),
  nameEn: z.string(),
  nameFr: z.string(),
});

export type PreferredLanguageInfo = z.infer<typeof preferredLanguageSchema>;

/**
 * Return a singleton instance (by means of memomization) of the lookup service.
 */
export const getLookupService = moize(createLookupService, { onCacheAdd: () => log.info('Creating new lookup service') });

function createLookupService() {
  const { INTEROP_API_BASE_URI } = getEnv();

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
      return countryListSchema.parse(await response.json());
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
      return regionListSchema.parse(await response.json());
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
    getAllPreferredLanguages,
    getPreferredLanguage,
    getAllCountries,
    getAllRegions,
  };
}
