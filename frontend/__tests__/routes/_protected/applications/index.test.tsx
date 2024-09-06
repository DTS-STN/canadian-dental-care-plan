import { createMemorySessionStorage } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { ContainerProvider } from '~/.server/providers/container.provider';
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

vi.mock('~/utils/env-utils.server', () => ({
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
              firstName: 'First name',
              lastName: 'Last name',
              socialInsuranceNumber: '800000945',
            },
            communicationPreferences: {
              email: 'anemail@@example.com',
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
              homeAddress: '123 Home',
              homeApartment: '',
              homeCity: 'HomeCity',
              homeCountry: '0cf5389e-97ae-eb11-8236-000d3af4bfc3',
              homePostalCode: 'J8T 7X7',
              homeProvince: '5abc28c9-38b3-eb11-8236-0022486d8d5f',
              mailingAddress: '456 Mailing',
              mailingApartment: '',
              mailingCity: 'MailingCity',
              mailingCountry: '0cf5389e-97ae-eb11-8236-000d3af4bfc3',
              mailingPostalCode: 'J8T 7X7',
              mailingProvince: '5abc28c9-38b3-eb11-8236-0022486d8d5f',
              phoneNumber: '78005553535',
              phoneNumberAlt: '12133734253',
            },

            partnerInformation: {
              confirm: true,
              dateOfBirth: '1965-10-06T04:00:00.000Z',
              firstName: 'Partner',
              lastName: 'Name',
              socialInsuranceNumber: '800001042',
            },
            children: [],
          },
        ],
      },
      {
        id: '038d9d0f-fb35-4d98-8f31-a4b2171e521a',
        submittedOn: '2021/06/05',
        status: 'Submitted',
        confirmationCode: '202403051212',
        applicationDetails: [
          {
            typeOfApplication: 'adult',
            disabilityTaxCredit: true,
            applicantInformation: {
              maritalStatus: '775170001',
              firstName: 'Someone',
              lastName: 'Else',
              socialInsuranceNumber: '800000861',
            },
            communicationPreferences: {
              email: 'email@example.com',
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
              homeAddress: '567 Home Addr',
              homeApartment: 'Unit #302',
              homeCity: 'BC City',
              homeCountry: '0cf5389e-97ae-eb11-8236-000d3af4bfc3',
              homePostalCode: 'J8T 7X7',
              homeProvince: '9c440baa-35b3-eb11-8236-0022486d8d5f',
              mailingAddress: '789 Mailing Addr',
              mailingApartment: '',
              mailingCity: 'MailingCity',
              mailingCountry: '0cf5389e-97ae-eb11-8236-000d3af4bfc3',
              mailingPostalCode: 'J8T 7X7',
              mailingProvince: '9c440baa-35b3-eb11-8236-0022486d8d5f',
              phoneNumber: '12133734253',
              phoneNumberAlt: '12223333333',
            },
            partnerInformation: {
              confirm: true,
              dateOfBirth: '1942-01-01T04:00:00.000Z',
              firstName: 'Partner',
              lastName: 'Info',
              socialInsuranceNumber: '800000002',
            },
            children: [
              {
                information: { isParent: false, firstName: 'Child', lastName: 'Info', dateOfBirth: '1983-06-02T04:00:00.000Z', socialInsuranceNumber: '800009995', hasSocialInsuranceNumber: true },
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
      session.set('userInfoToken', { sin: '800009979', sub: '00000000-0000-0000-0000-000000000000' });

      const mockContainer = mock<ContainerProvider>({ config: { client: { SCCH_BASE_URI: 'https://api.example.com' } } });

      const response = await loader({
        request: new Request('http://localhost/applications?sort=asc'),
        context: { session, container: mockContainer },
        params: {},
      });

      const data = await response.json();

      expect(data.applications).toHaveLength(2);
      expect(data.applications.at(0)?.id).equals('038d9d0f-fb35-4d98-9d34-a4b2171e789b');
      expect(data.applications.at(0)?.applicationDetails.at(0)?.personalInformation.homeProvince).equals('5abc28c9-38b3-eb11-8236-0022486d8d5f');
    });
  });
});
