import { z } from 'zod';

import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';

const preferredLanguageSchema = z.object({
  id: z.string(),
  nameEn: z.string().optional(),
  nameFr: z.string().optional(),
});

export type PreferredLanguageInfo = z.infer<typeof preferredLanguageSchema>;

function createLookupService() {
  const logger = getLogger('lookup-service.server');
  const { INTEROP_API_BASE_URI } = getEnv();

  /**
   *
   * @returns all the avaliable preferred languages
   */
  async function getAllPreferredLanguages() {
    const url = `${INTEROP_API_BASE_URI}/lookups/preferred-languages/`;
    const response = await fetch(url);

    const preferredLanguageSchemaList = z.array(preferredLanguageSchema);
    if (response.ok) return preferredLanguageSchemaList.parse(await response.json());

    logger.error('%j', {
      message: 'Failed to fetch data',
      status: response.status,
      statusText: response.statusText,
      url: url,
      responseBody: await response.text(),
    });

    throw new Error(`Failed to fetch data. Status: ${response.status}, Status Text: ${response.statusText}`);
  }

  /**
   *
   * @param preferredLanguageId
   * @returns returns the preferred language based off  @param preferredLanguageId
   */
  async function getPreferredLanguage(preferredLanguageId: string) {
    const url = `${INTEROP_API_BASE_URI}/lookups/preferred-languages/${preferredLanguageId}`;
    const response = await fetch(url);

    if (response.ok) return preferredLanguageSchema.parse(await response.json());
    if (response.status === 404) return null;

    logger.error('%j', {
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
  };
}

export const lookupService = createLookupService();
