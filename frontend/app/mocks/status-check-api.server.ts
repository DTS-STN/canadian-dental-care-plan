import { HttpResponse, http } from 'msw';
import { z } from 'zod';

import clientFriendlyStatusDataSource from '~/.server/resources/power-platform/client-friendly-status.json';
import { getEnv } from '~/utils/env-utils.server';
import { getLogger } from '~/utils/logging.server';

/**
 * Mock mapping for application codes to application status codes
 * which can then be used to render on the frontend
 *
 * Example mapping:
 *  {
 *    '000001': '873ac4c6-77c0-ee11-9079-000d3a09d132',
 *    '000002': 'f752c665-c4e6-ee11-a204-000d3a09d1b8',
 *    '000003': 'e882086c-c4e6-ee11-a204-000d3a09d1b8',
 *  }
 */
const MOCK_APPLICATION_CODES_TO_STATUS_CODES_MAP: Record<string, string> = clientFriendlyStatusDataSource.value.reduce((acc, { esdc_clientfriendlystatusid }, i) => ({ ...acc, [(i + 1).toString().padStart(6, '0')]: esdc_clientfriendlystatusid }), {});

/**
 * Server-side MSW mocks for the Status Check API
 */
export function getStatusCheckApiMockHandlers() {
  const log = getLogger('status-check-api.server');
  log.info('Initializing Status Check mock handlers');
  const { INTEROP_API_BASE_URI } = getEnv();

  return [
    http.post(`${INTEROP_API_BASE_URI}/dental-care/status-check/v1/status`, async ({ request }) => {
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

      const statusCode = MOCK_APPLICATION_CODES_TO_STATUS_CODES_MAP[statusRequest.data.BenefitApplication.Applicant.ClientIdentification[0].IdentificationID];

      return HttpResponse.json({
        BenefitApplication: {
          BenefitApplicationStatus: [
            {
              ReferenceDataID: statusCode || 'c23252fe-604e-ee11-be6f-000d3a09d640',
              ReferenceDataName: 'Dental Status Code',
            },
          ],
        },
      });
    }),
    http.post(`${INTEROP_API_BASE_URI}/dental-care/status-check/v1/status_fnlndob`, async ({ request }) => {
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

      const statusCode = MOCK_APPLICATION_CODES_TO_STATUS_CODES_MAP[statusRequest.data.BenefitApplication.Applicant.ClientIdentification[0].IdentificationID];

      return HttpResponse.json({
        BenefitApplication: {
          BenefitApplicationStatus: [
            {
              ReferenceDataID: statusCode || 'c23252fe-604e-ee11-be6f-000d3a09d640',
              ReferenceDataName: 'Dental Status Code',
            },
          ],
        },
      });
    }),
  ];
}
