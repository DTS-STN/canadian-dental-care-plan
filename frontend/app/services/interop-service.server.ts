import moize from 'moize';
import { z } from 'zod';

import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('lookup-service.server');

const letterSchema = z.array(
  z.object({
    dateSent: z.coerce.date().optional(),
    referenceId: z.string().optional(),
    nameEn: z.string().optional(),
    nameFr: z.string().optional(),
    id: z.string().optional(),
  }),
);

export type LettersInfo = z.infer<typeof letterSchema>;

const letterTypeCodeSchema = z.object({
  code: z.string(),
  nameFr: z.string(),
  nameEn: z.string(),
  id: z.string().optional(),
});

const listOfLetterTypeCodeSchema = z.array(letterTypeCodeSchema);
export type LetterTypeCode = z.infer<typeof letterTypeCodeSchema>;

/**
 * Return a singleton instance (by means of memomization) of the interop service.
 */
export const getInteropService = moize(createInteropService, { onCacheAdd: () => log.info('Creating new interop service') });

function createInteropService() {
  const { INTEROP_API_BASE_URI, CCT_API_BASE_URI, CCT_VAULT_COMMUNITY } = getEnv();

  /**
   * @returns array of letters given the userId and clientId with optional sort parameter
   */
  async function getLetterInfoByClientId(userId: string, clientId: string, sortOrder: 'asc' | 'desc' = 'desc') {
    const url = new URL(`${CCT_API_BASE_URI}/cctws/OnDemand/api/GetDocInfoByClientId`);
    url.searchParams.set('userid', userId);
    url.searchParams.set('clientid', clientId);
    url.searchParams.set('community', CCT_VAULT_COMMUNITY);
    url.searchParams.set('Exact', 'true');
    url.searchParams.set('sort', sortOrder);

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

    return letterSchema.parse(await response.json());
  }

  /**
   * @returns returns all the lettersTypeCodes
   */
  async function getAllLetterTypes() {
    const url = `${INTEROP_API_BASE_URI}/letter-types`;
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

    return listOfLetterTypeCodeSchema.parse(await response.json());
  }

  return { getLetterInfoByClientId, getAllLetterTypes };
}
