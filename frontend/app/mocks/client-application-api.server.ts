import { HttpResponse, http } from 'msw';
import { z } from 'zod';

import clientApplicationData from './client-application-data/client-application.json';
import { getEnv } from '~/utils/env-utils.server';
import { getLogger } from '~/utils/logging.server';

// Mock handlers for client application data retrieval
export function getClientApplicationApiMockHandlers() {
  const log = getLogger('client-application-api.server');
  log.info('Initializing Client Application mock handlers');
  const { INTEROP_API_BASE_URI } = getEnv();

  return [
    // Mock handler for retrieving client application by SIN
    http.post(`${INTEROP_API_BASE_URI}/dental-care/applicant-information/dts/v1/benefit-application`, async ({ request }) => {
      log.debug('Handling request for [%s]', request.url);

      const clientApplicationRequestSchema = z.object({
        Applicant: z.object({
          PersonSINIdentification: z.object({
            IdentificationID: z.string(),
          }),
        }),
      });

      // Parse the request body
      const clientApplicationRequest = clientApplicationRequestSchema.safeParse(await request.json());

      if (!clientApplicationRequest.success) {
        return new HttpResponse(null, { status: 400 });
      }

      return HttpResponse.json({
        Flags: clientApplicationData.BenefitApplication.Applicant.Flags,
      });
    }),

    // Mock handler for retrieving client application by name, DOB, and client number
    http.post(`${INTEROP_API_BASE_URI}/dental-care/applicant-information/dts/v1/benefit-application`, async ({ request }) => {
      log.debug('Handling request for [%s]', request.url);

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

      // Parse the request body
      const clientApplicationRequest = clientApplicationRequestSchema.safeParse(await request.json());

      if (!clientApplicationRequest.success) {
        return new HttpResponse(null, { status: 400 });
      }

      return HttpResponse.json({
        Flags: clientApplicationData.BenefitApplication.Applicant.Flags,
      });
    }),
  ];
}
