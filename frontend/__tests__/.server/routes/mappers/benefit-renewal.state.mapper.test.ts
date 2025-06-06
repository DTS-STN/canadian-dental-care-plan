import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { ServerConfig } from '~/.server/configs';
import type { AdultChildBenefitRenewalDto, ClientApplicationDto } from '~/.server/domain/dtos';
import type { FederalGovernmentInsurancePlanService, ProvincialGovernmentInsurancePlanService } from '~/.server/domain/services';
import { DefaultBenefitRenewalStateMapper } from '~/.server/routes/mappers';
import type { RenewAdultChildState } from '~/.server/routes/mappers';

describe('DefaultBenefitRenewalStateMapper', () => {
  const mockFederalGovernmentInsurancePlanService = mock<FederalGovernmentInsurancePlanService>();
  mockFederalGovernmentInsurancePlanService.listFederalGovernmentInsurancePlans.mockResolvedValue([
    {
      id: 'Original federal benefit',
      nameEn: 'English example name',
      nameFr: 'French example name',
    },

    {
      id: 'New federal benefit',
      nameEn: 'English example name',
      nameFr: 'French example name',
    },
  ]);

  const mockProvincialGovernmentInsurancePlanService = mock<ProvincialGovernmentInsurancePlanService>();
  mockProvincialGovernmentInsurancePlanService.listProvincialGovernmentInsurancePlans.mockResolvedValue([
    {
      id: 'Original provincial benefit',
      nameEn: 'English example name',
      nameFr: 'French example name',
      provinceTerritoryStateId: 'Example province id',
    },
    {
      id: 'New provincial benefit',
      nameEn: 'English example name',
      nameFr: 'French example name',
      provinceTerritoryStateId: 'Example province id',
    },
  ]);

  const mockServerConfig = mock<ServerConfig>();
  mockServerConfig.COMMUNICATION_METHOD_EMAIL_ID = 'Email';
  mockServerConfig.COMMUNICATION_METHOD_MAIL_ID = 'Mail';

  const mapper = new DefaultBenefitRenewalStateMapper(mockFederalGovernmentInsurancePlanService, mockProvincialGovernmentInsurancePlanService, mockServerConfig);

  const mockClientApplication: ClientApplicationDto = {
    applicantInformation: {
      firstName: 'John',
      lastName: 'Doe',
      maritalStatus: 'Married',
      socialInsuranceNumber: '800000002',
      clientId: '00000000-0000-0000-0000-000000000000',
      clientNumber: '00000000000',
    },
    children: [
      {
        dentalBenefits: ['Original federal benefit', 'Original provincial benefit'],
        dentalInsurance: false,
        information: {
          clientId: '00000000-0000-0000-0000-000000000001',
          clientNumber: '11111111111',
          dateOfBirth: '2020-01-01',
          firstName: 'John Jr.',
          lastName: 'Doe',
          isParent: true,
          socialInsuranceNumber: '800000010',
        },
      },
    ],
    communicationPreferences: {
      preferredLanguage: 'English',
      preferredMethod: 'Mail',
    },
    contactInformation: {
      copyMailingAddress: false,
      homeAddress: '123 Original Fake Street',
      homeApartment: 'Unit 1',
      homeCity: 'Home City',
      homeCountry: 'Canada',
      homePostalCode: 'H0H0H0',
      homeProvince: 'ON',
      mailingAddress: '456 Original Fake Street',
      mailingApartment: 'Unit 2',
      mailingCity: 'Mailing City',
      mailingCountry: 'Canada',
      mailingPostalCode: 'H0H0H0',
      mailingProvince: 'ON',
      phoneNumber: '555-555-5555',
      phoneNumberAlt: '555-555-6666',
      email: 'test@example.com',
    },
    dateOfBirth: '1970-01-01',
    dentalBenefits: ['Original federal benefit', 'Original provincial benefit'],
    dentalInsurance: false,
    hasFiledTaxes: true,
    isInvitationToApplyClient: false,
    partnerInformation: {
      confirm: true,
      yearOfBirth: '1970',
      firstName: 'Jane',
      lastName: 'Doe',
      socialInsuranceNumber: '800011819',
    },
    typeOfApplication: '111111111',
  };

  describe('mapRenewAdultChildStateToAdultChildBenefitRenewalDto', () => {
    it('should map a valid RenewAdultChildState to AdultChildBenefitRenewalDto with information changed', () => {
      const renewAdultChildState: RenewAdultChildState = {
        applicationYear: {
          renewalYearId: '2024',
          taxYear: '2024',
          coverageEndDate: '2024-01-01',
        },
        children: [
          {
            id: '1',
            demographicSurvey: {
              disabilityStatus: 'Disability status placeholder',
              ethnicGroups: ['Group 1', 'Group 2'],
              indigenousStatus: 'No answer',
              genderStatus: 'Male',
              locationBornStatus: 'Canada',
            },
            dentalBenefits: {
              hasFederalBenefits: true,
              hasProvincialTerritorialBenefits: true,
              federalSocialProgram: 'New federal program',
              provincialTerritorialSocialProgram: 'New provincial program',
            },
            dentalInsurance: true,
            information: {
              clientNumber: '11111111111',
              dateOfBirth: '2020-01-01',
              firstName: 'John Jr.',
              lastName: 'Doe',
              isParent: true,
            },
          },
        ],
        clientApplication: mockClientApplication,
        contactInformation: {
          phoneNumber: '555-555-1234',
          phoneNumberAlt: '555-555-5678',
          isNewOrUpdatedPhoneNumber: true,
        },
        demographicSurvey: {
          ethnicGroups: ['Group 1'],
          indigenousStatus: 'No answer',
          genderStatus: 'Male',
          locationBornStatus: 'Outside Canada',
        },
        dentalBenefits: {
          hasFederalBenefits: true,
          hasProvincialTerritorialBenefits: false,
          federalSocialProgram: 'New federal program',
        },
        dentalInsurance: true,
        hasAddressChanged: true,
        hasMaritalStatusChanged: true,
        homeAddress: {
          address: '123 New Fake Street',
          city: 'Home City',
          country: 'United States',
          postalCode: '90210',
          province: 'LA',
        },
        isHomeAddressSameAsMailingAddress: false,
        mailingAddress: {
          address: '456 New Fake Street',
          city: 'Mailing City',
          country: 'United States',
          postalCode: '90210',
          province: 'LA',
        },
        maritalStatus: 'Single',
        communicationPreferences: {
          preferredMethod: 'Email',
          preferredNotificationMethod: 'msca',
        },
        email: 'new@example.com',
        emailVerified: true,
      };

      const adultChildBenefitRenewalDto = mapper.mapRenewAdultChildStateToAdultChildBenefitRenewalDto(renewAdultChildState);

      const expectedResult: AdultChildBenefitRenewalDto = {
        ...mockClientApplication,
        applicantInformation: {
          firstName: 'John',
          lastName: 'Doe',
          maritalStatus: 'Single',
          socialInsuranceNumber: '800000002',
          clientId: '00000000-0000-0000-0000-000000000000',
          clientNumber: '00000000000',
        },
        applicationYearId: '2024',
        contactInformation: {
          copyMailingAddress: false,
          homeAddress: '123 New Fake Street',
          homeApartment: undefined,
          homeCity: 'Home City',
          homeCountry: 'United States',
          homePostalCode: '90210',
          homeProvince: 'LA',
          mailingAddress: '456 New Fake Street',
          mailingApartment: undefined,
          mailingCity: 'Mailing City',
          mailingCountry: 'United States',
          mailingPostalCode: '90210',
          mailingProvince: 'LA',
          email: 'new@example.com',
          phoneNumber: '555-555-1234',
          phoneNumberAlt: '555-555-5678',
        },
        changeIndicators: {
          hasAddressChanged: true,
          hasMaritalStatusChanged: true,
          hasPhoneChanged: true,
        },
        children: [
          {
            clientId: '00000000-0000-0000-0000-000000000001',
            clientNumber: '11111111111',
            dentalBenefits: ['New federal program', 'New provincial program'],
            dentalInsurance: true,
            demographicSurvey: {
              disabilityStatus: 'Disability status placeholder',
              ethnicGroups: ['Group 1', 'Group 2'],
              indigenousStatus: 'No answer',
              genderStatus: 'Male',
              locationBornStatus: 'Canada',
            },
            information: {
              dateOfBirth: '2020-01-01',
              firstName: 'John Jr.',
              lastName: 'Doe',
              isParent: true,
              socialInsuranceNumber: '800000010',
            },
          },
        ],
        communicationPreferences: {
          preferredLanguage: 'English',
          preferredMethod: 'Email',
          email: 'new@example.com',
          emailVerified: true,
          preferredMethodGovernmentOfCanada: 'msca',
        },
        dateOfBirth: '1970-01-01',
        demographicSurvey: {
          ethnicGroups: ['Group 1'],
          indigenousStatus: 'No answer',
          genderStatus: 'Male',
          locationBornStatus: 'Outside Canada',
        },
        dentalBenefits: ['New federal program'],
        dentalInsurance: true,
        partnerInformation: undefined,
        typeOfApplication: 'adult-child',
        userId: 'anonymous',
      };

      expect(adultChildBenefitRenewalDto).toEqual(expectedResult);
    });
  });
});
