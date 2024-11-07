import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { ClientApplicationBasicInfoRequestDto, ClientApplicationDto, ClientApplicationSinRequestDto } from '~/.server/domain/dtos';
import type { ClientApplicationBasicInfoRequestEntity, ClientApplicationEntity, ClientApplicationSinRequestEntity } from '~/.server/domain/entities';
import type { ClientApplicationDtoMapper } from '~/.server/domain/mappers';
import type { ClientApplicationRepository } from '~/.server/domain/repositories';
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
              IdentificationID: '90000001',
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
    clientNumber: 'ABC123',
    dateOfBirth: '2000-01-01',
    firstName: 'John',
    hasAppliedBeforeApril302024: false,
    hasBeenAssessedByCRA: true,
    lastName: 'Doe',
    sin: '80000002',
    children: [
      {
        information: {
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '2000-01-01',
          clientNumber: '123456789',
        },
      },
    ],
  };

  describe('findClientApplicationBySin', () => {
    it('should find client application by SIN', async () => {
      // Arrange
      const mockClientApplicationSinRequestDto: ClientApplicationSinRequestDto = { sin: '80000002' };
      const mockClientApplicationSinRequestEntity: ClientApplicationSinRequestEntity = { Applicant: { PersonSINIdentification: { IdentificationID: mockClientApplicationSinRequestDto.sin } } };

      const mockClientApplicationRepository = mock<ClientApplicationRepository>();
      mockClientApplicationRepository.findClientApplicationBySin.mockResolvedValue(mockClientApplicationEntity);

      const mockClientApplicationDtoMapper = mock<ClientApplicationDtoMapper>();
      mockClientApplicationDtoMapper.mapClientApplicationEntityToClientApplicationDto.mockReturnValue(mockClientApplicationDto);
      mockClientApplicationDtoMapper.mapClientApplicationSinRequestDtoToClientApplicationSinRequestEntity.mockReturnValue(mockClientApplicationSinRequestEntity);

      const service = new ClientApplicationServiceImpl(mockLogFactory, mockClientApplicationDtoMapper, mockClientApplicationRepository);

      // Act
      const result = await service.findClientApplicationBySin(mockClientApplicationSinRequestDto);

      // Assert
      expect(result).toEqual(mockClientApplicationDto);
      expect(mockClientApplicationDtoMapper.mapClientApplicationSinRequestDtoToClientApplicationSinRequestEntity).toHaveBeenCalledWith(mockClientApplicationSinRequestDto);
      expect(mockClientApplicationRepository.findClientApplicationBySin).toHaveBeenCalledWith(mockClientApplicationSinRequestEntity);
      expect(mockClientApplicationDtoMapper.mapClientApplicationEntityToClientApplicationDto).toHaveBeenCalledWith(mockClientApplicationEntity);
    });

    it('should return null if client application is not found by SIN', async () => {
      const mockClientApplicationSinRequestDto: ClientApplicationSinRequestDto = { sin: '80000002' };
      const mockClientApplicationSinRequestEntity: ClientApplicationSinRequestEntity = { Applicant: { PersonSINIdentification: { IdentificationID: mockClientApplicationSinRequestDto.sin } } };

      const mockClientApplicationRepository = mock<ClientApplicationRepository>();
      mockClientApplicationRepository.findClientApplicationBySin.mockResolvedValue(null);

      const mockClientApplicationDtoMapper = mock<ClientApplicationDtoMapper>();
      mockClientApplicationDtoMapper.mapClientApplicationSinRequestDtoToClientApplicationSinRequestEntity.mockReturnValue(mockClientApplicationSinRequestEntity);

      const service = new ClientApplicationServiceImpl(mockLogFactory, mockClientApplicationDtoMapper, mockClientApplicationRepository);

      // Act
      const result = await service.findClientApplicationBySin(mockClientApplicationSinRequestDto);

      // Assert
      expect(result).toBeNull();
      expect(mockClientApplicationDtoMapper.mapClientApplicationSinRequestDtoToClientApplicationSinRequestEntity).toHaveBeenCalledWith(mockClientApplicationSinRequestDto);
      expect(mockClientApplicationRepository.findClientApplicationBySin).toHaveBeenCalledWith(mockClientApplicationSinRequestEntity);
      expect(mockClientApplicationDtoMapper.mapClientApplicationEntityToClientApplicationDto).not.toBeCalled();
    });
  });

  describe('findClientApplicationByBasicInfo', () => {
    it('should find client application by basic info', async () => {
      // Arrange
      const mockClientApplicationBasicInfoRequestDto: ClientApplicationBasicInfoRequestDto = { firstName: 'John', lastName: 'Doe', dateOfBirth: '2000-01-01', clientNumber: 'ABC123' };
      const mockClientApplicationBasicInfoRequestEntity: ClientApplicationBasicInfoRequestEntity = {
        Applicant: {
          PersonName: [{ PersonGivenName: [mockClientApplicationBasicInfoRequestDto.firstName], PersonSurName: mockClientApplicationBasicInfoRequestDto.lastName }],
          PersonBirthDate: { date: mockClientApplicationBasicInfoRequestDto.dateOfBirth },
          ClientIdentification: [{ IdentificationID: mockClientApplicationBasicInfoRequestDto.clientNumber }],
        },
      };

      const mockClientApplicationRepository = mock<ClientApplicationRepository>();
      mockClientApplicationRepository.findClientApplicationByBasicInfo.mockResolvedValue(mockClientApplicationEntity);

      const mockClientApplicationDtoMapper = mock<ClientApplicationDtoMapper>();
      mockClientApplicationDtoMapper.mapClientApplicationEntityToClientApplicationDto.mockReturnValue(mockClientApplicationDto);
      mockClientApplicationDtoMapper.mapClientApplicationBasicInfoRequestDtoToClientApplicationBasicInfoRequestEntity.mockReturnValue(mockClientApplicationBasicInfoRequestEntity);

      const service = new ClientApplicationServiceImpl(mockLogFactory, mockClientApplicationDtoMapper, mockClientApplicationRepository);

      // Act
      const result = await service.findClientApplicationByBasicInfo(mockClientApplicationBasicInfoRequestDto);

      // Assert
      expect(result).toEqual(mockClientApplicationDto);
      expect(mockClientApplicationDtoMapper.mapClientApplicationBasicInfoRequestDtoToClientApplicationBasicInfoRequestEntity).toHaveBeenCalledWith(mockClientApplicationBasicInfoRequestDto);
      expect(mockClientApplicationRepository.findClientApplicationByBasicInfo).toHaveBeenCalledWith(mockClientApplicationBasicInfoRequestEntity);
      expect(mockClientApplicationDtoMapper.mapClientApplicationEntityToClientApplicationDto).toHaveBeenCalledWith(mockClientApplicationEntity);
    });

    it('should return null if client application is not found by basic info', async () => {
      // Arrange
      const mockClientApplicationBasicInfoRequestDto: ClientApplicationBasicInfoRequestDto = { firstName: 'John', lastName: 'Doe', dateOfBirth: '2000-01-01', clientNumber: 'ABC123' };
      const mockClientApplicationBasicInfoRequestEntity: ClientApplicationBasicInfoRequestEntity = {
        Applicant: {
          PersonName: [{ PersonGivenName: [mockClientApplicationBasicInfoRequestDto.firstName], PersonSurName: mockClientApplicationBasicInfoRequestDto.lastName }],
          PersonBirthDate: { date: mockClientApplicationBasicInfoRequestDto.dateOfBirth },
          ClientIdentification: [{ IdentificationID: mockClientApplicationBasicInfoRequestDto.clientNumber }],
        },
      };

      const mockClientApplicationRepository = mock<ClientApplicationRepository>();
      mockClientApplicationRepository.findClientApplicationByBasicInfo.mockResolvedValue(null);

      const mockClientApplicationDtoMapper = mock<ClientApplicationDtoMapper>();
      mockClientApplicationDtoMapper.mapClientApplicationBasicInfoRequestDtoToClientApplicationBasicInfoRequestEntity.mockReturnValue(mockClientApplicationBasicInfoRequestEntity);

      const service = new ClientApplicationServiceImpl(mockLogFactory, mockClientApplicationDtoMapper, mockClientApplicationRepository);

      // Act
      const result = await service.findClientApplicationByBasicInfo(mockClientApplicationBasicInfoRequestDto);

      // Assert
      expect(result).toBeNull();
      expect(mockClientApplicationDtoMapper.mapClientApplicationBasicInfoRequestDtoToClientApplicationBasicInfoRequestEntity).toHaveBeenCalledWith(mockClientApplicationBasicInfoRequestDto);
      expect(mockClientApplicationRepository.findClientApplicationByBasicInfo).toHaveBeenCalledWith(mockClientApplicationBasicInfoRequestEntity);
      expect(mockClientApplicationDtoMapper.mapClientApplicationEntityToClientApplicationDto).not.toBeCalled();
    });
  });
});
