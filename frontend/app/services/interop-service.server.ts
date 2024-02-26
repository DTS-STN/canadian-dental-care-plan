import { sort } from 'moderndash';
import moize from 'moize';
import { z } from 'zod';

import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('lookup-service.server');

const letterSchema = z.object({
  LetterDate: z.coerce.date().optional(),
  LetterRecordId: z.string().optional(),
  LetterId: z.string().optional(),
  LetterName: z.string().optional(),
});
const listOfLetterSchema = z.array(letterSchema);

export type LettersInfo = z.infer<typeof letterSchema>;
export type ParsedListOfLettersInfo = z.infer<typeof listOfLetterSchema>;

const letterTypeCodeSchema = z.object({
  id: z.string().optional(),
  code: z.string().optional(),
  nameFr: z.string().optional(),
  nameEn: z.string().optional(),
});
const listOfLetterTypeCodeSchema = z.array(letterTypeCodeSchema);

export type LetterTypeCode = z.infer<typeof letterTypeCodeSchema>;
export type ListOfLetterTypeCode = z.infer<typeof listOfLetterTypeCodeSchema>;
/**
 * Return a singleton instance (by means of memomization) of the interop service.
 */
export const getInteropService = moize(createInteropService, { onCacheAdd: () => log.info('Creating new interop service') });

function createInteropService() {
  const { INTEROP_API_BASE_URI, CCT_API_BASE_URI, CCT_VAULT_COMMUNITY, GET_ALL_LETTER_TYPES_CACHE_TTL_SECONDS } = getEnv();

  /**
   * @returns array of letters given the userId and clientId with optional sort parameter
   */
  async function getLetterInfoByClientId(userId: string, clientId: string, sortOrder: 'asc' | 'desc' = 'desc') {
    const url = new URL(`${CCT_API_BASE_URI}/cctws/OnDemand/api/GetDocInfoByClientId`);
    url.searchParams.set('userid', userId);
    url.searchParams.set('clientid', clientId);
    url.searchParams.set('community', CCT_VAULT_COMMUNITY);
    url.searchParams.set('Exact', 'true');

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

    const letters = listOfLetterSchema.parse(await response.json()).map((letter) => ({
      id: letter.LetterId,
      name: letter.LetterName,
      referenceId: letter.LetterRecordId,
      issuedOn: letter.LetterDate,
    }));

    return sort(letters, {
      order: sortOrder,
      by: (item) => item.issuedOn ?? 'undefined',
    });
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

  return {
    getAllLetterTypes: moize(getAllLetterTypes, { isPromise: true, maxAge: 1000 * GET_ALL_LETTER_TYPES_CACHE_TTL_SECONDS, onCacheAdd: () => log.info('Creating new getAllLetterTypes memo') }),
    getLetterInfoByClientId,
  };
}
