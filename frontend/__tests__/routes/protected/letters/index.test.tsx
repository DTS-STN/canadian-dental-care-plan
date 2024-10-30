import type { AppLoadContext } from '@remix-run/node';
import { createMemorySessionStorage } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import { loader } from '~/routes/protected/letters/index';

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

vi.mock('~/services/personal-information-service.server', () => ({
  getPersonalInformationService: vi.fn().mockReturnValue({
    getPersonalInformation: vi.fn().mockResolvedValue({
      clientNumber: '999999999',
    }),
  }),
}));

vi.mock('~/utils/env-utils.server', () => ({
  featureEnabled: vi.fn().mockReturnValue(true),
}));

vi.mock('~/utils/locale-utils.server', () => ({
  getFixedT: vi.fn().mockResolvedValue(vi.fn()),
}));

describe('Letters Page', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loader()', () => {
    it('should return sorted letters', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
      session.set('idToken', { sub: '00000000-0000-0000-0000-000000000000' });
      session.set('userInfoToken', { sin: '999999999', sub: '1111111' });

      const mockAppLoadContext = mock<AppLoadContext>({
        configProvider: { getClientConfig: vi.fn().mockReturnValue({ SCCH_BASE_URI: 'https://api.example.com' }) },
        serviceProvider: {
          getApplicantService: vi.fn().mockReturnValue({ findClientNumberBySin: vi.fn().mockReturnValue('some-client-number') }),
          getAuditService: vi.fn().mockReturnValue({ createAudit: vi.fn() }),
          getLetterService: vi.fn().mockReturnValue({
            findLettersByClientId: vi.fn().mockResolvedValue([
              { id: '1', date: '2024-12-25', letterTypeId: 'ACC' },
              { id: '2', date: '2004-02-29', letterTypeId: 'DEN' },
              { id: '3', date: undefined, letterTypeId: 'DEN' },
            ]),
          }),
          getLetterTypeService: vi.fn().mockReturnValue({
            listLetterTypes: vi.fn().mockReturnValue([
              { id: 'ACC', nameEn: 'Accepted', nameFr: '(FR) Accepted' },
              { id: 'DEN', nameEn: 'Denied', nameFr: '(FR) Denied' },
            ]),
          }),
        },
      });

      const response = await loader({
        request: new Request('http://localhost/letters?sort=desc'),
        context: { ...mockAppLoadContext, session },
        params: {},
      });

      const data = await response.json();

      expect(data.letters).toHaveLength(3);
      expect(data.letters[2].id).toEqual('3');
      expect(data.letters[2].letterTypeId).toEqual('DEN');
      expect(data.letters[1].date).toBeDefined();
      expect(data.letters[2].date).toBeUndefined();
    });
  });

  it('retrieves letter types', async () => {
    const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
    session.set('idToken', { sub: '00000000-0000-0000-0000-000000000000' });
    session.set('userInfoToken', { sin: '999999999' });

    const mockAppLoadContext = mock<AppLoadContext>({
      configProvider: { getClientConfig: vi.fn().mockReturnValue({ SCCH_BASE_URI: 'https://api.example.com' }) },
      serviceProvider: {
        getApplicantService: vi.fn().mockReturnValue({ findClientNumberBySin: vi.fn().mockReturnValue('some-client-number') }),
        getAuditService: vi.fn().mockReturnValue({ createAudit: vi.fn() }),
        getLetterService: vi.fn().mockReturnValue({
          findLettersByClientId: vi.fn().mockResolvedValue([
            { id: '1', date: '2024-12-25', letterTypeId: 'ACC' },
            { id: '2', date: '2004-02-29', letterTypeId: 'DEN' },
            { id: '3', date: undefined, letterTypeId: 'DEN' },
          ]),
        }),
        getLetterTypeService: vi.fn().mockReturnValue({
          listLetterTypes: vi.fn().mockReturnValue([
            { id: 'ACC', nameEn: 'Accepted', nameFr: '(FR) Accepted' },
            { id: 'DEN', nameEn: 'Denied', nameFr: '(FR) Denied' },
          ]),
        }),
      },
    });

    const response = await loader({
      request: new Request('http://localhost/letters'),
      context: { ...mockAppLoadContext, session },
      params: {},
    });

    const data = await response.json();

    expect(data.letterTypes.includes({ id: 'DEN', nameEn: 'DENIED', nameFr: '(FR) DENIED' }));
    expect(data.letterTypes.includes({ id: 'ACC', nameEn: 'Accepted', nameFr: '(FR) Accepted' }));
  });
});
