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
          Data: [
            {
              BenefitApplication: {
                Applicant: {
                  ApplicantDetail: {
                    PrivateDentalInsuranceIndicator: true,
                    DisabilityTaxCreditIndicator: true,
                    InsurancePlan: [
                      {
                        InsurancePlanIdentification: [
                          {
                            IdentificationID: 'fdf25fea-a7a9-ee11-a569-000d3af4f898',
                          },
                        ],
                      },
                    ],
                  },
                  PersonBirthDate: {
                    date: '1965-09-22',
                    dateTime: '1965-09-22T04:00:00.000Z',
                    DayDate: '22',
                    MonthDate: '09',
                    YearDate: '1965',
                  },
                  PersonContactInformation: [
                    {
                      Address: [
                        {
                          AddressCategoryCode: {
                            ReferenceDataName: 'Mailing',
                          },
                          AddressCityName: "St. John's",
                          AddressCountry: {
                            CountryCode: {
                              ReferenceDataID: '0cf5389e-97ae-eb11-8236-000d3af4bfc3',
                            },
                          },
                          AddressPostalCode: 'A1B 5B9',
                          AddressProvince: {
                            ProvinceCode: {
                              ReferenceDataID: '5abc28c9-38b3-eb11-8236-0022486d8d5f',
                            },
                          },
                          AddressSecondaryUnitText: '',
                          AddressStreet: {
                            StreetName: '66 Seaborn St',
                          },
                        },
                        {
                          AddressCategoryCode: {
                            ReferenceDataName: 'Home',
                          },
                          AddressCityName: "St. John's",
                          AddressCountry: {
                            CountryCode: {
                              ReferenceDataID: '0cf5389e-97ae-eb11-8236-000d3af4bfc3',
                            },
                          },
                          AddressPostalCode: 'A1B 5B9',
                          AddressProvince: {
                            ProvinceCode: {
                              ReferenceDataID: '5abc28c9-38b3-eb11-8236-0022486d8d5f',
                            },
                          },
                          AddressSecondaryUnitText: '',
                          AddressStreet: {
                            StreetName: '66 Seaborn St',
                          },
                        },
                      ],
                      EmailAddress: [
                        {
                          EmailAddressID: 'goldfish@bowl.ca',
                        },
                      ],
                      TelephoneNumber: [
                        {
                          TelephoneNumberCategoryCode: {
                            ReferenceDataID: '+1 702 656 2843',
                            ReferenceDataName: 'Primary',
                          },
                        },
                        {
                          TelephoneNumberCategoryCode: {
                            ReferenceDataID: '+1 416 363 2653',
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
                      PersonGivenName: ['Claudia Jean'],
                      PersonSurName: 'Cregg',
                    },
                  ],
                  PersonSINIdentification: {
                    IdentificationID: '723 435 814',
                  },
                  RelatedPerson: [
                    {
                      PersonBirthDate: {
                        date: '1965-10-06',
                        dateTime: '1965-10-06T04:00:00.000Z',
                        DayDate: '06',
                        MonthDate: '10',
                        YearDate: '1965',
                      },
                      PersonName: [
                        {
                          PersonGivenName: ['Danny'],
                          PersonSurName: 'Concannon',
                        },
                      ],
                      PersonRelationshipCode: {
                        ReferenceDataName: 'Spouse',
                      },
                      PersonSINIdentification: {
                        IdentificationID: '146 614 235',
                      },
                      ApplicantDetail: {
                        ConsentToSharePersonalInformationIndicator: true,
                      },
                    },
                  ],
                  MailingSameAsHomeIndicator: true,
                  PreferredMethodCommunicationCode: {
                    ReferenceDataID: '775170000',
                  },
                },
                BenefitApplicationCategoryCode: {
                  ReferenceDataID: '775170000',
                },
                BenefitApplicationChannelCode: {
                  ReferenceDataID: '775170001',
                },
              },
            },
          ],
        },
        {
          AppicationId: '038d9d0f-fb35-4d98-9d34-a4b2171e789b',
          SubmittedDate: '2024/03/05',
          ApplicationStatus: 'Approved',
          ConfirmationCode: '202403054231',
          Data: [
            {
              BenefitApplication: {
                Applicant: {
                  ApplicantDetail: {
                    PrivateDentalInsuranceIndicator: true,
                    DisabilityTaxCreditIndicator: true,
                    InsurancePlan: [
                      {
                        InsurancePlanIdentification: [
                          {
                            IdentificationID: 'fdf25fea-a7a9-ee11-a569-000d3af4f898',
                          },
                        ],
                      },
                    ],
                  },
                  PersonBirthDate: {
                    date: '1965-09-22',
                    dateTime: '1965-09-22T04:00:00.000Z',
                    DayDate: '22',
                    MonthDate: '09',
                    YearDate: '1965',
                  },
                  PersonContactInformation: [
                    {
                      Address: [
                        {
                          AddressCategoryCode: {
                            ReferenceDataName: 'Mailing',
                          },
                          AddressCityName: "St. John's",
                          AddressCountry: {
                            CountryCode: {
                              ReferenceDataID: '0cf5389e-97ae-eb11-8236-000d3af4bfc3',
                            },
                          },
                          AddressPostalCode: 'A1B 5B9',
                          AddressProvince: {
                            ProvinceCode: {
                              ReferenceDataID: '5abc28c9-38b3-eb11-8236-0022486d8d5f',
                            },
                          },
                          AddressSecondaryUnitText: '',
                          AddressStreet: {
                            StreetName: '66 Seaborn St',
                          },
                        },
                        {
                          AddressCategoryCode: {
                            ReferenceDataName: 'Home',
                          },
                          AddressCityName: "St. John's",
                          AddressCountry: {
                            CountryCode: {
                              ReferenceDataID: '0cf5389e-97ae-eb11-8236-000d3af4bfc3',
                            },
                          },
                          AddressPostalCode: 'A1B 5B9',
                          AddressProvince: {
                            ProvinceCode: {
                              ReferenceDataID: '5abc28c9-38b3-eb11-8236-0022486d8d5f',
                            },
                          },
                          AddressSecondaryUnitText: '',
                          AddressStreet: {
                            StreetName: '66 Seaborn St',
                          },
                        },
                      ],
                      EmailAddress: [
                        {
                          EmailAddressID: 'goldfish@bowl.ca',
                        },
                      ],
                      TelephoneNumber: [
                        {
                          TelephoneNumberCategoryCode: {
                            ReferenceDataID: '+1 702 656 2843',
                            ReferenceDataName: 'Primary',
                          },
                        },
                        {
                          TelephoneNumberCategoryCode: {
                            ReferenceDataID: '+1 416 363 2653',
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
                      PersonGivenName: ['Claudia Jean'],
                      PersonSurName: 'Cregg',
                    },
                  ],
                  PersonSINIdentification: {
                    IdentificationID: '723 435 814',
                  },
                  RelatedPerson: [
                    {
                      PersonBirthDate: {
                        date: '1965-10-06',
                        dateTime: '1965-10-06T04:00:00.000Z',
                        DayDate: '06',
                        MonthDate: '10',
                        YearDate: '1965',
                      },
                      PersonName: [
                        {
                          PersonGivenName: ['Danny'],
                          PersonSurName: 'Concannon',
                        },
                      ],
                      PersonRelationshipCode: {
                        ReferenceDataName: 'Spouse',
                      },
                      PersonSINIdentification: {
                        IdentificationID: '146 614 235',
                      },
                      ApplicantDetail: {
                        ConsentToSharePersonalInformationIndicator: true,
                      },
                    },
                  ],
                  MailingSameAsHomeIndicator: true,
                  PreferredMethodCommunicationCode: {
                    ReferenceDataID: '775170000',
                  },
                },
                BenefitApplicationCategoryCode: {
                  ReferenceDataID: '775170000',
                },
                BenefitApplicationChannelCode: {
                  ReferenceDataID: '775170001',
                },
              },
            },
          ],
        },
      ]);
    }),
  ];
}
