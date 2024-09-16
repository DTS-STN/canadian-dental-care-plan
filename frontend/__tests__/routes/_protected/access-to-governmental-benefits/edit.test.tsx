import { createMemorySessionStorage } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { ContainerProvider } from '~/.server/providers/container.provider';
import { loader } from '~/routes/$lang/_protected/access-to-governmental-benefits/edit';

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
        nameEn: 'Federal program 1',
        nameFr: 'Federal program 1 but in French',
      },
      {
        id: '1788f1db-25c5-ee11-9079-000d3a09d640',
        nameEn: 'Federal program 2',
        nameFr: 'Federal program 2 but in French',
      },
      {
        id: '1788f1db-25c5-ee11-9079-000d3a09d640',
        nameEn: 'Federal program 3',
        nameFr: 'Federal program 3 but in French',
      }
    ]),
    getAllProvincialTerritorialSocialPrograms: vi.fn().mockReturnValue([
      {
        id: 'b3f25fea-a7a9-ee11-a569-000d3af4f898',
        nameEn: 'Provincial program',
        nameFr: "Provincial and Territorial program but in French",
        provinceTerritoryStateId: '9c440baa-35b3-eb11-8236-0022486d8d5f'
      },
      {
        id: 'b5f25fea-a7a9-ee11-a569-000d3af4f898',
        nameEn: 'Provincial and Territorial program',
        nameFr: "Provincial and Territorial program but in French",
        provinceTerritoryStateId: '9c440baa-35b3-eb11-8236-0022486d8d5f'
      },
      {
        id: 'b7f25fea-a7a9-ee11-a569-000d3af4f898',
        nameEn: 'Territorial program 1',
        nameFr: "Territorial program 1 but in French",
        provinceTerritoryStateId: '9c440baa-35b3-eb11-8236-0022486d8d5f'
      }
    ]),
    getAllRegions: vi.fn().mockReturnValue(
       [
        {
          provinceTerritoryStateId: '9c440baa-35b3-eb11-8236-0022486d8d5f',
          countryId: 'CAN',
          nameEn: 'Province name',
          nameFr: 'Province name but in french',
          abbr: 'abbrv',
        },
        {
          provinceTerritoryStateId: '9c440baa-35b3-eb11-8236-0022486d8d5f',
          countryId: 'CAN',
          nameEn: 'Territory name',
          nameFr: 'Territory name but in french',
          abbr: 'abbrv',
        },
        {
          provinceTerritoryStateId: '9c440baa-35b3-eb11-8236-0022486d8d5f',
          countryId: 'not Canadian',
          nameEn: 'Region name',
          nameFr: 'Region name but in french',
          abbr: 'abbrv',
        },
    ]
  ),
  }),
}));

vi.mock('~/services/personal-information-service.server', () => ({
  getPersonalInformationService: vi.fn().mockReturnValue({
    getPersonalInformation: vi.fn().mockResolvedValue({
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
    }),
  }),
}));

vi.mock('~/utils/env-utils.server', () => ({
  featureEnabled: vi.fn().mockReturnValue(true),
  getEnv: vi.fn().mockReturnValue({
    ENGLISH_LANGUAGE_CODE: 1033,
    FRENCH_LANGUAGE_CODE: 1036,
    CANADA_COUNTRY_ID: 'CAN',
  }),
}));

vi.mock('~/utils/locale-utils.server', () => ({
  getFixedT: vi.fn().mockResolvedValue(vi.fn()),
  getLocale: vi.fn().mockReturnValue('en'),
}));

describe('Access View Governmental Page', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loader()', () => {
    it('should return Governmental Access Benefit Edit page', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
      session.set('idToken', { sub: '00000000-0000-0000-0000-000000000000' });
      session.set('userInfoToken', { sin: '999999999' });

      const response = await loader({
        request: new Request('http://localhost:3000/en/access-to-governmental-benefits/edit'),
        context: { session, ...mock<ContainerProvider>() },
        params: {},
      });

      expect(response).toBeInstanceOf(Response);

      const data = await response.json();

      expect(data).toMatchObject({
        federalSocialPrograms: [
          {
            id: '1788f1db-25c5-ee11-9079-000d3a09d640',
            nameEn: 'Federal program 1',
            nameFr: 'Federal program 1 but in French',
          },
          {
            id: '1788f1db-25c5-ee11-9079-000d3a09d640',
            nameEn: 'Federal program 2',
            nameFr: 'Federal program 2 but in French',
          },
          {
            id: '1788f1db-25c5-ee11-9079-000d3a09d640',
            nameEn: 'Federal program 3',
            nameFr: 'Federal program 3 but in French',
          },
        ],
        provincialTerritorialSocialPrograms: [
          {
            id: 'b3f25fea-a7a9-ee11-a569-000d3af4f898',
            nameEn: 'Provincial program',
            nameFr: 'Provincial and Territorial program but in French',
            provinceTerritoryStateId: '9c440baa-35b3-eb11-8236-0022486d8d5f',
          },
          {
            id: 'b5f25fea-a7a9-ee11-a569-000d3af4f898',
            nameEn: 'Provincial and Territorial program',
            nameFr: 'Provincial and Territorial program but in French',
            provinceTerritoryStateId: '9c440baa-35b3-eb11-8236-0022486d8d5f',
          },
          {
            id: 'b7f25fea-a7a9-ee11-a569-000d3af4f898',
            nameEn: 'Territorial program 1',
            nameFr: 'Territorial program 1 but in French',
            provinceTerritoryStateId: '9c440baa-35b3-eb11-8236-0022486d8d5f',
          },
        ],
        regions: [
          {
            provinceTerritoryStateId: '9c440baa-35b3-eb11-8236-0022486d8d5f',
            countryId: 'CAN',
            name: 'Province name',
            abbr: 'abbrv',
          },
          {
            provinceTerritoryStateId: '9c440baa-35b3-eb11-8236-0022486d8d5f',
            countryId: 'CAN',
            name: 'Territory name',
            abbr: 'abbrv',
          },
        ],
      });
    });
  });
});
