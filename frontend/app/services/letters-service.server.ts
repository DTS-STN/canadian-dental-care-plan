import { sort } from 'moderndash';
import moize from 'moize';
import { z } from 'zod';

import letterTypesJson from '~/resources/power-platform/letter-types.json';
import { getAuditService } from '~/services/audit-service.server';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getEnv } from '~/utils/env.server';
import { getFetchFn } from '~/utils/fetch-utils.server';
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
    ENGLISH_LANGUAGE_CODE,
    FRENCH_LANGUAGE_CODE,
    HTTP_PROXY_URL,
    INTEROP_API_BASE_URI,
    INTEROP_API_SUBSCRIPTION_KEY,
    INTEROP_CCT_API_BASE_URI,
    INTEROP_CCT_API_SUBSCRIPTION_KEY,
    INTEROP_CCT_API_COMMUNITY,
  } = getEnv();

  const fetchFn = getFetchFn(HTTP_PROXY_URL);

  /**
   * @returns returns all the letter types
   */
  function getAllLetterTypes() {
    log.debug('Fetching letter types');

    const letterTypes = letterTypesJson.value[0].OptionSet.Options.map((option) => {
      const { LocalizedLabels } = option.Label;
      const nameEn = LocalizedLabels.find((label) => label.LanguageCode === ENGLISH_LANGUAGE_CODE)?.Label;
      const nameFr = LocalizedLabels.find((label) => label.LanguageCode === FRENCH_LANGUAGE_CODE)?.Label;

      return {
        id: option.Value.toString(),
        nameEn,
        nameFr,
      };
    });

    log.trace('Returning letter types: [%j]', letterTypes);
    return letterTypes;
  }

  /**
   * @returns array of letters given the clientId with optional sort parameter
   */
  async function getLetters(clientId: string, userId: string, sortOrder: 'asc' | 'desc' = 'desc') {
    log.debug('Fetching letters for user id [%s]', userId);

    const auditService = getAuditService();
    const instrumentationService = getInstrumentationService();
    auditService.audit('letters.get', { userId });

    const url = new URL(`${INTEROP_CCT_API_BASE_URI ?? INTEROP_API_BASE_URI}/dental-care/client-letters/cct/v1/GetDocInfoByClientId`);
    url.searchParams.set('clientid', clientId);

    const response = await fetchFn(url, {
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': INTEROP_CCT_API_SUBSCRIPTION_KEY ?? INTEROP_API_SUBSCRIPTION_KEY,
        'cct-community': INTEROP_CCT_API_COMMUNITY,
      },
    });

    instrumentationService.countHttpStatus('http.client.interop-api.get-doc-info-by-client-id.gets', response.status);
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

    const data = await response.json();
    log.trace('Letters for user id [%s]: [%j]', userId, data);
    const letters = lettersSchema.parse(data).map((letter) => ({
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
  async function getPdf(letterId: string, userId: string) {
    log.debug('Fetching PDF with letter id [%s] and user id [%s]', letterId, userId);
    const url = new URL(`${INTEROP_CCT_API_BASE_URI ?? INTEROP_API_BASE_URI}/dental-care/client-letters/cct/v1/GetPdfByLetterId`);
    url.searchParams.set('id', letterId);
    const auditService = getAuditService();
    const instrumentationService = getInstrumentationService();

    auditService.audit('pdf.get', { letterId, userId });

    const response = await fetchFn(url, {
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': INTEROP_CCT_API_SUBSCRIPTION_KEY ?? INTEROP_API_SUBSCRIPTION_KEY,
        'cct-community': INTEROP_CCT_API_COMMUNITY,
      },
    });

    instrumentationService.countHttpStatus('http.client.interop-api.get-pdf-by-client-id.gets', response.status);
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

    const data = await response.json();
    log.trace('PDF with letter id [%s] and user id [%s]: [%j]', letterId, userId, data);
    const pdfSchema = z.object({ documentBytes: z.string() });
    return pdfSchema.parse(data).documentBytes;
  }

  return {
    getAllLetterTypes: moize(getAllLetterTypes, { maxAge: 1000 * GET_ALL_LETTER_TYPES_CACHE_TTL_SECONDS, onCacheAdd: () => log.info('Creating new getAllLetterTypes memo') }),
    getLetters,
    getPdf,
  };
}
