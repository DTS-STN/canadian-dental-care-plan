import { HttpResponse, http } from 'msw';

import getPdfByLetterIdJson from './cct-data/get-pdf-by-letter-id.json';
import { getEnv } from '~/utils/env-utils.server';
import { getLogger } from '~/utils/logging.server';

/**
 * Server-side MSW mocks for the CCT API.
 */
export function getCCTApiMockHandlers() {
  const log = getLogger('cct-api.server');
  log.info('Initializing CCT API mock handlers');
  const { INTEROP_API_BASE_URI } = getEnv();

  return [
    //
    // Handler for GET requests to retrieve pdf
    //
    http.get(`${INTEROP_API_BASE_URI}/dental-care/client-letters/cct/v1/GetPdfByLetterId`, ({ request }) => {
      log.debug('Handling request for [%s]', request.url);

      const url = new URL(request.url);
      const community = request.headers.get('cct-community');
      const id = url.searchParams.get('id');

      if (community === null || id === null) {
        return new HttpResponse(null, { status: 400 });
      }

      const subscriptionKey = request.headers.get('Ocp-Apim-Subscription-Key');
      if (!subscriptionKey) {
        return new HttpResponse(null, { status: 401 });
      }

      return HttpResponse.json(getPdfByLetterIdJson);
    }),

    /**
     * Handler for GET requests to retrieve letter details.
     */
    http.get(`${INTEROP_API_BASE_URI}/dental-care/client-letters/cct/v1/GetDocInfoByClientId`, ({ request }) => {
      const url = new URL(request.url);
      const clientId = url.searchParams.get('clientid');
      const community = request.headers.get('cct-community');

      if (clientId === null || community === null) {
        throw new HttpResponse(null, { status: 400 });
      }

      const subscriptionKey = request.headers.get('Ocp-Apim-Subscription-Key');
      if (!subscriptionKey) {
        return new HttpResponse(null, { status: 401 });
      }

      return HttpResponse.json([
        {
          LetterName: '775170001',
          LetterId: '038d9d0f-fb35-4d98-8f31-a4b2171e521a',
          LetterRecordId: '81400774242',
          LetterDate: '2024/04/05',
        },
      ]);
    }),
  ];
}
