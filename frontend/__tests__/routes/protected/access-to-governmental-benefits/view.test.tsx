import type { AppLoadContext } from '@remix-run/node';
import { createMemorySessionStorage } from '@remix-run/node';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import { loader } from '~/routes/protected/access-to-governmental-benefits/view';

vi.mock('~/services/audit-service.server', () => ({
  getAuditService: vi.fn().mockReturnValue({
    audit: vi.fn(),
  }),
}));

vi.mock('~/services/instrumentation-service.server', () => ({
  getInstrumentationService: () => ({
    countHttpStatus: vi.fn(),
  }),
}));

vi.mock('~/services/raoidc-service.server', () => ({
  getRaoidcService: vi.fn().mockResolvedValue({
    handleSessionValidation: vi.fn().mockResolvedValue(true),
  }),
}));

vi.mock('~/services/session-service.server', () => ({
  getSessionService: vi.fn().mockResolvedValue({
    getSession: vi.fn().mockResolvedValue({
      get: vi.fn(),
    }),
  }),
}));

vi.mock('~/services/lookup-service.server', () => ({
  // prettier-ignore
  getLookupService: vi.fn().mockReturnValue({
    getAllFederalSocialPrograms: vi.fn().mockReturnValue([
      {
        id: '1788f1db-25c5-ee11-9079-000d3a09d640',
        nameEn: 'Non-Insured Health Benefits Program by Indigenous Services Canada',
        nameFr: 'Programme des services de santé non assurés par Services aux Autochtones Canada'
      },
      {
        id: 'e174250d-26c5-ee11-9079-000d3a09d640',
        nameEn: 'Veterans Affairs Canada - Basic dental coverage',
        nameFr: 'Anciens Combattants Canada - Couverture des soins dentaires de base'
      },
      {
        id: '758bb862-26c5-ee11-9079-000d3a09d640',
        nameEn: 'Interim Federal Health Program for asylum seekers or refugee claimants',
        nameFr: "Programme fédéral de santé intérimaire pour les personnes demandant l'asile ou les personnes revendiquant le statut de réfugié"
      }
    ]),
    getAllProvincialTerritorialSocialPrograms: vi.fn().mockReturnValue([
      {
        id: 'b3f25fea-a7a9-ee11-a569-000d3af4f898',
        nameEn: 'Healthy Kids Program',
        nameFr: "Programme d'enfants en santé",
        provinceTerritoryStateId: '9c440baa-35b3-eb11-8236-0022486d8d5f'
      },
      {
        id: 'b5f25fea-a7a9-ee11-a569-000d3af4f897',
        nameEn: 'BC Employment and Assistance (BCEA) Program',
        nameFr: "Programme d'emploi et d'assistance de la Colombie-Britannique",
        provinceTerritoryStateId: '9c440baa-35b3-eb11-8236-0022486d8d5f'
      },
      {
        id: 'b7f25fea-a7a9-ee11-a569-000d3af4f896',
        nameEn: 'Children in Care and Youth Agreements - Post Majority (MCFD)',
        nameFr: "Accords sur les enfants pris en charge et les jeunes - Après l'âge de majorité (MDEF)",
        provinceTerritoryStateId: '9c440baa-35b3-eb11-8236-0022486d8d5f'
      }
    ]),
  }),
}));

vi.mock('~/utils/env-utils.server', () => ({
  featureEnabled: vi.fn().mockReturnValue(true),
  getEnv: vi.fn().mockReturnValue({
    ENGLISH_LANGUAGE_CODE: 1033,
    FRENCH_LANGUAGE_CODE: 1036,
  }),
}));

vi.mock('~/utils/locale-utils.server', () => ({
  getFixedT: vi.fn().mockResolvedValue(vi.fn()),
  getLocale: vi.fn().mockReturnValue('en'),
}));

vi.mock('~/services/personal-information-service.server', () => ({
  getPersonalInformationService: vi.fn().mockReturnValue({
    getPersonalInformation: vi
      .fn()
      .mockResolvedValueOnce({
        clientNumber: '999999999',
        preferredLanguageId: '1033',
        firstName: 'John',
        homeAddress: '123 Home Street',
        lastName: 'Maverick',
        mailingAddress: '123 Mailing Street',
        phoneNumber: '(555) 555-5555',
        privateDentalPlanId: '222222222',
        federalDentalPlanId: '1788f1db-25c5-ee11-9079-000d3a09d640',
        provincialTerritorialDentalPlanId: 'b3f25fea-a7a9-ee11-a569-000d3af4f898',
      })
      .mockResolvedValueOnce({
        clientNumber: '999999999',
        preferredLanguageId: '1033',
        firstName: 'John',
        homeAddress: '123 Home Street',
        lastName: 'Maverick',
        mailingAddress: '123 Mailing Street',
        phoneNumber: '(555) 555-5555',
        privateDentalPlanId: '222222222',
      })
      .mockResolvedValueOnce({
        clientNumber: '999999999',
        preferredLanguageId: '1033',
        firstName: 'John',
        homeAddress: '123 Home Street',
        lastName: 'Maverick',
        mailingAddress: '123 Mailing Street',
        phoneNumber: '(555) 555-5555',
        privateDentalPlanId: '222222222',
        federalDentalPlanId: '1788f1db-25c5-ee11-9079-000d3a09d640',
      }),
  }),
}));

