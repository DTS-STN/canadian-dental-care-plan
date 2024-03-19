import { sort } from 'moderndash';
import moize from 'moize';
import { z } from 'zod';

import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('lookup-service.server');

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

    const lettersSchema = z.array(
      z.object({
        LetterRecordId: z.string().optional(),
        LetterDate: z.string().optional(),
        LetterId: z.string().optional(),
        LetterName: z.string().optional(),
      }),
    );

    const letters = lettersSchema.parse(await response.json()).map((letter) => ({
      id: letter.LetterRecordId,
      issuedOn: letter.LetterDate,
      name: letter.LetterName,
      referenceId: letter.LetterId,
    }));

    return sort(letters, {
      order: sortOrder,
      by: (item) => item.issuedOn ?? 'undefined',
    });
  }

  /**
   * @returns returns all the letter types
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

    const letterTypesSchema = z.object({
      value: z.array(
        z.object({
          OptionSet: z.object({
            Options: z.array(
              z.object({
                Value: z.number(),
                Label: z.object({
                  LocalizedLabels: z.array(
                    z.object({
                      Label: z.string(),
                      LanguageCode: z.number(),
                    }),
                  ),
                }),
              }),
            ),
          }),
        }),
      ),
    });

    const letterTypes = letterTypesSchema.parse(await response.json());
    const { ENGLISH_LETTER_LANGUAGE_CODE, FRENCH_LETTER_LANGUAGE_CODE } = getEnv();

    // only one 'OptionSet' will be returned
    return letterTypes.value[0].OptionSet.Options.map((option) => {
      const { LocalizedLabels } = option.Label;
      const nameEn = LocalizedLabels.find((label) => label.LanguageCode === ENGLISH_LETTER_LANGUAGE_CODE)?.Label;
      const nameFr = LocalizedLabels.find((label) => label.LanguageCode === FRENCH_LETTER_LANGUAGE_CODE)?.Label;

      return {
        id: option.Value.toString(),
        nameEn,
        nameFr,
      };
    });
  }

  return {
    getAllLetterTypes: moize(getAllLetterTypes, { isPromise: true, maxAge: 1000 * GET_ALL_LETTER_TYPES_CACHE_TTL_SECONDS, onCacheAdd: () => log.info('Creating new getAllLetterTypes memo') }),
    getLetterInfoByClientId,
  };
}
