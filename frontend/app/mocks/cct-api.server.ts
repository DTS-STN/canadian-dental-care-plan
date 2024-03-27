import { HttpResponse, http } from 'msw';

import getPdfByLetterIdJson from './cct-data/get-pdf-by-letter-id.json';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('cct-api.server');

/**
 * Server-side MSW mocks for the CCT API.
 */
export function getCCTApiMockHandlers() {
  log.info('Initializing CCT API mock handlers');

  return [
    //
    // Handler for GET requests to retrieve pdf
    //
    http.get('https://api.example.com/dental-care/client-letters/cct/v1/GetPdfByLetterId', async ({ request }) => {
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
    http.get('https://api.example.com/dental-care/client-letters/cct/v1/GetDocInfoByClientId', ({ request }) => {
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
          LetterName: '775170000',
          LetterId: '111222333-6ed0-4113-8520-3c46fc53fd15',
          LetterRecordId: '12345678901',
          LetterDate: '2024/03/26',
        },
        {
          LetterName: '775170000',
          LetterId: '111222333-6ed0-4113-8520-3c46fc53fd15',
          LetterRecordId: '12345678901',
          LetterDate: '2024/03/26',
        },
        {
          LetterName: '775170000',
          LetterId: '111222333-6ed0-4113-8520-3c46fc53f321',
          LetterRecordId: '12345678901',
          LetterDate: '2024/02/15',
        },
        {
          LetterName: '775170000',
          LetterId: '111222333-6ed0-4113-8520-3c46fc53fd123',
          LetterRecordId: '12345678901',
          LetterDate: '2024/02/15',
        },
        {
          LetterName: '775170001',
          LetterId: '038d9d0f-fb35-4d98-8f31-a4b2171e521a',
          LetterRecordId: '81400774242',
          LetterDate: '2024/03/21',
        },
        {
          LetterName: '775170001',
          LetterId: 'f8a161b0-3b89-449f-a10a-e9c958ffb32f',
          LetterRecordId: '81400774242',
          LetterDate: '2024/03/21',
        },
      ]);
    }),
  ];
}
