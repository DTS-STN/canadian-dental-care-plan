import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { ClientApplicationBasicInfoRequestDto, ClientApplicationDto, ClientApplicationSinRequestDto } from '~/.server/domain/dtos';
import type { ClientApplicationBasicInfoRequestEntity, ClientApplicationEntity, ClientApplicationSinRequestEntity } from '~/.server/domain/entities';
import type { ClientApplicationDtoMapper } from '~/.server/domain/mappers';
import type { ClientApplicationRepository } from '~/.server/domain/repositories';
import type { AuditService } from '~/.server/domain/services';
import { DefaultClientApplicationService } from '~/.server/domain/services';

describe('DefaultClientApplicationService', () => {
  const mockAuditService = mock<AuditService>();

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
                  },
                },
                AddressPostalCode: 'M5H 2N2',
                AddressProvince: {
                  ProvinceCode: {
                    ReferenceDataID: 'ON',
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
                  ReferenceDataName: 'Mobile',
                  ReferenceDataID: '555-555-5555',
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
          InsurancePlan: [
            {
              InsurancePlanIdentification: [
                {
                  IdentificationID: 'ID-123456',
                },
              ],
            },
          ],
          InvitationToApplyIndicator: true,
          LivingIndependentlyIndicator: true,
          PreviousApplicationIndicator: false,
          PreviousTaxesFiledIndicator: true,
          PrivateDentalInsuranceIndicator: true,
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

  // Mock for ClientApplicationDto
  const mockClientApplicationDto: ClientApplicationDto = {
    applicantInformation: {
      firstName: 'John',
      lastName: 'Doe',
      clientId: '00000000-0000-0000-0000-000000000000',
      maritalStatus: 'MARRIED',
      socialInsuranceNumber: '80000002',
    },
    children: [],
    communicationPreferences: {
      preferredLanguage: 'ENG',
      preferredMethod: 'EMAIL',
    },
    contactInformation: {
      copyMailingAddress: true,
      homeAddress: '123 Fake Street',
      homeCity: 'Home City',
      homeCountry: 'CAN',
      mailingAddress: '456 Fake Street',
      mailingCity: 'Mailing City',
      mailingCountry: 'USA',
    },
    dateOfBirth: '2000-01-01',
    dentalBenefits: ['ID-123456'],
    hasFiledTaxes: true,
    isInvitationToApplyClient: false,
    typeOfApplication: '111111111',
  };

  describe('findClientApplicationBySin', () => {
    it('should find client application by SIN', async () => {
      // Arrange
      const mockClientApplicationSinRequestDto: ClientApplicationSinRequestDto = { sin: '80000002', applicationYearId: '00000000-0000-0000-0000-000000000000', userId: 'test-user' };
      const mockClientApplicationSinRequestEntity: ClientApplicationSinRequestEntity = {
        Applicant: { PersonSINIdentification: { IdentificationID: mockClientApplicationSinRequestDto.sin } },
        BenefitApplicationYear: { IdentificationID: '00000000-0000-0000-0000-000000000000' },
      };

      const mockClientApplicationRepository = mock<ClientApplicationRepository>();
      mockClientApplicationRepository.findClientApplicationBySin.mockResolvedValue(mockClientApplicationEntity);

      const mockClientApplicationDtoMapper = mock<ClientApplicationDtoMapper>();
      mockClientApplicationDtoMapper.mapClientApplicationEntityToClientApplicationDto.mockReturnValue(mockClientApplicationDto);
      mockClientApplicationDtoMapper.mapClientApplicationSinRequestDtoToClientApplicationSinRequestEntity.mockReturnValue(mockClientApplicationSinRequestEntity);

      const service = new DefaultClientApplicationService(mockClientApplicationDtoMapper, mockClientApplicationRepository, mockAuditService);

      // Act
      const result = await service.findClientApplicationBySin(mockClientApplicationSinRequestDto);

      // Assert
      expect(result).toEqual(mockClientApplicationDto);
      expect(mockClientApplicationDtoMapper.mapClientApplicationSinRequestDtoToClientApplicationSinRequestEntity).toHaveBeenCalledWith(mockClientApplicationSinRequestDto);
      expect(mockClientApplicationRepository.findClientApplicationBySin).toHaveBeenCalledWith(mockClientApplicationSinRequestEntity);
      expect(mockClientApplicationDtoMapper.mapClientApplicationEntityToClientApplicationDto).toHaveBeenCalledWith(mockClientApplicationEntity);
    });

    it('should return null if client application is not found by SIN', async () => {
      const mockClientApplicationSinRequestDto: ClientApplicationSinRequestDto = { sin: '80000002', applicationYearId: '00000000-0000-0000-0000-000000000000', userId: 'test-user' };
      const mockClientApplicationSinRequestEntity: ClientApplicationSinRequestEntity = {
        Applicant: { PersonSINIdentification: { IdentificationID: mockClientApplicationSinRequestDto.sin } },
        BenefitApplicationYear: { IdentificationID: '00000000-0000-0000-0000-000000000000' },
      };

      const mockClientApplicationRepository = mock<ClientApplicationRepository>();
      mockClientApplicationRepository.findClientApplicationBySin.mockResolvedValue(null);

      const mockClientApplicationDtoMapper = mock<ClientApplicationDtoMapper>();
      mockClientApplicationDtoMapper.mapClientApplicationSinRequestDtoToClientApplicationSinRequestEntity.mockReturnValue(mockClientApplicationSinRequestEntity);

      const service = new DefaultClientApplicationService(mockClientApplicationDtoMapper, mockClientApplicationRepository, mockAuditService);

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
      const mockClientApplicationBasicInfoRequestDto: ClientApplicationBasicInfoRequestDto = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '2000-01-01',
        clientNumber: 'ABC123',
        applicationYearId: '00000000-0000-0000-0000-000000000000',
        userId: 'test-user',
      };
      const mockClientApplicationBasicInfoRequestEntity: ClientApplicationBasicInfoRequestEntity = {
        Applicant: {
          PersonName: { PersonGivenName: [mockClientApplicationBasicInfoRequestDto.firstName], PersonSurName: mockClientApplicationBasicInfoRequestDto.lastName },
          PersonBirthDate: { date: mockClientApplicationBasicInfoRequestDto.dateOfBirth },
          ClientIdentification: [{ IdentificationID: mockClientApplicationBasicInfoRequestDto.clientNumber }],
        },
        BenefitApplicationYear: { IdentificationID: '00000000-0000-0000-0000-000000000000' },
      };

      const mockClientApplicationRepository = mock<ClientApplicationRepository>();
      mockClientApplicationRepository.findClientApplicationByBasicInfo.mockResolvedValue(mockClientApplicationEntity);

      const mockClientApplicationDtoMapper = mock<ClientApplicationDtoMapper>();
      mockClientApplicationDtoMapper.mapClientApplicationEntityToClientApplicationDto.mockReturnValue(mockClientApplicationDto);
      mockClientApplicationDtoMapper.mapClientApplicationBasicInfoRequestDtoToClientApplicationBasicInfoRequestEntity.mockReturnValue(mockClientApplicationBasicInfoRequestEntity);

      const service = new DefaultClientApplicationService(mockClientApplicationDtoMapper, mockClientApplicationRepository, mockAuditService);

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
      const mockClientApplicationBasicInfoRequestDto: ClientApplicationBasicInfoRequestDto = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '2000-01-01',
        clientNumber: 'ABC123',
        applicationYearId: '00000000-0000-0000-0000-000000000000',
        userId: 'test-user',
      };
      const mockClientApplicationBasicInfoRequestEntity: ClientApplicationBasicInfoRequestEntity = {
        Applicant: {
          PersonName: { PersonGivenName: [mockClientApplicationBasicInfoRequestDto.firstName], PersonSurName: mockClientApplicationBasicInfoRequestDto.lastName },
          PersonBirthDate: { date: mockClientApplicationBasicInfoRequestDto.dateOfBirth },
          ClientIdentification: [{ IdentificationID: mockClientApplicationBasicInfoRequestDto.clientNumber }],
        },
        BenefitApplicationYear: { IdentificationID: '00000000-0000-0000-0000-000000000000' },
      };

      const mockClientApplicationRepository = mock<ClientApplicationRepository>();
      mockClientApplicationRepository.findClientApplicationByBasicInfo.mockResolvedValue(null);

      const mockClientApplicationDtoMapper = mock<ClientApplicationDtoMapper>();
      mockClientApplicationDtoMapper.mapClientApplicationBasicInfoRequestDtoToClientApplicationBasicInfoRequestEntity.mockReturnValue(mockClientApplicationBasicInfoRequestEntity);

      const service = new DefaultClientApplicationService(mockClientApplicationDtoMapper, mockClientApplicationRepository, mockAuditService);

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
