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
          ApplicationId: '038d9d0f-fb35-4d98-8f31-a4b2171e521a',
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
                          {
                            IdentificationID: 'e174250d-26c5-ee11-9079-000d3a09d640',
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
                          AddressCityName: 'Fake City',
                          AddressCountry: {
                            CountryCode: {
                              ReferenceDataID: '0cf5389e-97ae-eb11-8236-000d3af4bfc3',
                            },
                          },
                          AddressPostalCode: 'J8T 7X7',
                          AddressProvince: {
                            ProvinceCode: {
                              ReferenceDataID: '5abc28c9-38b3-eb11-8236-0022486d8d5f',
                            },
                          },
                          AddressSecondaryUnitText: '',
                          AddressStreet: {
                            StreetName: 'Not True Crescent',
                          },
                        },
                        {
                          AddressCategoryCode: {
                            ReferenceDataName: 'Home',
                          },
                          AddressCityName: 'Home City',
                          AddressCountry: {
                            CountryCode: {
                              ReferenceDataID: '0cf5389e-97ae-eb11-8236-000d3af4bfc3',
                            },
                          },
                          AddressPostalCode: 'J8T 7X7',
                          AddressProvince: {
                            ProvinceCode: {
                              ReferenceDataID: '5abc28c9-38b3-eb11-8236-0022486d8d5f',
                            },
                          },
                          AddressSecondaryUnitText: '',
                          AddressStreet: {
                            StreetName: '987 Incomplete Street',
                          },
                        },
                      ],
                      EmailAddress: [
                        {
                          EmailAddressID: 'fake@example.com',
                        },
                      ],
                      TelephoneNumber: [
                        {
                          TelephoneNumberCategoryCode: {
                            ReferenceDataID: '555 432 4342',
                            ReferenceDataName: 'Primary',
                          },
                        },
                        {
                          TelephoneNumberCategoryCode: {
                            ReferenceDataID: '555 542 3242',
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
                      PersonGivenName: ['First Middle'],
                      PersonSurName: 'Last',
                    },
                  ],
                  PersonSINIdentification: {
                    IdentificationID: '800001083',
                  },
                  RelatedPerson: [
                    {
                      PersonBirthDate: {
                        date: '1966-10-06',
                        dateTime: '1966-10-06T04:00:00.000Z',
                        DayDate: '06',
                        MonthDate: '10',
                        YearDate: '1966',
                      },
                      PersonName: [
                        {
                          PersonGivenName: ['Spouse'],
                          PersonSurName: 'Partner',
                        },
                      ],
                      PersonRelationshipCode: {
                        ReferenceDataName: 'Spouse',
                      },
                      PersonSINIdentification: {
                        IdentificationID: '800000994',
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
          ApplicationId: '038d9d0f-fb35-4d98-9d34-a4b2171e789b',
          SubmittedDate: '2021/03/05',
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
                    date: '1941-04-19',
                    dateTime: '1941-09-22T04:00:00.000Z',
                    DayDate: '19',
                    MonthDate: '04',
                    YearDate: '1941',
                  },
                  PersonContactInformation: [
                    {
                      Address: [
                        {
                          AddressCategoryCode: {
                            ReferenceDataName: 'Mailing',
                          },
                          AddressCityName: 'Not Real Town',
                          AddressCountry: {
                            CountryCode: {
                              ReferenceDataID: '0cf5389e-97ae-eb11-8236-000d3af4bfc3',
                            },
                          },
                          AddressPostalCode: 'J8T 7X7',
                          AddressProvince: {
                            ProvinceCode: {
                              ReferenceDataID: '9c440baa-35b3-eb11-8236-0022486d8d5f',
                            },
                          },
                          AddressSecondaryUnitText: '',
                          AddressStreet: {
                            StreetName: '2343 Random Street',
                          },
                        },
                        {
                          AddressCategoryCode: {
                            ReferenceDataName: 'Home',
                          },
                          AddressCityName: 'Vancouver',
                          AddressCountry: {
                            CountryCode: {
                              ReferenceDataID: '0cf5389e-97ae-eb11-8236-000d3af4bfc3',
                            },
                          },
                          AddressPostalCode: 'J8T 7X7',
                          AddressProvince: {
                            ProvinceCode: {
                              ReferenceDataID: '9c440baa-35b3-eb11-8236-0022486d8d5f',
                            },
                          },
                          AddressSecondaryUnitText: '',
                          AddressStreet: {
                            StreetName: '2323 Pseudo Road',
                          },
                        },
                      ],
                      EmailAddress: [
                        {
                          EmailAddressID: 'someemail@example.com',
                        },
                      ],
                      TelephoneNumber: [
                        {
                          TelephoneNumberCategoryCode: {
                            ReferenceDataID: '555 000 0001',
                            ReferenceDataName: 'Primary',
                          },
                        },
                        {
                          TelephoneNumberCategoryCode: {
                            ReferenceDataID: '555 201 0301',
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
                      PersonGivenName: ['Imaginary'],
                      PersonSurName: 'Person',
                    },
                  ],
                  PersonSINIdentification: {
                    IdentificationID: '800000895',
                  },
                  RelatedPerson: [
                    {
                      PersonBirthDate: {
                        date: '1942-01-01',
                        dateTime: '1942-01-01T04:00:00.000Z',
                        DayDate: '01',
                        MonthDate: '01',
                        YearDate: '1942',
                      },
                      PersonName: [
                        {
                          PersonGivenName: ['Pretend'],
                          PersonSurName: 'Identity',
                        },
                      ],
                      PersonRelationshipCode: {
                        ReferenceDataName: 'Spouse',
                      },
                      PersonSINIdentification: {
                        IdentificationID: '800000549',
                      },
                      ApplicantDetail: {
                        ConsentToSharePersonalInformationIndicator: true,
                        AttestParentOrGuardianIndicator: false,
                        PrivateDentalInsuranceIndicator: true,
                        InsurancePlan: [
                          {
                            InsurancePlanIdentification: [
                              {
                                IdentificationID: 'fdf25fea-a7a9-ee11-a569-000d3af4f898',
                              },
                              {
                                IdentificationID: 'e174250d-26c5-ee11-9079-000d3a09d640',
                              },
                            ],
                          },
                        ],
                      },
                    },
                    {
                      PersonBirthDate: {
                        date: '1983-07-02',
                        dateTime: '1983-07-02T04:00:00.000Z',
                        DayDate: '02',
                        MonthDate: '07',
                        YearDate: '1983',
                      },
                      PersonName: [
                        {
                          PersonGivenName: ['Child'],
                          PersonSurName: 'Three',
                        },
                      ],
                      PersonRelationshipCode: {
                        ReferenceDataName: 'Dependent',
                      },
                      PersonSINIdentification: {
                        IdentificationID: '800009946',
                      },
                      ApplicantDetail: {
                        ConsentToSharePersonalInformationIndicator: true,
                        AttestParentOrGuardianIndicator: false,
                        PrivateDentalInsuranceIndicator: true,
                        InsurancePlan: [
                          {
                            InsurancePlanIdentification: [
                              {
                                IdentificationID: 'fdf25fea-a7a9-ee11-a569-000d3af4f898',
                              },
                              {
                                IdentificationID: 'e174250d-26c5-ee11-9079-000d3a09d640',
                              },
                            ],
                          },
                        ],
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
