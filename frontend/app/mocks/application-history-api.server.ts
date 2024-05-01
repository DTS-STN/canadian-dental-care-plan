import { HttpResponse, http } from 'msw';
import { z } from 'zod';

import { getLogger } from '~/utils/logging.server';

const log = getLogger('application-history-api.server');

/**
 * Server-side MSW mocks for the Application History API.
 */
export function getApplicationHistoryApiMockHandlers() {
  log.info('Initializing Application History API mock handlers');

  return [
    /**
     * Handler for GET requests to retrieve application history.
     */
    http.get('https://api.example.com/v1/users/:userId/applications', ({ params, request }) => {
      log.debug('Handling request for [%s]', request.url);

      const parsedUserId = z.string().safeParse(params.userId);

      if (!parsedUserId.success) {
        throw new HttpResponse(null, { status: 400 });
      }

      return HttpResponse.json([
        {
          AppicationId: '038d9d0f-fb35-4d98-8f31-a4b2171e521a',
          SubmittedDate: '2024/04/05',
          ApplicationStatus: 'Submitted',
          ConfirmationCode: '202403051212',
          Data: [],
        },
        {
          AppicationId: '038d9d0f-fb35-4d98-9d34-a4b2171e789b',
          SubmittedDate: '2024/03/05',
          ApplicationStatus: 'Approved',
          ConfirmationCode: '202403054231',
          Data: [],
        },
      ]);
    }),
  ];
}