describe('Access View Governmental Page', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loader()', () => {
    it('should return Governmental Access Benefit View page with Federal and Provincial and Territorial listed', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
      session.set('idToken', { sub: '00000000-0000-0000-0000-000000000000' });
      session.set('userInfoToken', { sin: '999999999' });
      const response = await loader({
        request: new Request('http://localhost:3000/en/access-to-governmental-benefits/view'),
        context: { ...mock<AppLoadContext>(), session },
        params: {},
      });

      expect(response).toBeInstanceOf(Response);

      const data = await response.json();

      expect(data).toMatchObject({
        federalSocialProgramName: 'Non-Insured Health Benefits Program by Indigenous Services Canada',
        meta: {},
        provincialAndTerritorialProgramName: 'Healthy Kids Program',
      });
    });
    it('should return Governmental Access Benefit with no programs page', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
      session.set('idToken', { sub: '00000000-0000-0000-0000-000000000000' });
      session.set('userInfoToken', { sin: '999999999' });

      const response = await loader({
        request: new Request('http://localhost:3000/en/access-to-governmental-benefits/view'),
        context: { ...mock<AppLoadContext>(), session },
        params: {},
      });

      expect(response).toBeInstanceOf(Response);

      const data = await response.json();

      expect(data).toMatchObject({
        meta: {},
      });
      expect(data).not.toContain({
        personalInformation: {
          federalDentalPlanId: undefined,
          provincialTerritorialDentalPlanId: undefined,
        },
      });
    });
    it('should return Governmental Access Benefit with only Federal programs', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
      session.set('idToken', { sub: '00000000-0000-0000-0000-000000000000' });
      session.set('userInfoToken', { sin: '999999999' });

      vi.mock('~/services/lookup-service.server', () => ({
        // prettier-ignore
        getLookupService: vi.fn().mockReturnValue({
          getAllFederalSocialPrograms: vi.fn().mockReturnValue([
            {
              id: '1788f1db-25c5-ee11-9079-000d3a09d640',
              nameEn: 'Non-Insured Health Benefits Program by Indigenous Services Canada',
              nameFr: 'Programme des services de santé non assurés par Services aux Autochtones Canada'
            },
            {
              id: 'e174250d-26c5-ee11-9079-000d3a09d640',
              nameEn: 'Veterans Affairs Canada - Basic dental coverage',
              nameFr: 'Anciens Combattants Canada - Couverture des soins dentaires de base'
            },
            {
              id: '758bb862-26c5-ee11-9079-000d3a09d640',
              nameEn: 'Interim Federal Health Program for asylum seekers or refugee claimants',
              nameFr: "Programme fédéral de santé intérimaire pour les personnes demandant l'asile ou les personnes revendiquant le statut de réfugié"
            }
          ]),
          getAllProvincialTerritorialSocialPrograms: vi.fn().mockReturnValue([
            {
              id: 'b3f25fea-a7a9-ee11-a569-000d3af4f898',
              nameEn: 'Healthy Kids Program',
              nameFr: "Programme d'enfants en santé",
              provinceTerritoryStateId: '9c440baa-35b3-eb11-8236-0022486d8d5f'
            },
            {
              id: 'b5f25fea-a7a9-ee11-a569-000d3af4f898',
              nameEn: 'BC Employment and Assistance (BCEA) Program',
              nameFr: "Programme d'emploi et d'assistance de la Colombie-Britannique",
              provinceTerritoryStateId: '9c440baa-35b3-eb11-8236-0022486d8d5f'
            },
            {
              id: 'b7f25fea-a7a9-ee11-a569-000d3af4f898',
              nameEn: 'Children in Care and Youth Agreements - Post Majority (MCFD)',
              nameFr: "Accords sur les enfants pris en charge et les jeunes - Après l'âge de majorité (MDEF)",
              provinceTerritoryStateId: '9c440baa-35b3-eb11-8236-0022486d8d5f'
            }
          ]),
        }),
      }));

      const response = await loader({
        request: new Request('http://localhost:3000/en/access-to-governmental-benefits/view'),
        context: { ...mock<AppLoadContext>(), session },
        params: {},
      });

      expect(response).toBeInstanceOf(Response);

      const data = await response.json();

      expect(data).toMatchObject({
        federalSocialProgramName: 'Non-Insured Health Benefits Program by Indigenous Services Canada',
        meta: {},
        personalInformation: {
          federalDentalPlanId: '1788f1db-25c5-ee11-9079-000d3a09d640',
        },
      });
      expect(data.personalInformation).not.toHaveProperty('provincialTerritorialDentalPlanId');
    });
  });
});
