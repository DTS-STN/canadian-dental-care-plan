import { HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getPersonalInformationService } from '~/services/personal-information-service.server';

global.fetch = vi.fn();

vi.mock('~/utils/logging.server', () => ({
  getLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    audit: vi.fn(),
    trace: vi.fn(),
  }),
}));

vi.mock('~/utils/env.server', () => ({
  getEnv: vi.fn().mockReturnValue({}),
}));

describe('personal-information-service.server tests', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('getPersonalInformation()', () => {
    it('should return personal information of the user (federal, provincial and territorial, private insurance info)', async () => {
      vi.mocked(fetch).mockResolvedValue(
        HttpResponse.json({
          BenefitApplication: {
            InsurancePlan: [
              { InsurancePlanIdentification: { IdentificationID: '000000', IdentificationCategoryText: 'Federal' } },
              { InsurancePlanIdentification: { IdentificationID: '1111111', IdentificationCategoryText: 'Provincial and Territorial' } },
              { InsurancePlanIdentification: { IdentificationID: '222222222', IdentificationCategoryText: 'Private' } },
            ],
            PrivateDentalInsuranceIndicator: true,
            FederalDentalCoverageIndicator: { ReferenceDataID: '000000', ReferenceDataName: 'true' },
            ProvicialDentalCoverageIndicator: true,
          },
        }),
      );

      const personalInformationService = getPersonalInformationService();
      const personalInfo = await personalInformationService.getPersonalInformation('sin', 'userId');

      expect(personalInfo).toEqual({
        alternateTelephoneNumber: undefined,
        applicantCategoryCode: undefined,
        applictantId: undefined,
        birthDate: undefined,
        clientId: undefined,
        clientNumber: undefined,
        emailAddress: undefined,
        federalDentalPlanId: '000000',
        firstName: undefined,
        homeAddress: undefined,
        lastName: undefined,
        mailingAddress: undefined,
        maritalStatusId: undefined,
        preferredLanguageId: undefined,
        primaryTelephoneNumber: undefined,
        privateDentalPlanId: '222222222',
        provincialTerritorialDentalPlanId: '1111111',
      });
    });

    it('should throw error if response is not ok', async () => {
      vi.mocked(fetch).mockResolvedValue(new HttpResponse(null, { status: 500 }));

      const personalInformationService = getPersonalInformationService();
      await expect(() => personalInformationService.getPersonalInformation('sin', 'userId')).rejects.toThrowError();
    });
  });
});
