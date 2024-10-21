import { HttpResponse, http } from 'msw';
import { z } from 'zod';

import ClientApplication from './client-application-data/client-application.json';
import type { BenefitApplicationResponse } from '~/schemas/benefit-application-service-schemas.server';
import { benefitApplicationRequestSchema } from '~/schemas/benefit-application-service-schemas.server';
import { getEnv } from '~/utils/env-utils.server';
import { getLogger } from '~/utils/logging.server';

// Mock handlers for client application data retrieval
export function getClientApplicationApiMockHandlers() {
  const log = getLogger('client-application-api.server');
  log.info('Initializing Client Application mock handlers');
  const { INTEROP_API_BASE_URI } = getEnv();

  return [
    // Mock handler for retrieving client application by name, DOB, and client number
    http.post(`${INTEROP_API_BASE_URI}/dental-care/applicant-information/dts/v1/benefit-application`, async ({ request }) => {
      log.debug('Handling request for [%s]', request.url);

      const subscriptionKey = request.headers.get('Ocp-Apim-Subscription-Key');
      if (!subscriptionKey) {
        return new HttpResponse('Access denied due to missing subscription key. Make sure to include subscription key when making requests to an API.', { status: 401 });
      }

      const url = new URL(request.url);
      const action = url.searchParams.get('action');

      if (action === 'GET') {
        const clientApplicationRequestSchema = z.object({
          Applicant: z.object({
            PersonName: z.array(
              z.object({
                PersonGivenName: z.array(z.string()),
                PersonSurName: z.string(),
              }),
            ),
            PersonBirthDate: z.object({
              date: z.string(),
            }),
            ClientIdentification: z.array(
              z.object({
                IdentificationID: z.string(),
              }),
            ),
          }),
        });

        const requestBody = await request.json();
        const parsedClientApplicationRequest = await clientApplicationRequestSchema.safeParseAsync(requestBody);

        if (!parsedClientApplicationRequest.success) {
          log.debug('Invalid request body [%j]', requestBody);
          return new HttpResponse(null, { status: 400 });
        }

        return HttpResponse.json(ClientApplication);
      }

      const requestBody = await request.json();
      const parsedBenefitApplicationRequest = await benefitApplicationRequestSchema.safeParseAsync(requestBody);

      if (!parsedBenefitApplicationRequest.success) {
        log.debug('Invalid request body [%j]', requestBody);
        return new HttpResponse('Invalid request body!', { status: 400 });
      }

      const mockBenefitApplicationResponse: BenefitApplicationResponse = {
        BenefitApplication: {
          BenefitApplicationIdentification: [
            {
              IdentificationID: '2476124092174',
              IdentificationCategoryText: 'Confirmation Number',
            },
          ],
        },
      };

      return HttpResponse.json(mockBenefitApplicationResponse);
    }),
  ];
}
