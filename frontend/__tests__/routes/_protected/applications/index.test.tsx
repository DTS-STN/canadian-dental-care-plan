import { createMemorySessionStorage } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { loader } from '~/routes/$lang/_protected/applications/index';

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

vi.mock('~/utils/env.server', () => ({
  featureEnabled: vi.fn().mockReturnValue(true),
}));

vi.mock('~/utils/locale-utils.server', () => ({
  getFixedT: vi.fn().mockResolvedValue(vi.fn()),
}));

vi.mock('~/services/benefit-application-service.server', () => ({
  getBenefitApplicationService: vi.fn().mockReturnValue({
    getApplications: vi.fn().mockReturnValue([
      {
        id: '038d9d0f-fb35-4d98-9d34-a4b2171e789b',
        submittedOn: '2021/03/05',
        status: 'Approved',
        confirmationCode: '202403054231',
        applicationDetails: [
          {
            typeOfApplication: 'adult',
            disabilityTaxCredit: true,
            applicantInformation: {
              maritalStatus: '775170001',
              firstName: 'Claudia Jean',
              lastName: 'Cregg',
              socialInsuranceNumber: '723 435 814',
            },
            communicationPreferences: {
              email: 'goldfish@bowl.ca',
              preferredLanguage: '1033',
              preferredMethod: '775170000',
            },
            dateOfBirth: '1965-09-22T04:00:00.000Z',
            dentalBenefits: {
              hasFederalBenefits: false,
              hasProvincialTerritorialBenefits: false,
            },
            dentalInsurance: true,
            personalInformation: {
              copyMailingAddress: true,
              homeAddress: '66 Seaborn St',
              homeApartment: '',
              homeCity: "St. John's",
              homeCountry: '0cf5389e-97ae-eb11-8236-000d3af4bfc3',
              homePostalCode: 'A1B 5B9',
              homeProvince: '5abc28c9-38b3-eb11-8236-0022486d8d5f',
              mailingAddress: '66 Seaborn St',
              mailingApartment: '',
              mailingCity: "St. John's",
              mailingCountry: '0cf5389e-97ae-eb11-8236-000d3af4bfc3',
              mailingPostalCode: 'A1B 5B9',
              mailingProvince: '5abc28c9-38b3-eb11-8236-0022486d8d5f',
              phoneNumber: '+1 702 656 2843',
              phoneNumberAlt: '+1 416 363 2653',
            },

            partnerInformation: {
              confirm: true,
              dateOfBirth: '1965-10-06T04:00:00.000Z',
              firstName: 'Danny',
              lastName: 'Concannon',
              socialInsuranceNumber: '100-000-007',
            },
            children: [],
          },
        ],
      },
      {
        id: '038d9d0f-fb35-4d98-8f31-a4b2171e521a',
        submittedOn: '2024/06/05',
        status: 'Submitted',
        confirmationCode: '202403051212',
        applicationDetails: [
          {
            typeOfApplication: 'adult',
            disabilityTaxCredit: true,
            applicantInformation: {
              maritalStatus: '775170001',
              firstName: 'Abigail',
              lastName: 'Bartlet',
              socialInsuranceNumber: '723 435 814',
            },
            communicationPreferences: {
              email: 'communicat@bowl.ca',
              preferredLanguage: '1033',
              preferredMethod: '775170000',
            },
            dateOfBirth: '1965-09-22T04:00:00.000Z',
            dentalBenefits: {
              hasFederalBenefits: false,
              hasProvincialTerritorialBenefits: false,
            },
            dentalInsurance: true,
            personalInformation: {
              copyMailingAddress: false,
              homeAddress: '3102 Main St, BC',
              homeApartment: 'Unit #302',
              homeCity: 'Vancouver',
              homeCountry: '0cf5389e-97ae-eb11-8236-000d3af4bfc3',
              homePostalCode: 'V5T 3G7',
              homeProvince: '9c440baa-35b3-eb11-8236-0022486d8d5f',
              mailingAddress: '20399 Douglas Cres',
              mailingApartment: '',
              mailingCity: 'Langley',
              mailingCountry: '0cf5389e-97ae-eb11-8236-000d3af4bfc3',
              mailingPostalCode: 'V3A 4B3',
              mailingProvince: '9c440baa-35b3-eb11-8236-0022486d8d5f',
              phoneNumber: '+1 604 514 2800',
              phoneNumberAlt: '+1 604 638 4852',
            },
            partnerInformation: {
              confirm: true,
              dateOfBirth: '1942-01-01T04:00:00.000Z',
              firstName: 'Jed',
              lastName: 'Barlet',
              socialInsuranceNumber: '100-000-007',
            },
            children: [
              {
                information: { isParent: false, firstName: 'Zoey', lastName: 'Bartlet', dateOfBirth: '1983-06-02T04:00:00.000Z', socialInsuranceNumber: '100-000-005', hasSocialInsuranceNumber: true },
                dentalInsurance: true,
                dentalBenefits: {
                  hasFederalBenefits: true,
                  federalSocialProgram: 'e174250d-26c5-ee11-9079-000d3a09d640',
                  hasProvincialTerritorialBenefits: true,
                  provincialTerritorialSocialProgram: 'fdf25fea-a7a9-ee11-a569-000d3af4f898',
                  province: '5abc28c9-38b3-eb11-8236-0022486d8d5f',
                },
              },
            ],
          },
        ],
      },
    ]),
  }),
}));

describe('Applications Page', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loader()', () => {
    it('should return sorted applications', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
      session.set('idToken', { sub: '00000000-0000-0000-0000-000000000000' });
      session.set('userInfoToken', { sin: '999999999', sub: '00000000-0000-0000-0000-000000000000' });

      const response = await loader({
        request: new Request('http://localhost/applications?sort=asc'),
        context: { session },
        params: {},
      });

      const data = await response.json();

      expect(data.applications).toHaveLength(2);
      expect(data.applications.at(0)?.id).equals('038d9d0f-fb35-4d98-9d34-a4b2171e789b');
      expect(data.applications.at(0)?.applicationDetails.at(0)?.personalInformation.homeProvince).equals('5abc28c9-38b3-eb11-8236-0022486d8d5f');
    });
  });
});
