import { HttpResponse, http } from 'msw';
import { z } from 'zod';

import { getLogger } from '~/utils/logging.server';

const log = getLogger('client-application-api.server');

/**
 * Server-side MSW mocks for the Client Application API
 */
export function getClientApplicationApiMockHandlers() {
  log.info('Initializing Client Application mock handlers');

  return [
    http.post('https://api.example.com/v1/client-application', async ({ request }) => {
      log.debug('Handling request for [%s]', request.url);
      const clientApplicationRequestSchema = z.object({
        BenefitApplication: z.object({
          Applicant: z.object({
            PersonSINIdentification: z.object({
              IdentificationID: z.string(),
            }),
          }),
        }),
      });

      const clientApplicationRequest = clientApplicationRequestSchema.safeParse(await request.json());
      if (!clientApplicationRequest.success) {
        return new HttpResponse(null, { status: 400 });
      }

      return HttpResponse.json(MOCK_CLIENT_APPLICATION_RESPONSE);
    }),

    http.post('https://api.example.com/v1/client-application_fnlndob', async ({ request }) => {
      log.debug('Handling request for [%s]', request.url);
      const clientApplicationRequestSchema = z.object({
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

      const clientApplicationRequest = clientApplicationRequestSchema.safeParse(await request.json());
      if (!clientApplicationRequest.success) {
        return new HttpResponse(null, { status: 400 });
      }

      return HttpResponse.json(MOCK_CLIENT_APPLICATION_RESPONSE);
    }),
  ];
}

const MOCK_CLIENT_APPLICATION_RESPONSE = {
  BenefitApplication: {
    Applicant: {
      ApplicantDetail: {
        PrivateDentalInsuranceIndicator: true,
        InsurancePlan: [
          {
            InsurancePlanIdentification: [
              {
                IdentificationID: '5a5c5294-26c5-ee11-9079-000d3a09d640',
              },
              {
                IdentificationID: '07f35fea-a7a9-ee11-a569-000d3af4f898',
              },
            ],
          },
        ],
      },
      PersonBirthDate: {
        date: '1950-01-01',
      },
      PersonContactInformation: [
        {
          Address: [
            {
              AddressCategoryCode: {
                ReferenceDataName: 'Mailing',
              },
              AddressCityName: 'Faketown',
              AddressCountry: {
                CountryCode: {
                  ReferenceDataID: '0cf5389e-97ae-eb11-8236-000d3af4bfc3',
                },
              },
              AddressPostalCode: 'T0H 0H0',
              AddressProvince: {
                ProvinceCode: {
                  ReferenceDataID: '3b17d494-35b3-eb11-8236-0022486d8d5f',
                },
              },
              AddressSecondaryUnitText: '1 fake suite',
              AddressStreet: {
                StreetName: '123 fake street',
              },
            },
            {
              AddressCategoryCode: {
                ReferenceDataName: 'Home',
              },
              AddressCityName: 'Faketown',
              AddressCountry: {
                CountryCode: {
                  ReferenceDataID: '0cf5389e-97ae-eb11-8236-000d3af4bfc3',
                },
              },
              AddressPostalCode: 'T0H 0H0',
              AddressProvince: {
                ProvinceCode: {
                  ReferenceDataID: '3b17d494-35b3-eb11-8236-0022486d8d5f',
                },
              },
              AddressSecondaryUnitText: '1 fake suite',
              AddressStreet: {
                StreetName: '123 fake street',
              },
            },
          ],
          EmailAddress: [
            {
              EmailAddressID: 'fake.email@email.com',
            },
          ],
          TelephoneNumber: [
            {
              TelephoneNumberCategoryCode: {
                ReferenceDataID: '+1 555 555 5555',
                ReferenceDataName: 'Primary',
              },
            },
            {
              TelephoneNumberCategoryCode: {
                ReferenceDataID: '+1 555 555 5555',
                ReferenceDataName: 'Alternate',
              },
            },
          ],
        },
      ],
      PersonLanguage: [
        {
          CommunicationCategoryCode: {
            ReferenceDataID: '1033',
          },
          PreferredIndicator: true,
        },
      ],
      PersonMaritalStatus: {
        StatusCode: {
          ReferenceDataID: '775170001',
        },
      },
      PersonName: [
        {
          PersonGivenName: ['John'],
          PersonSurName: 'Doe',
        },
      ],
      PersonSINIdentification: {
        IdentificationID: '800 000 002',
      },
      RelatedPerson: [
        {
          PersonBirthDate: {
            date: '1950-01-01',
          },
          PersonName: [
            {
              PersonGivenName: ['Jane'],
              PersonSurName: 'Doe',
            },
          ],
          PersonRelationshipCode: {
            ReferenceDataName: 'Spouse',
          },
          PersonSINIdentification: {
            IdentificationID: '900 000 001',
          },
          ApplicantDetail: {
            ConsentToSharePersonalInformationIndicator: true,
          },
        },
        {
          PersonBirthDate: {
            date: '2020-01-01',
          },
          PersonName: [
            {
              PersonGivenName: ['Jack'],
              PersonSurName: 'Doe',
            },
          ],
          PersonRelationshipCode: {
            ReferenceDataName: 'Dependant',
          },
          PersonSINIdentification: {
            IdentificationID: '800 000 003',
          },
          ApplicantDetail: {
            AttestParentOrGuardianIndicator: true,
            PrivateDentalInsuranceIndicator: true,
            InsurancePlan: [
              {
                InsurancePlanIdentification: [
                  {
                    IdentificationID: '5a5c5294-26c5-ee11-9079-000d3a09d640',
                  },
                  {
                    IdentificationID: 'bdf25fea-a7a9-ee11-a569-000d3af4f898',
                  },
                ],
              },
            ],
          },
        },
      ],
      MailingSameAsHomeIndicator: true,
      PreferredMethodCommunicationCode: {
        ReferenceDataID: '775170002',
      },
    },
    BenefitApplicationCategoryCode: {
      ReferenceDataID: '775170001',
    },
    BenefitApplicationChannelCode: {
      ReferenceDataID: '775170001',
    },
  },
};
