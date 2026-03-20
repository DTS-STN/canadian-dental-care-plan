import { None, Some } from 'oxide.ts';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type {
  CountryLocalizedDto,
  FederalGovernmentInsurancePlanLocalizedDto,
  GCCommunicationMethodLocalizedDto,
  LanguageLocalizedDto,
  ProvinceTerritoryStateLocalizedDto,
  ProvincialGovernmentInsurancePlanLocalizedDto,
  SunLifeCommunicationMethodLocalizedDto,
} from '~/.server/domain/dtos';
import type {
  CountryService,
  FederalGovernmentInsurancePlanService,
  GCCommunicationMethodService,
  LanguageService,
  ProvinceTerritoryStateService,
  ProvincialGovernmentInsurancePlanService,
  SunLifeCommunicationMethodService,
} from '~/.server/domain/services';
import {
  resolveSimplifiedStateCommunicationPreferencesValue,
  resolveSimplifiedStateDentalBenefitsValue,
  resolveSimplifiedStateEmailValue,
  resolveSimplifiedStateHomeAddressValue,
  resolveSimplifiedStateMailingAddressValue,
  resolveSimplifiedStatePhoneNumberValue,
} from '~/.server/routes/helpers/public-application-route-helpers';

describe('public-application-route-helpers', () => {
  describe('resolveSimplifiedStateCommunicationPreferencesValue', () => {
    const mockLanguage: LanguageLocalizedDto = { id: 'lang-1', code: 'en', name: 'English' };
    const mockSunLifeMethod: SunLifeCommunicationMethodLocalizedDto = { id: 'sl-1', code: 'email', name: 'Email' };
    const mockGCMethod: GCCommunicationMethodLocalizedDto = { id: 'gc-1', code: 'mail', name: 'Mail' };

    it('returns state values with hasChanged=true when user changed preferences', () => {
      const state = {
        communicationPreferences: {
          hasChanged: true,
          value: { preferredLanguage: 'lang-1', preferredMethod: 'sl-1', preferredNotificationMethod: 'gc-1' },
        },
        clientApplication: { communicationPreferences: {} },
      } as const;

      const languageService = mock<LanguageService>();
      const sunLifeService = mock<SunLifeCommunicationMethodService>();
      const gcService = mock<GCCommunicationMethodService>();

      languageService.getLocalizedLanguageById.mockReturnValue(mockLanguage);
      sunLifeService.getLocalizedSunLifeCommunicationMethodById.mockReturnValue(mockSunLifeMethod);
      gcService.getLocalizedGCCommunicationMethodById.mockReturnValue(mockGCMethod);

      const result = resolveSimplifiedStateCommunicationPreferencesValue(state, 'en', languageService, sunLifeService, gcService);

      expect(result).toEqual({ hasChanged: true, preferredLanguage: mockLanguage, preferredMethodSunLife: mockSunLifeMethod, preferredMethodGovernmentOfCanada: mockGCMethod });
      expect(languageService.getLocalizedLanguageById).toHaveBeenCalledWith('lang-1', 'en');
      expect(sunLifeService.getLocalizedSunLifeCommunicationMethodById).toHaveBeenCalledWith('sl-1', 'en');
      expect(gcService.getLocalizedGCCommunicationMethodById).toHaveBeenCalledWith('gc-1', 'en');
    });

    it('returns client application values with hasChanged=false when user did not change preferences', () => {
      const state = {
        communicationPreferences: { hasChanged: false },
        clientApplication: {
          communicationPreferences: {
            preferredLanguage: 'lang-2',
            preferredMethodSunLife: 'sl-2',
            preferredMethodGovernmentOfCanada: 'gc-2',
          },
        },
      } as const;

      const languageService = mock<LanguageService>();
      const sunLifeService = mock<SunLifeCommunicationMethodService>();
      const gcService = mock<GCCommunicationMethodService>();

      languageService.getLocalizedLanguageById.mockReturnValue(mockLanguage);
      sunLifeService.getLocalizedSunLifeCommunicationMethodById.mockReturnValue(mockSunLifeMethod);
      gcService.getLocalizedGCCommunicationMethodById.mockReturnValue(mockGCMethod);

      const result = resolveSimplifiedStateCommunicationPreferencesValue(state, 'en', languageService, sunLifeService, gcService);

      expect(result).toEqual({ hasChanged: false, preferredLanguage: mockLanguage, preferredMethodSunLife: mockSunLifeMethod, preferredMethodGovernmentOfCanada: mockGCMethod });
      expect(languageService.getLocalizedLanguageById).toHaveBeenCalledWith('lang-2', 'en');
      expect(sunLifeService.getLocalizedSunLifeCommunicationMethodById).toHaveBeenCalledWith('sl-2', 'en');
      expect(gcService.getLocalizedGCCommunicationMethodById).toHaveBeenCalledWith('gc-2', 'en');
    });
  });

  describe('resolveSimplifiedStatePhoneNumberValue', () => {
    it('returns state phone numbers with hasChanged=true when user changed phone number', () => {
      const state = {
        phoneNumber: { hasChanged: true, value: { primary: '555-1234', alternate: '555-5678' } },
        clientApplication: { contactInformation: { phoneNumber: '555-0000', phoneNumberAlt: '555-0001' } },
      } as const;

      expect(resolveSimplifiedStatePhoneNumberValue(state)).toEqual({ hasChanged: true, primary: '555-1234', alternate: '555-5678' });
    });

    it('returns client application phone numbers with hasChanged=false when user did not change phone number', () => {
      const state = {
        phoneNumber: { hasChanged: false },
        clientApplication: { contactInformation: { phoneNumber: '555-0000', phoneNumberAlt: '555-0001' } },
      } as const;

      expect(resolveSimplifiedStatePhoneNumberValue(state)).toEqual({ hasChanged: false, primary: '555-0000', alternate: '555-0001' });
    });

    it('returns client application phone number without alternate when alt is undefined', () => {
      const state = {
        phoneNumber: { hasChanged: false },
        clientApplication: { contactInformation: { phoneNumber: '555-0000', phoneNumberAlt: undefined } },
      } as const;

      expect(resolveSimplifiedStatePhoneNumberValue(state)).toEqual({ hasChanged: false, primary: '555-0000', alternate: undefined });
    });
  });

  describe('resolveSimplifiedStateMailingAddressValue', () => {
    const mockCountry: CountryLocalizedDto = { id: 'CA', name: 'Canada' };
    const mockProvince: ProvinceTerritoryStateLocalizedDto = { id: 'ON', countryId: 'CA', abbr: 'ON', name: 'Ontario' };

    it('returns state mailing address with hasChanged=true when user changed address', async () => {
      const state = {
        mailingAddress: {
          hasChanged: true,
          value: { address: '123 Main St', city: 'Ottawa', country: 'CA', postalCode: 'K1A 0A9', province: 'ON' },
        },
        clientApplication: { contactInformation: { mailingAddress: '', mailingCity: '', mailingCountry: '', mailingPostalCode: undefined, mailingProvince: undefined } },
      } as const;

      const countryService = mock<CountryService>();
      const provinceTerritoryStateService = mock<ProvinceTerritoryStateService>();
      countryService.getLocalizedCountryById.mockResolvedValue(mockCountry);
      provinceTerritoryStateService.getLocalizedProvinceTerritoryStateById.mockResolvedValue(mockProvince);

      const result = await resolveSimplifiedStateMailingAddressValue(state, 'en', countryService, provinceTerritoryStateService);

      expect(result).toEqual({ hasChanged: true, address: '123 Main St', city: 'Ottawa', country: mockCountry, postalCode: 'K1A 0A9', province: mockProvince });
    });

    it('returns state mailing address without province when province is undefined', async () => {
      const state = {
        mailingAddress: {
          hasChanged: true,
          value: { address: '123 Main St', city: 'Ottawa', country: 'CA', postalCode: undefined, province: undefined },
        },
        clientApplication: { contactInformation: { mailingAddress: '', mailingCity: '', mailingCountry: '', mailingPostalCode: undefined, mailingProvince: undefined } },
      } as const;

      const countryService = mock<CountryService>();
      const provinceTerritoryStateService = mock<ProvinceTerritoryStateService>();
      countryService.getLocalizedCountryById.mockResolvedValue(mockCountry);

      const result = await resolveSimplifiedStateMailingAddressValue(state, 'en', countryService, provinceTerritoryStateService);

      expect(result).toEqual({ hasChanged: true, address: '123 Main St', city: 'Ottawa', country: mockCountry, postalCode: undefined, province: undefined });
      expect(provinceTerritoryStateService.getLocalizedProvinceTerritoryStateById).not.toHaveBeenCalled();
    });

    it('returns client application mailing address with hasChanged=false when user did not change address', async () => {
      const state = {
        mailingAddress: { hasChanged: false },
        clientApplication: {
          contactInformation: { mailingAddress: '456 Elm St', mailingCity: 'Toronto', mailingCountry: 'CA', mailingPostalCode: 'M5G 2C8', mailingProvince: 'ON' },
        },
      } as const;

      const countryService = mock<CountryService>();
      const provinceTerritoryStateService = mock<ProvinceTerritoryStateService>();
      countryService.getLocalizedCountryById.mockResolvedValue(mockCountry);
      provinceTerritoryStateService.getLocalizedProvinceTerritoryStateById.mockResolvedValue(mockProvince);

      const result = await resolveSimplifiedStateMailingAddressValue(state, 'en', countryService, provinceTerritoryStateService);

      expect(result).toEqual({ hasChanged: false, address: '456 Elm St', city: 'Toronto', country: mockCountry, postalCode: 'M5G 2C8', province: mockProvince });
    });

    it('returns client application mailing address without province when province is undefined', async () => {
      const state = {
        mailingAddress: { hasChanged: false },
        clientApplication: {
          contactInformation: { mailingAddress: '456 Elm St', mailingCity: 'Toronto', mailingCountry: 'CA', mailingPostalCode: undefined, mailingProvince: undefined },
        },
      } as const;

      const countryService = mock<CountryService>();
      const provinceTerritoryStateService = mock<ProvinceTerritoryStateService>();
      countryService.getLocalizedCountryById.mockResolvedValue(mockCountry);

      const result = await resolveSimplifiedStateMailingAddressValue(state, 'en', countryService, provinceTerritoryStateService);

      expect(result).toEqual({ hasChanged: false, address: '456 Elm St', city: 'Toronto', country: mockCountry, postalCode: undefined, province: undefined });
      expect(provinceTerritoryStateService.getLocalizedProvinceTerritoryStateById).not.toHaveBeenCalled();
    });
  });

  describe('resolveSimplifiedStateHomeAddressValue', () => {
    const mockCountry: CountryLocalizedDto = { id: 'CA', name: 'Canada' };
    const mockProvince: ProvinceTerritoryStateLocalizedDto = { id: 'BC', countryId: 'CA', abbr: 'BC', name: 'British Columbia' };

    it('returns state home address with hasChanged=true when user changed address', async () => {
      const state = {
        homeAddress: {
          hasChanged: true,
          value: { address: '789 Oak Ave', city: 'Vancouver', country: 'CA', postalCode: 'V6B 1A1', province: 'BC' },
        },
        clientApplication: { contactInformation: { homeAddress: '', homeCity: '', homeCountry: '', homePostalCode: undefined, homeProvince: undefined } },
      } as const;

      const countryService = mock<CountryService>();
      const provinceTerritoryStateService = mock<ProvinceTerritoryStateService>();
      countryService.getLocalizedCountryById.mockResolvedValue(mockCountry);
      provinceTerritoryStateService.getLocalizedProvinceTerritoryStateById.mockResolvedValue(mockProvince);

      const result = await resolveSimplifiedStateHomeAddressValue(state, 'en', countryService, provinceTerritoryStateService);

      expect(result).toEqual({ hasChanged: true, address: '789 Oak Ave', city: 'Vancouver', country: mockCountry, postalCode: 'V6B 1A1', province: mockProvince });
    });

    it('returns state home address without province when province is undefined', async () => {
      const state = {
        homeAddress: {
          hasChanged: true,
          value: { address: '789 Oak Ave', city: 'Vancouver', country: 'CA', postalCode: undefined, province: undefined },
        },
        clientApplication: { contactInformation: { homeAddress: '', homeCity: '', homeCountry: '', homePostalCode: undefined, homeProvince: undefined } },
      } as const;

      const countryService = mock<CountryService>();
      const provinceTerritoryStateService = mock<ProvinceTerritoryStateService>();
      countryService.getLocalizedCountryById.mockResolvedValue(mockCountry);

      const result = await resolveSimplifiedStateHomeAddressValue(state, 'en', countryService, provinceTerritoryStateService);

      expect(result).toEqual({ hasChanged: true, address: '789 Oak Ave', city: 'Vancouver', country: mockCountry, postalCode: undefined, province: undefined });
      expect(provinceTerritoryStateService.getLocalizedProvinceTerritoryStateById).not.toHaveBeenCalled();
    });

    it('returns client application home address with hasChanged=false when user did not change address', async () => {
      const state = {
        homeAddress: { hasChanged: false },
        clientApplication: {
          contactInformation: { homeAddress: '321 Pine Rd', homeCity: 'Calgary', homeCountry: 'CA', homePostalCode: 'T2P 1J9', homeProvince: 'BC' },
        },
      } as const;

      const countryService = mock<CountryService>();
      const provinceTerritoryStateService = mock<ProvinceTerritoryStateService>();
      countryService.getLocalizedCountryById.mockResolvedValue(mockCountry);
      provinceTerritoryStateService.getLocalizedProvinceTerritoryStateById.mockResolvedValue(mockProvince);

      const result = await resolveSimplifiedStateHomeAddressValue(state, 'en', countryService, provinceTerritoryStateService);

      expect(result).toEqual({ hasChanged: false, address: '321 Pine Rd', city: 'Calgary', country: mockCountry, postalCode: 'T2P 1J9', province: mockProvince });
    });

    it('returns client application home address without province when province is undefined', async () => {
      const state = {
        homeAddress: { hasChanged: false },
        clientApplication: {
          contactInformation: { homeAddress: '321 Pine Rd', homeCity: 'Calgary', homeCountry: 'CA', homePostalCode: undefined, homeProvince: undefined },
        },
      } as const;

      const countryService = mock<CountryService>();
      const provinceTerritoryStateService = mock<ProvinceTerritoryStateService>();
      countryService.getLocalizedCountryById.mockResolvedValue(mockCountry);

      const result = await resolveSimplifiedStateHomeAddressValue(state, 'en', countryService, provinceTerritoryStateService);

      expect(result).toEqual({ hasChanged: false, address: '321 Pine Rd', city: 'Calgary', country: mockCountry, postalCode: undefined, province: undefined });
      expect(provinceTerritoryStateService.getLocalizedProvinceTerritoryStateById).not.toHaveBeenCalled();
    });
  });

  describe('resolveSimplifiedStateEmailValue', () => {
    it('returns state email when it is defined', () => {
      const state = {
        email: 'user@example.com',
        clientApplication: { contactInformation: { email: 'client@example.com' } },
      } as const;

      expect(resolveSimplifiedStateEmailValue(state)).toBe('user@example.com');
    });

    it('falls back to client application email when state email is undefined', () => {
      const state = {
        email: undefined,
        clientApplication: { contactInformation: { email: 'client@example.com' } },
      } as const;

      expect(resolveSimplifiedStateEmailValue(state)).toBe('client@example.com');
    });

    it('returns undefined when both state and client application emails are undefined', () => {
      const state = {
        email: undefined,
        clientApplication: { contactInformation: { email: undefined } },
      } as const;

      expect(resolveSimplifiedStateEmailValue(state)).toBeUndefined();
    });
  });

  describe('resolveSimplifiedStateDentalBenefitsValue', () => {
    const mockFederalPlan: FederalGovernmentInsurancePlanLocalizedDto = { id: 'fed-1', name: 'Federal Plan A' };
    const mockProvincialPlan: ProvincialGovernmentInsurancePlanLocalizedDto = { id: 'prov-1', name: 'Provincial Plan B', provinceTerritoryStateId: 'ON' };

    it('returns federal and provincial plans with hasChanged=true when user changed benefits', async () => {
      const state = {
        dentalBenefits: {
          hasChanged: true,
          value: { hasFederalBenefits: true, federalSocialProgram: 'fed-1', hasProvincialTerritorialBenefits: true, provincialTerritorialSocialProgram: 'prov-1', province: 'ON' },
        },
        clientApplication: { dentalBenefits: [] },
      } as const;

      const federalService = mock<FederalGovernmentInsurancePlanService>();
      const provincialService = mock<ProvincialGovernmentInsurancePlanService>();
      federalService.getLocalizedFederalGovernmentInsurancePlanById.mockResolvedValue(mockFederalPlan);
      provincialService.getLocalizedProvincialGovernmentInsurancePlanById.mockResolvedValue(mockProvincialPlan);

      const result = await resolveSimplifiedStateDentalBenefitsValue(state, 'en', federalService, provincialService);

      expect(result).toEqual({ hasChanged: true, federalGovernmentInsurancePlan: mockFederalPlan, provincialGovernmentInsurancePlan: mockProvincialPlan });
    });

    it('returns undefined plans with hasChanged=true when both programs are undefined', async () => {
      const state = {
        dentalBenefits: {
          hasChanged: true,
          value: { hasFederalBenefits: false, federalSocialProgram: undefined, hasProvincialTerritorialBenefits: false, provincialTerritorialSocialProgram: undefined, province: undefined },
        },
        clientApplication: { dentalBenefits: [] },
      } as const;

      const federalService = mock<FederalGovernmentInsurancePlanService>();
      const provincialService = mock<ProvincialGovernmentInsurancePlanService>();

      const result = await resolveSimplifiedStateDentalBenefitsValue(state, 'en', federalService, provincialService);

      expect(result).toEqual({ hasChanged: true, federalGovernmentInsurancePlan: undefined, provincialGovernmentInsurancePlan: undefined });
      expect(federalService.getLocalizedFederalGovernmentInsurancePlanById).not.toHaveBeenCalled();
      expect(provincialService.getLocalizedProvincialGovernmentInsurancePlanById).not.toHaveBeenCalled();
    });

    it('finds federal plan by benefit ID from client application when hasChanged is false', async () => {
      const state = {
        dentalBenefits: { hasChanged: false },
        clientApplication: { dentalBenefits: ['fed-1'] },
      } as const;

      const federalService = mock<FederalGovernmentInsurancePlanService>();
      const provincialService = mock<ProvincialGovernmentInsurancePlanService>();
      federalService.findLocalizedFederalGovernmentInsurancePlanById.mockResolvedValue(Some(mockFederalPlan));
      provincialService.findLocalizedProvincialGovernmentInsurancePlanById.mockResolvedValue(None);

      const result = await resolveSimplifiedStateDentalBenefitsValue(state, 'en', federalService, provincialService);

      expect(result).toEqual({ hasChanged: false, federalGovernmentInsurancePlan: mockFederalPlan, provincialGovernmentInsurancePlan: undefined });
    });

    it('finds provincial plan by benefit ID from client application when hasChanged is false', async () => {
      const state = {
        dentalBenefits: { hasChanged: false },
        clientApplication: { dentalBenefits: ['prov-1'] },
      } as const;

      const federalService = mock<FederalGovernmentInsurancePlanService>();
      const provincialService = mock<ProvincialGovernmentInsurancePlanService>();
      federalService.findLocalizedFederalGovernmentInsurancePlanById.mockResolvedValue(None);
      provincialService.findLocalizedProvincialGovernmentInsurancePlanById.mockResolvedValue(Some(mockProvincialPlan));

      const result = await resolveSimplifiedStateDentalBenefitsValue(state, 'en', federalService, provincialService);

      expect(result).toEqual({ hasChanged: false, federalGovernmentInsurancePlan: undefined, provincialGovernmentInsurancePlan: mockProvincialPlan });
    });

    it('returns no plans when benefit ID matches neither federal nor provincial', async () => {
      const state = {
        dentalBenefits: { hasChanged: false },
        clientApplication: { dentalBenefits: ['unknown-1'] },
      } as const;

      const federalService = mock<FederalGovernmentInsurancePlanService>();
      const provincialService = mock<ProvincialGovernmentInsurancePlanService>();
      federalService.findLocalizedFederalGovernmentInsurancePlanById.mockResolvedValue(None);
      provincialService.findLocalizedProvincialGovernmentInsurancePlanById.mockResolvedValue(None);

      const result = await resolveSimplifiedStateDentalBenefitsValue(state, 'en', federalService, provincialService);

      expect(result).toEqual({ hasChanged: false, federalGovernmentInsurancePlan: undefined, provincialGovernmentInsurancePlan: undefined });
    });

    it('returns both plans when client application has both federal and provincial benefit IDs', async () => {
      const state = {
        dentalBenefits: { hasChanged: false },
        clientApplication: { dentalBenefits: ['fed-1', 'prov-1'] },
      } as const;

      const federalService = mock<FederalGovernmentInsurancePlanService>();
      const provincialService = mock<ProvincialGovernmentInsurancePlanService>();
      federalService.findLocalizedFederalGovernmentInsurancePlanById.mockResolvedValueOnce(Some(mockFederalPlan)).mockResolvedValueOnce(None);
      provincialService.findLocalizedProvincialGovernmentInsurancePlanById.mockResolvedValue(Some(mockProvincialPlan));

      const result = await resolveSimplifiedStateDentalBenefitsValue(state, 'en', federalService, provincialService);

      expect(result).toEqual({ hasChanged: false, federalGovernmentInsurancePlan: mockFederalPlan, provincialGovernmentInsurancePlan: mockProvincialPlan });
    });
  });
});
