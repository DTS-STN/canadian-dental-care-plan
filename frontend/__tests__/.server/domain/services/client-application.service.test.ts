import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { ClientApplicationDto } from '~/.server/domain/dtos';
import type { ClientApplicationEntity } from '~/.server/domain/entities';
import type { ClientApplicationDtoMapper } from '~/.server/domain/mappers';
import type { ClientApplicationRepository } from '~/.server/domain/repositories';
import type { FindByPersonalInfoSearchCriteria } from '~/.server/domain/services';
import { ClientApplicationServiceImpl } from '~/.server/domain/services';
import type { LogFactory, Logger } from '~/.server/factories';

describe('ClientApplicationServiceImpl', () => {
  const mockLogFactory = mock<LogFactory>();
  mockLogFactory.createLogger.mockReturnValue(mock<Logger>());

  // Mock for ClientApplicationEntity
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
          IdentificationID: 'SIN-987654321',
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
              IdentificationID: 'SIN-123456789',
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

  // Mock for ClientApplicationDto
  const mockClientApplicationDto: ClientApplicationDto = {
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
          IdentificationID: 'SIN-987654321',
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
              IdentificationID: 'SIN-123456789',
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
      BenefitApplicationCategoryCode: {
        ReferenceDataID: 'DENTAL',
      },
      BenefitApplicationChannelCode: {
        ReferenceDataID: 'ONLINE',
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

  describe('findClientApplicationBySin', () => {
    it('should find client application by SIN', async () => {
      // Arrange
      const mockClientApplicationRepository = mock<ClientApplicationRepository>();
      mockClientApplicationRepository.findClientApplicationBySin.mockResolvedValue(mockClientApplicationEntity);

      const mockClientApplicationDtoMapper = mock<ClientApplicationDtoMapper>();
      mockClientApplicationDtoMapper.mapClientApplicationEntityToClientApplicationDto.mockReturnValue(mockClientApplicationDto);

      const service = new ClientApplicationServiceImpl(mockLogFactory, mockClientApplicationDtoMapper, mockClientApplicationRepository);
      const sin = '123456789';

      // Act
      const result = await service.findClientApplicationBySin(sin);

      // Assert
      expect(result).toEqual(mockClientApplicationDto);
      expect(mockClientApplicationRepository.findClientApplicationBySin).toHaveBeenCalledWith(sin);
      expect(mockClientApplicationDtoMapper.mapClientApplicationEntityToClientApplicationDto).toHaveBeenCalledWith(mockClientApplicationEntity);
    });

    it('should return null if client application is not found by SIN', async () => {
      const mockClientApplicationRepository = mock<ClientApplicationRepository>();
      mockClientApplicationRepository.findClientApplicationBySin.mockResolvedValue(null);

      const mockClientApplicationDtoMapper = mock<ClientApplicationDtoMapper>();

      const service = new ClientApplicationServiceImpl(mockLogFactory, mockClientApplicationDtoMapper, mockClientApplicationRepository);
      const sin = '123456789';

      // Act
      const result = await service.findClientApplicationBySin(sin);

      // Assert
      expect(result).toBeNull();
      expect(mockClientApplicationRepository.findClientApplicationBySin).toHaveBeenCalledWith(sin);
      expect(mockClientApplicationDtoMapper.mapClientApplicationEntityToClientApplicationDto).not.toBeCalled();
    });
  });

  describe('findClientApplicationByCriteria', () => {
    it('should find client application by criteria', async () => {
      // Arrange
      const mockClientApplicationRepository = mock<ClientApplicationRepository>();
      mockClientApplicationRepository.findClientApplicationByCriteria.mockResolvedValue(mockClientApplicationEntity);

      const mockClientApplicationDtoMapper = mock<ClientApplicationDtoMapper>();
      mockClientApplicationDtoMapper.mapClientApplicationEntityToClientApplicationDto.mockReturnValue(mockClientApplicationDto);

      const service = new ClientApplicationServiceImpl(mockLogFactory, mockClientApplicationDtoMapper, mockClientApplicationRepository);

      const searchCriteria: FindByPersonalInfoSearchCriteria = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '2000-01-01',
        clientNumber: 'ABC123',
      };

      // Act
      const result = await service.findClientApplicationByPersonalInfo(searchCriteria);

      // Assert
      expect(result).toEqual(mockClientApplicationDto);
      expect(mockClientApplicationRepository.findClientApplicationByCriteria).toHaveBeenCalledWith(searchCriteria);
      expect(mockClientApplicationDtoMapper.mapClientApplicationEntityToClientApplicationDto).toHaveBeenCalledWith(mockClientApplicationEntity);
    });

    it('should return null if client application is not found by criteria', async () => {
      // Arrange
      const mockClientApplicationRepository = mock<ClientApplicationRepository>();
      mockClientApplicationRepository.findClientApplicationByCriteria.mockResolvedValue(null);

      const mockClientApplicationDtoMapper = mock<ClientApplicationDtoMapper>();

      const service = new ClientApplicationServiceImpl(mockLogFactory, mockClientApplicationDtoMapper, mockClientApplicationRepository);

      const searchCriteria: FindByPersonalInfoSearchCriteria = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '2000-01-01',
        clientNumber: 'ABC123',
      };

      // Act
      const result = await service.findClientApplicationByPersonalInfo(searchCriteria);

      // Assert
      expect(result).toBeNull();
      expect(mockClientApplicationRepository.findClientApplicationByCriteria).toHaveBeenCalledWith(searchCriteria);
      expect(mockClientApplicationDtoMapper.mapClientApplicationEntityToClientApplicationDto).not.toBeCalled();
    });
  });
});
