import type { AppLoadContext } from '@remix-run/node';
import { createMemorySessionStorage } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import type { ClientConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { ApplicantService, AuditService, LetterService, LetterTypeService } from '~/.server/domain/services';
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

      const mockAppLoadContext = mockDeep<AppLoadContext>();
      mockAppLoadContext.appContainer.get.calledWith(TYPES.CLIENT_CONFIG).mockReturnValueOnce({
        SCCH_BASE_URI: 'https://api.example.com',
      } satisfies Partial<ClientConfig>);
      mockAppLoadContext.appContainer.get.calledWith(TYPES.AUDIT_SERVICE).mockReturnValue({
        createAudit: vi.fn(),
      } satisfies Partial<AuditService>);
      mockAppLoadContext.appContainer.get.calledWith(TYPES.APPLICANT_SERVICE).mockReturnValue({
        findClientNumberBySin: () => Promise.resolve('some-client-number'),
      } satisfies Partial<ApplicantService>);
      mockAppLoadContext.appContainer.get.calledWith(TYPES.LETTER_SERVICE).mockReturnValue({
        findLettersByClientId: () =>
          Promise.resolve([
            { id: '1', date: '2024-12-25', letterTypeId: 'ACC' },
            { id: '2', date: '2004-02-29', letterTypeId: 'DEN' },
            { id: '3', date: '2004-02-29', letterTypeId: 'DEN' },
          ]),
      } satisfies Partial<LetterService>);
      mockAppLoadContext.appContainer.get.calledWith(TYPES.LETTER_TYPE_SERVICE).mockReturnValue({
        listLetterTypes: () => [
          { id: 'ACC', nameEn: 'Accepted', nameFr: '(FR) Accepted' },
          { id: 'DEN', nameEn: 'Denied', nameFr: '(FR) Denied' },
        ],
      } satisfies Partial<LetterTypeService>);

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
      expect(data.letters[2].date).toBeDefined();
    });
  });

  it('retrieves letter types', async () => {
    const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
    session.set('idToken', { sub: '00000000-0000-0000-0000-000000000000' });
    session.set('userInfoToken', { sin: '999999999' });

    const mockAppLoadContext = mockDeep<AppLoadContext>();
    mockAppLoadContext.appContainer.get.calledWith(TYPES.CLIENT_CONFIG).mockReturnValue({
      SCCH_BASE_URI: 'https://api.example.com',
    } satisfies Partial<ClientConfig>);
    mockAppLoadContext.appContainer.get.calledWith(TYPES.AUDIT_SERVICE).mockReturnValue({
      createAudit: vi.fn(),
    } satisfies Partial<AuditService>);
    mockAppLoadContext.appContainer.get.calledWith(TYPES.APPLICANT_SERVICE).mockReturnValue({
      findClientNumberBySin: () => Promise.resolve('some-client-number'),
    } satisfies Partial<ApplicantService>);
    mockAppLoadContext.appContainer.get.calledWith(TYPES.LETTER_SERVICE).mockReturnValue({
      findLettersByClientId: () =>
        Promise.resolve([
          { id: '1', date: '2024-12-25', letterTypeId: 'ACC' },
          { id: '2', date: '2004-02-29', letterTypeId: 'DEN' },
          { id: '3', date: '2004-02-29', letterTypeId: 'DEN' },
        ]),
    } satisfies Partial<LetterService>);
    mockAppLoadContext.appContainer.get.calledWith(TYPES.LETTER_TYPE_SERVICE).mockReturnValue({
      listLetterTypes: () => [
        { id: 'ACC', nameEn: 'Accepted', nameFr: '(FR) Accepted' },
        { id: 'DEN', nameEn: 'Denied', nameFr: '(FR) Denied' },
      ],
    } satisfies Partial<LetterTypeService>);

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
