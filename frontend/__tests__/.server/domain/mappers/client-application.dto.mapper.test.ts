import { describe, expect, it } from 'vitest';

import type { ClientApplicationBasicInfoRequestDto, ClientApplicationDto, ClientApplicationSinRequestDto } from '~/.server/domain/dtos';
import type { ClientApplicationBasicInfoRequestEntity, ClientApplicationEntity, ClientApplicationSinRequestEntity } from '~/.server/domain/entities';
import { ClientApplicationDtoMapperImpl } from '~/.server/domain/mappers';

describe('ClientApplicationDtoMapperImpl', () => {
  const mapper = new ClientApplicationDtoMapperImpl();

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
                        ReferenceDataName: 'Canada',
                      },
                    },
                    AddressPostalCode: 'H0H 0H0',
                    AddressProvince: {
                      ProvinceCode: {
                        ReferenceDataID: 'ON',
                        ReferenceDataName: 'Ontario',
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
                        ReferenceDataName: 'United States',
                      },
                    },
                    AddressPostalCode: '90210',
                    AddressProvince: {
                      ProvinceCode: {
                        ReferenceDataID: 'LA',
                        ReferenceDataName: 'Los Angeles',
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
                    FullTelephoneNumber: {
                      TelephoneNumberFullID: '555-555-5555',
                    },
                    TelephoneNumberCategoryCode: {
                      ReferenceDataName: 'Primary',
                    },
                  },
                  {
                    FullTelephoneNumber: {
                      TelephoneNumberFullID: '555-555-5556',
                    },
                    TelephoneNumberCategoryCode: {
                      ReferenceDataName: 'Alternate',
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
              AttestParentOrGuardianIndicator: false,
              ConsentToSharePersonalInformationIndicator: true,
              DisabilityTaxCreditIndicator: true,
              FederalDentalCoverageIndicator: true,
              InsurancePlan: [
                {
                  InsurancePlanIdentification: [
                    {
                      IdentificationID: 'ID-123456',
                    },
                  ],
                },
              ],
              LivingIndependentlyIndicator: true,
              PrivateDentalInsuranceIndicator: true,
              ProvincialDentalCoverageIndicator: true,
            },
            ClientIdentification: [
              {
                IdentificationID: '00000000000',
                IdentificationCategoryText: 'Client Number',
              },
            ],
            Flags: [
              { Flag: true, FlagCategoryText: 'isCraAssessed' },
              { Flag: false, FlagCategoryText: 'appliedBeforeApril302024' },
            ],
            RelatedPerson: [
              {
                PersonBirthDate: {
                  date: '2000-01-01',
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
          BenefitApplicationChannelCode: {
            ReferenceDataID: 'ONLINE',
          },
          BenefitApplicationCategoryCode: {
            ReferenceDataID: 'DENTAL',
          },
          BenefitApplicationIdentification: [
            {
              IdentificationID: '41d42b4e-0263-ee11-8df0-000d3a09dca9',
              IdentificationCategoryText: 'Dental Application ID',
            },
          ],
          BenefitApplicationYear: {
            BenefitApplicationYearIdentification: [
              {
                IdentificationID: '1',
                IdentificationCategoryText: '2024',
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
          dateOfBirth: '2000-01-01',
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
          PersonName: [{ PersonGivenName: ['John'], PersonSurName: 'Doe' }],
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
