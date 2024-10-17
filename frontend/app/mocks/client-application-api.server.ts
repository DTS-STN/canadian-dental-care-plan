import { HttpResponse, http } from 'msw';
import { z } from 'zod';

import clientApplicationData from './client-application-data/client-application.json';
import { getLogger } from '~/utils/logging.server';

// Mock handlers for client application data retrieval
export function getClientApplicationApiMockHandlers() {
  const log = getLogger('client-application-api.server');
  log.info('Initializing Client Application mock handlers');

  return [
    // Mock handler for retrieving client application by SIN
    http.post('https://api.example.com/dental-care/applicant-information/dts/v1/client-application', async ({ request }) => {
      log.debug('Handling request for [%s]', request.url);

      // Define schema for validating the incoming request
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

      const subscriptionKey = request.headers.get('Ocp-Apim-Subscription-Key');
      if (!subscriptionKey) {
        return new HttpResponse(null, { status: 401 });
      }

      if (clientApplicationRequest.data.Applicant.PersonSINIdentification.IdentificationID === '999999999') {
        return HttpResponse.json({
          Flags: clientApplicationData.BenefitApplication.Applicant.Flags, // Extract the Flags from the imported JSON
        });
      }

      // If no match, return a 404 status
      return new HttpResponse(null, { status: 404 });
    }),

    // Mock handler for retrieving client application by name, DOB, and client number
    http.post('https://api.example.com/dental-care/applicant-information/dts/v1/client-application_fnlndob', async ({ request }) => {
      log.debug('Handling request for [%s]', request.url);

      // Define schema for validating the incoming request
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

      const subscriptionKey = request.headers.get('Ocp-Apim-Subscription-Key');
      if (!subscriptionKey) {
        return new HttpResponse(null, { status: 401 });
      }

      const { PersonGivenName, PersonSurName } = clientApplicationRequest.data.Applicant.PersonName[0];
      const { date } = clientApplicationRequest.data.Applicant.PersonBirthDate;
      const clientNumber = clientApplicationRequest.data.Applicant.ClientIdentification[0].IdentificationID;

      // Simulate data retrieval: if criteria match, return only the Flags from the imported JSON
      if (PersonGivenName[0] === 'MyFirstName50' && PersonSurName === 'MyLastName50' && date === '1983-07-17' && clientNumber === '4f35f70b-2f83-ee11-8179-000d3a09d000') {
        return HttpResponse.json({
          Flags: clientApplicationData.BenefitApplication.Applicant.Flags, // Extract the Flags from the imported JSON
        });
      }

      // If no match, return a 404 status
      return new HttpResponse(null, { status: 404 });
    }),
  ];
}
