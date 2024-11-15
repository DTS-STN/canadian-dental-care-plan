import { HttpResponse, http } from 'msw';
import { z } from 'zod';

import clientApplicationJsonDataSource from './client-application-data/client-application.json';
import type { BenefitApplicationResponseEntity, ClientApplicationEntity } from '~/.server/domain/entities';
import { benefitApplicationRequestSchema } from '~/mocks/schemas/benefit-application-schemas.server';
import { benefitRenewalRequestSchema } from '~/schemas/benefit-renewal-service-schemas.server';
import type { BenefitRenewalResponse } from '~/schemas/benefit-renewal-service-schemas.server';
import { getEnv } from '~/utils/env-utils.server';
import { getLogger } from '~/utils/logging.server';

/**
 * Server-side MSW mocks for the Power Platform API.
 */
export function getPowerPlatformApiMockHandlers() {
  const log = getLogger('power-platform-api.server');
  log.info('Initializing Power Platform mock handlers');
  const { INTEROP_API_BASE_URI } = getEnv();

  return [
    // Mock handler for submitting online application and to retrieve client application
    http.post(`${INTEROP_API_BASE_URI}/dental-care/applicant-information/dts/v1/benefit-application`, async ({ request }) => {
      log.debug('Handling request for [%s]', request.url);

      const subscriptionKey = request.headers.get('Ocp-Apim-Subscription-Key');
      if (!subscriptionKey) {
        return new HttpResponse('Access denied due to missing subscription key. Make sure to include subscription key when making requests to an API.', { status: 401 });
      }

      const url = new URL(request.url);
      const action = url.searchParams.get('action');
      const scenario = url.searchParams.get('scenario');

      const requestBody = await request.json();

      const mockApplicantFlags: ReadonlyMap<string, ReadonlyArray<{ Flag: boolean; FlagCategoryText: string }>> = new Map<string, ReadonlyArray<{ Flag: boolean; FlagCategoryText: string }>>([
        [
          '10000000001',
          [
            { Flag: false, FlagCategoryText: 'isCraAssessed' },
            { Flag: true, FlagCategoryText: 'appliedBeforeApril302024' },
          ],
        ],
        [
          '10000000002',
          [
            { Flag: true, FlagCategoryText: 'isCraAssessed' },
            { Flag: false, FlagCategoryText: 'appliedBeforeApril302024' },
          ],
        ],
      ]);

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

        const parsedClientApplicationRequest = await clientApplicationRequestSchema.safeParseAsync(requestBody);

        if (!parsedClientApplicationRequest.success) {
          log.debug('Invalid request body [%j]', requestBody);
          return new HttpResponse(null, { status: 400 });
        }

        const identificationId = parsedClientApplicationRequest.data.Applicant.ClientIdentification[0].IdentificationID;
        const personGivenName = parsedClientApplicationRequest.data.Applicant.PersonName[0].PersonGivenName[0];
        const personSurName = parsedClientApplicationRequest.data.Applicant.PersonName[0].PersonSurName;
        const personBirthDate = parsedClientApplicationRequest.data.Applicant.PersonBirthDate.date;

        // If the ID is '10000000000', return a 404 error
        if (identificationId === '10000000000') {
          log.debug('Client application not found for identification id [%s]', identificationId);
          return new HttpResponse(null, { status: 404 });
        }

        // Otherwise, return specific flags or the default
        const clientApplicationFlags = mockApplicantFlags.get(identificationId) ?? clientApplicationJsonDataSource.BenefitApplication.Applicant.Flags;

        return HttpResponse.json({
          ...clientApplicationJsonDataSource,
          BenefitApplication: {
            ...clientApplicationJsonDataSource.BenefitApplication,
            Applicant: {
              ...clientApplicationJsonDataSource.BenefitApplication.Applicant,
              PersonName: [
                {
                  PersonGivenName: [personGivenName],
                  PersonSurName: personSurName,
                },
              ],
              PersonBirthDate: {
                date: personBirthDate,
              },
              Flags: clientApplicationFlags,
            },
          },
        } satisfies ClientApplicationEntity);
      }

      if (scenario === 'RENEWAL') {
        const parsedBenefitRenewalRequest = await benefitRenewalRequestSchema.safeParseAsync(requestBody);

        if (!parsedBenefitRenewalRequest.success) {
          log.debug('Invalid request body [%j]', requestBody);
          return new HttpResponse('Invalid request body!', { status: 400 });
        }

        const mockBenefitRenewalResponse: BenefitRenewalResponse = {
          BenefitApplication: {
            BenefitRenewalIdentification: [
              {
                IdentificationID: '2476124092174',
                IdentificationCategoryText: 'Confirmation Number',
              },
            ],
          },
        };

        return HttpResponse.json(mockBenefitRenewalResponse);
      }

      const parsedBenefitApplicationRequest = await benefitApplicationRequestSchema.safeParseAsync(requestBody);

      if (!parsedBenefitApplicationRequest.success) {
        log.debug('Invalid request body [%j]', requestBody);
        return new HttpResponse('Invalid request body!', { status: 400 });
      }

      const mockBenefitApplicationResponse: BenefitApplicationResponseEntity = {
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
