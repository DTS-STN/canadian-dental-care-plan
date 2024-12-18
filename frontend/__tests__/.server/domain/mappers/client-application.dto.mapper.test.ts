import { describe, expect, it } from 'vitest';

import type { ClientApplicationBasicInfoRequestDto, ClientApplicationDto, ClientApplicationSinRequestDto } from '~/.server/domain/dtos';
import type { ClientApplicationBasicInfoRequestEntity, ClientApplicationEntity, ClientApplicationSinRequestEntity } from '~/.server/domain/entities';
import { DefaultClientApplicationDtoMapper } from '~/.server/domain/mappers';

describe('DefaultClientApplicationDtoMapper', () => {
  const mapper = new DefaultClientApplicationDtoMapper();

  describe('mapClientApplicationEntityToClientApplicationDto', () => {
    it('should map ClientApplicationEntity to ClientApplicationDto', () => {
      // Arrange
      const mockClientApplicationEntity: ClientApplicationEntity = {
        BenefitApplication: {
          Applicant: {
            PersonBirthDate: {
              date: '2000-01-01',
            },
            PersonContactInformation: [
              {
                Address: [
                  {
                    AddressCategoryCode: {
                      ReferenceDataName: 'Home',
                    },
                    AddressCityName: 'Home City',
                    AddressCountry: {
                      CountryCode: {
                        ReferenceDataID: 'CAN',
                      },
                    },
                    AddressPostalCode: 'H0H 0H0',
                    AddressProvince: {
                      ProvinceCode: {
                        ReferenceDataID: 'ON',
                      },
                    },
                    AddressSecondaryUnitText: 'Unit 101',
                    AddressStreet: {
                      StreetName: '123 Fake Street',
                    },
                  },
                  {
                    AddressCategoryCode: {
                      ReferenceDataName: 'Mailing',
                    },
                    AddressCityName: 'Mailing City',
                    AddressCountry: {
                      CountryCode: {
                        ReferenceDataID: 'USA',
                      },
                    },
                    AddressPostalCode: '90210',
                    AddressProvince: {
                      ProvinceCode: {
                        ReferenceDataID: 'LA',
                      },
                    },
                    AddressSecondaryUnitText: 'Unit 102',
                    AddressStreet: {
                      StreetName: '456 Fake Street',
                    },
                  },
                ],
                EmailAddress: [
                  {
                    EmailAddressID: 'email@example.com',
                  },
                ],
                TelephoneNumber: [
                  {
                    TelephoneNumberCategoryCode: {
                      ReferenceDataName: 'Primary',
                      ReferenceDataID: '555-555-5555',
                    },
                  },
                  {
                    TelephoneNumberCategoryCode: {
                      ReferenceDataName: 'Alternate',
                      ReferenceDataID: '555-555-5556',
                    },
                  },
                ],
              },
            ],
            PersonLanguage: [
              {
                CommunicationCategoryCode: {
                  ReferenceDataID: 'ENG',
                },
                PreferredIndicator: true,
              },
            ],
            PersonMaritalStatus: {
              StatusCode: {
                ReferenceDataID: 'MARRIED',
              },
            },
            PersonName: [
              {
                PersonGivenName: ['John'],
                PersonSurName: 'Doe',
              },
            ],
            PersonSINIdentification: {
              IdentificationID: '80000002',
            },
            MailingSameAsHomeIndicator: true,
            PreferredMethodCommunicationCode: {
              ReferenceDataID: 'EMAIL',
            },
            ApplicantDetail: {
              DisabilityTaxCreditIndicator: true,
              InsurancePlan: [
                {
                  InsurancePlanIdentification: [
                    {
                      IdentificationID: 'ID-123456',
                    },
                  ],
                },
              ],
              InvitationToApplyIndicator: false,
              LivingIndependentlyIndicator: true,
              PreviousApplicationIndicator: false,
              PreviousTaxesFiledIndicator: true,
              PrivateDentalInsuranceIndicator: true,
            },
            ClientIdentification: [
              {
                IdentificationID: '00000000000',
                IdentificationCategoryText: 'Client Number',
              },
            ],
            RelatedPerson: [
              {
                PersonBirthDate: {
                  YearDate: '2000',
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
                  IdentificationID: '80000002',
                },
                ApplicantDetail: {
                  PrivateDentalInsuranceIndicator: false,
                  InsurancePlan: [],
                  ConsentToSharePersonalInformationIndicator: false,
                  AttestParentOrGuardianIndicator: false,
                },
                ClientIdentification: {
                  IdentificationID: '10000000003',
                  IdentificationCategoryText: 'Client Number',
                },
              },
            ],
          },
          BenefitApplicationChannelCode: {
            ReferenceDataID: 'ONLINE',
          },
          BenefitApplicationCategoryCode: {
            ReferenceDataID: 'DENTAL',
          },
          BenefitApplicationYear: {
            BenefitApplicationYearIdentification: [
              {
                IdentificationID: '2024',
              },
            ],
          },
        },
      };

      const expectedClientApplicationDto: ClientApplicationDto = {
        applicantInformation: {
          firstName: 'John',
          lastName: 'Doe',
          maritalStatus: 'MARRIED',
          socialInsuranceNumber: '80000002',
          clientNumber: '00000000000',
        },
        children: [],
        communicationPreferences: {
          email: 'email@example.com',
          preferredLanguage: 'ENG',
          preferredMethod: 'EMAIL',
        },
        contactInformation: {
          copyMailingAddress: true,
          email: 'email@example.com',
          homeAddress: '123 Fake Street',
          homeApartment: 'Unit 101',
          homeCity: 'Home City',
          homeCountry: 'CAN',
          homePostalCode: 'H0H 0H0',
          homeProvince: 'ON',
          mailingAddress: '456 Fake Street',
          mailingApartment: 'Unit 102',
          mailingCity: 'Mailing City',
          mailingCountry: 'USA',
          mailingPostalCode: '90210',
          mailingProvince: 'LA',
          phoneNumber: '555-555-5555',
          phoneNumberAlt: '555-555-5556',
        },
        dateOfBirth: '2000-01-01',
        dentalBenefits: ['ID-123456'],
        dentalInsurance: true,
        disabilityTaxCredit: true,
        hasFiledTaxes: true,
        isInvitationToApplyClient: false,
        livingIndependently: true,
        partnerInformation: {
          confirm: false,
          yearOfBirth: '2000',
          firstName: 'Jane',
          lastName: 'Doe',
          socialInsuranceNumber: '80000002',
        },
      };

      // Act
      const result = mapper.mapClientApplicationEntityToClientApplicationDto(mockClientApplicationEntity);

      // Assert
      expect(result).toEqual(expectedClientApplicationDto);
    });
  });

  describe('mapClientApplicationBasicInfoRequestDtoToClientApplicationBasicInfoRequestEntity', () => {
    it('should map ClientApplicationBasicInfoRequestDto to ClientApplicationBasicInfoRequestEntity', () => {
      // Arrange
      const mockClientApplicationBasicInfoRequestDto: ClientApplicationBasicInfoRequestDto = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '2000-01-01',
        clientNumber: 'ABC123',
      };

      const mockClientApplicationBasicInfoRequestEntity: ClientApplicationBasicInfoRequestEntity = {
        Applicant: {
          PersonName: { PersonGivenName: ['John'], PersonSurName: 'Doe' },
          PersonBirthDate: { date: '2000-01-01' },
          ClientIdentification: [{ IdentificationID: 'ABC123' }],
        },
      };

      // Act
      const result = mapper.mapClientApplicationBasicInfoRequestDtoToClientApplicationBasicInfoRequestEntity(mockClientApplicationBasicInfoRequestDto);

      // Assert
      expect(result).toEqual(mockClientApplicationBasicInfoRequestEntity);
    });
  });

  describe('mapClientApplicationSinRequestDtoToClientApplicationSinRequestEntity', () => {
    it('should map ClientApplicationSinRequestDto to ClientApplicationSinRequestEntity', () => {
      // Arrange
      const mockClientApplicationSinRequestDto: ClientApplicationSinRequestDto = {
        sin: '123456789',
      };

      const mockClientApplicationSinRequestEntity: ClientApplicationSinRequestEntity = {
        Applicant: { PersonSINIdentification: { IdentificationID: '123456789' } },
      };

      // Act
      const result = mapper.mapClientApplicationSinRequestDtoToClientApplicationSinRequestEntity(mockClientApplicationSinRequestDto);

      // Assert
      expect(result).toEqual(mockClientApplicationSinRequestEntity);
    });
  });
});
