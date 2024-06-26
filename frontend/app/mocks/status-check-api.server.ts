import { HttpResponse, http } from 'msw';
import { z } from 'zod';

import { getLogger } from '~/utils/logging.server';

const log = getLogger('status-check-api.server');

/**
 * Server-side MSW mocks for the Status Check API
 */
export function getStatusCheckApiMockHandlers() {
  log.info('Initializing Status Check mock handlers');

  return [
    http.post('https://api.example.com/dental-care/status-check/v1/status', async ({ request }) => {
      log.debug('Handling request for [%s]', request.url);
      const statusRequestSchema = z.object({
        BenefitApplication: z.object({
          Applicant: z.object({
            PersonSINIdentification: z.object({
              IdentificationID: z.string(),
            }),
            ClientIdentification: z.array(
              z.object({
                IdentificationID: z.string(),
              }),
            ),
          }),
        }),
      });

      const statusRequest = statusRequestSchema.safeParse(await request.json());
      if (!statusRequest.success) {
        return new HttpResponse(null, { status: 400 });
      }

      const subscriptionKey = request.headers.get('Ocp-Apim-Subscription-Key');
      if (!subscriptionKey) {
        return new HttpResponse(null, { status: 401 });
      }

      return HttpResponse.json({
        BenefitApplication: {
          BenefitApplicationStatus: [
            {
              ReferenceDataID: 'c23252fe-604e-ee11-be6f-000d3a09d640',
              ReferenceDataName: 'Dental Status Code',
            },
          ],
        },
      });
    }),
    http.post('https://api.example.com/dental-care/status-check/v1/status_fnlndob', async ({ request }) => {
      log.debug('Handling request for [%s]', request.url);
      const statusRequestSchema = z.object({
        BenefitApplication: z.object({
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
        }),
      });

      const statusRequest = statusRequestSchema.safeParse(await request.json());
      if (!statusRequest.success) {
        return new HttpResponse(null, { status: 400 });
      }

      const subscriptionKey = request.headers.get('Ocp-Apim-Subscription-Key');
      if (!subscriptionKey) {
        return new HttpResponse(null, { status: 401 });
      }

      return HttpResponse.json({
        BenefitApplication: {
          BenefitApplicationStatus: [
            {
              ReferenceDataID: 'c23252fe-604e-ee11-be6f-000d3a09d640',
              ReferenceDataName: 'Dental Status Code',
            },
          ],
        },
      });
    }),
  ];
}
