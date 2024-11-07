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
                    AddressCityName: 'Toronto',
                    AddressCountry: {
                      CountryCode: {
                        ReferenceDataID: 'CAN',
                        ReferenceDataName: 'Canada',
                      },
                    },
                    AddressPostalCode: 'M5H 2N2',
                    AddressProvince: {
                      ProvinceCode: {
                        ReferenceDataID: 'ON',
                        ReferenceDataName: 'Ontario',
                      },
                    },
                    AddressSecondaryUnitText: 'Unit 101',
                    AddressStreet: {
                      StreetName: 'Main St',
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
                      ReferenceDataName: 'Mobile',
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
                IdentificationID: '4f35f70b-2f83-ee11-8179-000d3a09d000',
                IdentificationCategoryText: 'Applicant ID',
              },
              {
                IdentificationID: '1e97fe42-0263-ee11-8df0-000d3a09df08',
                IdentificationCategoryText: 'Client ID',
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
                  ReferenceDataName: 'Sibling',
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
        clientNumber: '4f35f70b-2f83-ee11-8179-000d3a09d000',
        dateOfBirth: '2000-01-01',
        firstName: 'John',
        hasAppliedBeforeApril302024: false,
        hasBeenAssessedByCRA: true,
        lastName: 'Doe',
        sin: '80000002',
        children: [],
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
