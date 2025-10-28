import { describe, expect, it } from 'vitest';

import type { ServerConfig } from '~/.server/configs';
import type { ClientApplicationBasicInfoRequestDto, ClientApplicationDto, ClientApplicationSinRequestDto } from '~/.server/domain/dtos';
import type { ClientApplicationEntity, ClientApplicationSinRequestEntity } from '~/.server/domain/entities';
import { DefaultClientApplicationDtoMapper } from '~/.server/domain/mappers';

describe('DefaultClientApplicationDtoMapper', () => {
  const mockServerConfig: Pick<
    ServerConfig,
    | 'APPLICANT_CATEGORY_CODE_INDIVIDUAL'
    | 'APPLICANT_CATEGORY_CODE_DEPENDENT_ONLY'
    | 'ENGLISH_LANGUAGE_CODE'
    | 'MARITAL_STATUS_CODE_SINGLE'
    | 'MARITAL_STATUS_CODE_MARRIED'
    | 'MARITAL_STATUS_CODE_COMMON_LAW'
    | 'MARITAL_STATUS_CODE_DIVORCED'
    | 'MARITAL_STATUS_CODE_WIDOWED'
    | 'MARITAL_STATUS_CODE_SEPARATED'
  > = {
    APPLICANT_CATEGORY_CODE_INDIVIDUAL: '111111111',
    APPLICANT_CATEGORY_CODE_DEPENDENT_ONLY: '222222222',
    ENGLISH_LANGUAGE_CODE: 1,
    MARITAL_STATUS_CODE_SINGLE: 'single',
    MARITAL_STATUS_CODE_MARRIED: 'married',
    MARITAL_STATUS_CODE_COMMON_LAW: 'commonlaw',
    MARITAL_STATUS_CODE_DIVORCED: 'divorced',
    MARITAL_STATUS_CODE_WIDOWED: 'widowed',
    MARITAL_STATUS_CODE_SEPARATED: 'separated',
  };
  const mapper = new DefaultClientApplicationDtoMapper(mockServerConfig);

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
                  ReferenceDataID: '1',
                },
                PreferredIndicator: true,
              },
            ],
            PersonMaritalStatus: {
              StatusCode: {
                ReferenceDataID: 'married',
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
                IdentificationID: '00000000-0000-0000-0000-000000000000',
                IdentificationCategoryText: 'Client ID',
              },
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
                ClientIdentification: [
                  {
                    IdentificationID: '10000000003',
                    IdentificationCategoryText: 'Client Number',
                  },
                ],
              },
            ],
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
          maritalStatus: 'married',
          socialInsuranceNumber: '80000002',
          clientId: '00000000-0000-0000-0000-000000000000',
          clientNumber: '00000000000',
        },
        children: [],
        communicationPreferences: {
          email: 'email@example.com',
          preferredLanguage: '1',
          preferredMethodSunLife: 'EMAIL',
          preferredMethodGovernmentOfCanada: 'EMAIL',
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
        typeOfApplication: 'adult-child',
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
        applicationYearId: '00000000-0000-0000-0000-000000000000',
        userId: 'test-user',
      };

      const mockClientApplicationBasicInfoRequestEntity = {
        Applicant: {
          PersonName: { PersonGivenName: ['John'], PersonSurName: 'Doe' },
          PersonBirthDate: { date: '2000-01-01' },
          ClientIdentification: [{ IdentificationID: 'ABC123', IdentificationCategoryText: 'Client Number' }],
        },
        BenefitApplicationYear: { IdentificationID: '00000000-0000-0000-0000-000000000000' },
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
        applicationYearId: '00000000-0000-0000-0000-000000000000',
        userId: 'test-user',
      };

      const mockClientApplicationSinRequestEntity: ClientApplicationSinRequestEntity = {
        Applicant: { PersonSINIdentification: { IdentificationID: '123456789' } },
        BenefitApplicationYear: { IdentificationID: '00000000-0000-0000-0000-000000000000' },
      };

      // Act
      const result = mapper.mapClientApplicationSinRequestDtoToClientApplicationSinRequestEntity(mockClientApplicationSinRequestDto);

      // Assert
      expect(result).toEqual(mockClientApplicationSinRequestEntity);
    });
  });
});
