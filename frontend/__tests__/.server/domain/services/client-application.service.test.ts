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
        ApplicantDetail: {
          PrivateDentalInsuranceIndicator: true,
          InsurancePlan: [
            {
              InsurancePlanIdentification: [
                {
                  IdentificationID: 'ID-123456',
                },
              ],
            },
          ],
          ConsentToSharePersonalInformationIndicator: true,
          AttestParentOrGuardianIndicator: false,
        },
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
                TelephoneNumberCategoryCode: {
                  ReferenceDataID: 'MOBILE',
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
              ReferenceDataName: 'English',
            },
            PreferredIndicator: true,
          },
        ],
        PersonMaritalStatus: {
          StatusCode: {
            ReferenceDataID: 'MARRIED',
            ReferenceDataName: 'Married',
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
        MailingSameAsHomeIndicator: true,
        PreferredMethodCommunicationCode: {
          ReferenceDataID: 'EMAIL',
          ReferenceDataName: 'Email',
        },
      },
      BenefitApplicationCategoryCode: {
        ReferenceDataID: 'DENTAL',
        ReferenceDataName: 'Dental',
      },
      BenefitApplicationChannelCode: {
        ReferenceDataID: 'ONLINE',
        ReferenceDataName: 'Online',
      },
    },
  };

  // Mock for ClientApplicationDto
  const mockClientApplicationDto: ClientApplicationDto = {
    BenefitApplication: {
      Applicant: {
        ApplicantDetail: {
          PrivateDentalInsuranceIndicator: true,
          InsurancePlan: [
            {
              InsurancePlanIdentification: [
                {
                  IdentificationID: 'ID-123456',
                },
              ],
            },
          ],
          ConsentToSharePersonalInformationIndicator: true,
          AttestParentOrGuardianIndicator: false,
        },
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
                TelephoneNumberCategoryCode: {
                  ReferenceDataID: 'MOBILE',
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
              ReferenceDataName: 'English',
            },
            PreferredIndicator: true,
          },
        ],
        PersonMaritalStatus: {
          StatusCode: {
            ReferenceDataID: 'MARRIED',
            ReferenceDataName: 'Married',
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
        MailingSameAsHomeIndicator: true,
        PreferredMethodCommunicationCode: {
          ReferenceDataID: 'EMAIL',
          ReferenceDataName: 'Email',
        },
      },
      BenefitApplicationCategoryCode: {
        ReferenceDataID: 'DENTAL',
        ReferenceDataName: 'Dental',
      },
      BenefitApplicationChannelCode: {
        ReferenceDataID: 'ONLINE',
        ReferenceDataName: 'Online',
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
