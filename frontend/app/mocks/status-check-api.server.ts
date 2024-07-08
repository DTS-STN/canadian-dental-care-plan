import { HttpResponse, http } from 'msw';
import { z } from 'zod';

import { getLookupService } from '~/services/lookup-service.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('status-check-api.server');

/**
 * Mock mapping for application codes to application status codes
 * which can then be used to render on the frontend
 *
 * Example mapping:
 *  {
 *    '111111': '873ac4c6-77c0-ee11-9079-000d3a09d132',
 *    '222222': 'f752c665-c4e6-ee11-a204-000d3a09d1b8',
 *    '333333': 'e882086c-c4e6-ee11-a204-000d3a09d1b8',
 *    '444444': '4d335896-c4e6-ee11-a204-000d3a09d1b8',
 *    '555555': '504fba6e-604e-ee11-be6f-000d3a09d640',
 *    '666666': '1e158ec8-604e-ee11-be6f-000d3a09d640',
 *    '777777': 'c23252fe-604e-ee11-be6f-000d3a09d640',
 *    '888888': '9687572e-614e-ee11-be6f-000d3a09d640',
 *    '999999': '51af5170-614e-ee11-be6f-000d3a09d640'
 *  }
 */
const MOCK_APPLICATION_CODES_TO_STATUS_CODES_MAP: Record<string, string> = getLookupService()
  .getAllClientFriendlyStatuses()
  .reduce((acc, { id }, i) => ({ ...acc, [(i + 1).toString().repeat(6)]: id }), {});

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
