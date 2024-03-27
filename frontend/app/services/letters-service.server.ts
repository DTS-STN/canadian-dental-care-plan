import { sort } from 'moderndash';
import moize from 'moize';
import { z } from 'zod';

import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('letters-service.server');

/**
 * Return a singleton instance (by means of memomization) of the letters service.
 */
export const getLettersService = moize(createLettersService, { onCacheAdd: () => log.info('Creating new letters service') });

function createLettersService() {
  // prettier-ignore
  const { 
    GET_ALL_LETTER_TYPES_CACHE_TTL_SECONDS, 
    INTEROP_API_BASE_URI, 
    INTEROP_CCT_API_BASE_URI, 
    INTEROP_CCT_API_SUBSCRIPTION_KEY, 
    INTEROP_CCT_API_COMMUNITY 
  } = getEnv();

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

  /**
   * @returns array of letters given the clientId with optional sort parameter
   */
  async function getLetters(clientId: string, sortOrder: 'asc' | 'desc' = 'desc') {
    const url = new URL(`${INTEROP_CCT_API_BASE_URI}/dental-care/client-letters/cct/v1/GetDocInfoByClientId`);
    url.searchParams.set('clientid', clientId);

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': INTEROP_CCT_API_SUBSCRIPTION_KEY,
        'cct-community': INTEROP_CCT_API_COMMUNITY,
      },
    });

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
      id: letter.LetterId,
      issuedOn: letter.LetterDate,
      name: letter.LetterName,
    }));

    return sort(letters, {
      order: sortOrder,
      by: (item) => item.issuedOn ?? 'undefined',
    });
  }

  /**
   * @returns a promise that resolves to a base64 encoded string representing the PDF document
   */
  async function getPdf(letterId: string) {
    const url = new URL(`${INTEROP_CCT_API_BASE_URI}/dental-care/client-letters/cct/v1/GetPdfByLetterId`);
    url.searchParams.set('id', letterId);

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': INTEROP_CCT_API_SUBSCRIPTION_KEY,
        'cct-community': INTEROP_CCT_API_COMMUNITY,
      },
    });

    if (!response.ok) {
      log.error('%j', {
        message: 'Failed to fetch data',
        status: response.status,
        statusText: response.statusText,
        url: url,
        handlersresponseBody: await response.text(),
      });

      throw new Error(`Failed to fetch data. Status: ${response.status}, Status Text: ${response.statusText}`);
    }

    const pdfSchema = z.object({ documentBytes: z.string() });
    return pdfSchema.parse(await response.json()).documentBytes;
  }

  return {
    getAllLetterTypes: moize(getAllLetterTypes, { isPromise: true, maxAge: 1000 * GET_ALL_LETTER_TYPES_CACHE_TTL_SECONDS, onCacheAdd: () => log.info('Creating new getAllLetterTypes memo') }),
    getLetters,
    getPdf,
  };
}
