import { HttpResponse, http } from 'msw';
import { z } from 'zod';

import { db } from '~/mocks/db';
import { benefitRenewalRequestSchema } from '~/schemas/benefit-renewal-service-schemas.server';
import type { BenefitRenewalResponse } from '~/schemas/benefit-renewal-service-schemas.server';
import { getEnv } from '~/utils/env-utils.server';
import { getLogger } from '~/utils/logging.server';

const sinIdSchema = z.object({
  Applicant: z.object({
    PersonSINIdentification: z.object({
      IdentificationID: z.string(),
    }),
  }),
});

/**
 * Server-side MSW mocks for the Power Platform API.
 */
export function getPowerPlatformApiMockHandlers() {
  const log = getLogger('power-platform-api.server');
  log.info('Initializing Power Platform mock handlers');
  const { INTEROP_API_BASE_URI } = getEnv();

  return [
    //
    // Retrieve personal details information (using POST instead of GET due the sin params logging with GET)
    //
    http.post(`${INTEROP_API_BASE_URI}/dental-care/applicant-information/dts/v1/applicant`, async ({ request }) => {
      log.debug('Handling request for [%s]', request.url);
      const subscriptionKey = request.headers.get('Ocp-Apim-Subscription-Key');
      if (!subscriptionKey) {
        return new HttpResponse('Access denied due to missing subscription key. Make sure to include subscription key when making requests to an API.', { status: 401 });
      }

      const parsedSinId = sinIdSchema.parse(await request.json()).Applicant.PersonSINIdentification.IdentificationID;
      const peronalInformationEntity = getPersonalInformation(parsedSinId);

      if (!peronalInformationEntity) {
        throw new HttpResponse('Client Not found', { status: 204, headers: { 'Content-Type': 'text/plain' } });
      }
      const listOfClientId = [];
      if (peronalInformationEntity.applicantId) {
        listOfClientId.push({ IdentificationID: peronalInformationEntity.applicantId, IdentificationCategoryText: 'Applicant ID' });
      }
      if (peronalInformationEntity.clientNumber) {
        listOfClientId.push({ IdentificationID: peronalInformationEntity.clientNumber, IdentificationCategoryText: 'Client Number' });
      }
      if (peronalInformationEntity.clientId) {
        listOfClientId.push({ IdentificationID: peronalInformationEntity.clientId, IdentificationCategoryText: 'Client ID' });
      }

      const addressList = [];
      if (peronalInformationEntity.homeAddressStreet) {
        addressList.push({
          AddressCategoryCode: {
            ReferenceDataName: 'Home',
          },
          AddressCityName: peronalInformationEntity.homeAddressCityName,
          AddressCountry: {
            CountryCode: {
              ReferenceDataID: peronalInformationEntity.homeAddressCountryReferenceId,
            },
          },
          AddressPostalCode: peronalInformationEntity.homeAddressPostalCode,
          AddressStreet: {
            StreetName: peronalInformationEntity.homeAddressStreet,
          },
          AddressSecondaryUnitText: peronalInformationEntity.homeAddressSecondaryUnitText,
          AddressProvince: {
            ProvinceCode: {
              ReferenceDataID: peronalInformationEntity.homeAddressProvince,
            },
          },
        });
      }
      if (peronalInformationEntity.mailingAddressStreet) {
        addressList.push({
          AddressCategoryCode: {
            ReferenceDataName: 'Mailing',
          },
          AddressCityName: peronalInformationEntity.mailingAddressCityName,
          AddressCountry: {
            CountryCode: {
              ReferenceDataID: peronalInformationEntity.mailingAddressCountryReferenceId,
            },
          },
          AddressPostalCode: peronalInformationEntity.mailingAddressPostalCode,
          AddressStreet: {
            StreetName: peronalInformationEntity.mailingAddressStreet,
          },
          AddressSecondaryUnitText: peronalInformationEntity.mailingAddressSecondaryUnitText,
          AddressProvince: {
            ProvinceCode: {
              ReferenceDataID: peronalInformationEntity.mailingAddressProvince,
            },
          },
        });
      }

      const telephoneNumberList = [];
      if (peronalInformationEntity.primaryTelephoneNumber) {
        telephoneNumberList.push({
          FullTelephoneNumber: {
            TelephoneNumberFullID: peronalInformationEntity.primaryTelephoneNumber,
          },
          TelephoneNumberCategoryCode: {
            ReferenceDataName: 'Primary',
          },
        });
      }
      if (peronalInformationEntity.alternateTelephoneNumber) {
        telephoneNumberList.push({
          FullTelephoneNumber: {
            TelephoneNumberFullID: peronalInformationEntity.alternateTelephoneNumber,
          },
          TelephoneNumberCategoryCode: {
            ReferenceDataName: 'Alternate',
          },
        });
      }

      const nameInfoList = [{ PersonSurName: peronalInformationEntity.lastName, PersonGivenName: [peronalInformationEntity.firstName] }];

      return HttpResponse.json({
        BenefitApplication: {
          Applicant: {
            ApplicantCategoryCode: {
              ReferenceDataID: peronalInformationEntity.applicantCategoryCode,
            },
            ClientIdentification: listOfClientId,
            PersonName: nameInfoList,
            PersonBirthDate: {
              date: peronalInformationEntity.birthdate,
            },
            PersonContactInformation: [
              {
                EmailAddress: [
                  {
                    EmailAddressID: peronalInformationEntity.emailAddressId,
                  },
                ],
                TelephoneNumber: telephoneNumberList,
                Address: addressList,
              },
            ],
            PersonMaritalStatus: {
              StatusCode: {
                ReferenceDataID: peronalInformationEntity.maritialStatus,
              },
            },
            MailingSameAsHomeIndicator: peronalInformationEntity.sameHomeAndMailingAddress,
            PreferredMethodCommunicationCode: {
              ReferenceDataID: peronalInformationEntity.preferredMethodCommunicationCode,
            },
            PersonSINIdentification: {
              IdentificationID: peronalInformationEntity.sinIdentification,
              IdentificationCategoryText: 'some text',
            },
          },
          BenefitApplicationIdentification: [
            {
              IdentificationID: peronalInformationEntity.dentalApplicationID,
              IdentificationCategoryText: 'Dental Application ID',
            },
          ],
        },
      });
    }),

    /**
     * Handler for POST request to submit renewal to Power Platform
     */
    http.post(`${INTEROP_API_BASE_URI}/dental-care/applicant-information/dts/v1/benefit-renewal`, async ({ request }) => {
      log.debug('Handling request for [%s]', request.url);

      const subscriptionKey = request.headers.get('Ocp-Apim-Subscription-Key');
      if (!subscriptionKey) {
        return new HttpResponse('Access denied due to missing subscription key. Make sure to include subscription key when making requests to an API.', { status: 401 });
      }

      const requestBody = await request.json();
      const parsedBenefitRenewalRequest = await benefitRenewalRequestSchema.safeParseAsync(requestBody);

      if (!parsedBenefitRenewalRequest.success) {
        log.debug('Invalid request body [%j]', requestBody);
        return new HttpResponse('Invalid request body!', { status: 400 });
      }

      const mockBenefitRenewalResponse: BenefitRenewalResponse = {
        BenefitRenewal: {
          BenefitRenewalIdentification: [
            {
              IdentificationID: '2476124092174',
              IdentificationCategoryText: 'Confirmation Number',
            },
          ],
        },
      };

      return HttpResponse.json(mockBenefitRenewalResponse);
    }),
  ];
}

/**
 * Retrieves a user entity based on the provided user ID.
 *
 * @param personalSinId - Sin to look up in the database.
 * @returns The user entity if found, otherwise throws a 404 error.
 */
function getPersonalInformation(personalSinId: string) {
  return !personalSinId
    ? undefined
    : db.personalInformation.findFirst({
        where: { sinIdentification: { equals: personalSinId } },
      });
}
