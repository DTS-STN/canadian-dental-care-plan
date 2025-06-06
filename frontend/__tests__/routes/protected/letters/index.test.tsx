import type { AppLoadContext } from 'react-router';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { mock, mockDeep } from 'vitest-mock-extended';

import type { ClientConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { ApplicantService, AuditService, LetterService, LetterTypeService } from '~/.server/domain/services';
import type { SecurityHandler } from '~/.server/routes/security';
import { loader } from '~/routes/protected/letters/index';

vi.mock('~/.server/utils/locale.utils');

describe('Letters Page', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loader()', () => {
    it('should return sorted letters', async () => {
      const mockAppLoadContext = mockDeep<AppLoadContext>();

      mockAppLoadContext.session.get.calledWith('idToken').mockReturnValueOnce({ sub: '00000000-0000-0000-0000-000000000000' });
      mockAppLoadContext.session.get.calledWith('userInfoToken').mockReturnValueOnce({ sin: '999999999', sub: '1111111' });

      mockAppLoadContext.appContainer.get.calledWith(TYPES.routes.security.SecurityHandler).mockReturnValueOnce(mock<SecurityHandler>());
      mockAppLoadContext.appContainer.get.calledWith(TYPES.configs.ClientConfig).mockReturnValueOnce({
        SCCH_BASE_URI: 'https://api.example.com',
      } satisfies Partial<ClientConfig>);
      mockAppLoadContext.appContainer.get.calledWith(TYPES.domain.services.AuditService).mockReturnValue({
        createAudit: vi.fn(),
      } satisfies Partial<AuditService>);
      mockAppLoadContext.appContainer.get.calledWith(TYPES.domain.services.ApplicantService).mockReturnValue({
        findClientNumberBySin: async () => await Promise.resolve('some-client-number'),
      } satisfies Partial<ApplicantService>);
      mockAppLoadContext.appContainer.get.calledWith(TYPES.domain.services.LetterService).mockReturnValue({
        findLettersByClientId: async () =>
          await Promise.resolve([
            { id: '1', date: '2024-12-25', letterTypeId: 'ACC' },
            { id: '2', date: '2004-02-29', letterTypeId: 'DEN' },
            { id: '3', date: '2004-02-29', letterTypeId: 'DEN' },
          ]),
      } satisfies Partial<LetterService>);
      mockAppLoadContext.appContainer.get.calledWith(TYPES.domain.services.LetterTypeService).mockReturnValue({
        listLetterTypes: async () =>
          await Promise.resolve([
            { id: 'ACC', nameEn: 'Accepted', nameFr: '(FR) Accepted' },
            { id: 'DEN', nameEn: 'Denied', nameFr: '(FR) Denied' },
          ]),
      } satisfies Partial<LetterTypeService>);

      const response = await loader({
        request: new Request('http://localhost/letters?sort=desc'),
        context: mockAppLoadContext,
        params: { lang: 'en' },
      });

      expect(response.letters).toHaveLength(3);
      expect(response.letters[2].id).toEqual('3');
      expect(response.letters[2].letterTypeId).toEqual('DEN');
      expect(response.letters[1].date).toBeDefined();
      expect(response.letters[2].date).toBeDefined();
    });
  });

  it('retrieves letter types', async () => {
    const mockAppLoadContext = mockDeep<AppLoadContext>();

    mockAppLoadContext.session.get.calledWith('idToken').mockReturnValueOnce({ sub: '00000000-0000-0000-0000-000000000000' });
    mockAppLoadContext.session.get.calledWith('userInfoToken').mockReturnValueOnce({ sin: '999999999' });

    mockAppLoadContext.appContainer.get.calledWith(TYPES.routes.security.SecurityHandler).mockReturnValueOnce(mock<SecurityHandler>());
    mockAppLoadContext.appContainer.get.calledWith(TYPES.configs.ClientConfig).mockReturnValue({
      SCCH_BASE_URI: 'https://api.example.com',
    } satisfies Partial<ClientConfig>);
    mockAppLoadContext.appContainer.get.calledWith(TYPES.domain.services.AuditService).mockReturnValue({
      createAudit: vi.fn(),
    } satisfies Partial<AuditService>);
    mockAppLoadContext.appContainer.get.calledWith(TYPES.domain.services.ApplicantService).mockReturnValue({
      findClientNumberBySin: async () => await Promise.resolve('some-client-number'),
    } satisfies Partial<ApplicantService>);
    mockAppLoadContext.appContainer.get.calledWith(TYPES.domain.services.LetterService).mockReturnValue({
      findLettersByClientId: async () =>
        await Promise.resolve([
          { id: '1', date: '2024-12-25', letterTypeId: 'ACC' },
          { id: '2', date: '2004-02-29', letterTypeId: 'DEN' },
          { id: '3', date: '2004-02-29', letterTypeId: 'DEN' },
        ]),
    } satisfies Partial<LetterService>);
    mockAppLoadContext.appContainer.get.calledWith(TYPES.domain.services.LetterTypeService).mockReturnValue({
      listLetterTypes: async () =>
        await Promise.resolve([
          { id: 'ACC', nameEn: 'Accepted', nameFr: '(FR) Accepted' },
          { id: 'DEN', nameEn: 'Denied', nameFr: '(FR) Denied' },
        ]),
    } satisfies Partial<LetterTypeService>);

    const response = await loader({
      request: new Request('http://localhost/letters'),
      context: mockAppLoadContext,
      params: { lang: 'en' },
    });

    expect(response.letterTypes.includes({ id: 'DEN', nameEn: 'DENIED', nameFr: '(FR) DENIED' }));
    expect(response.letterTypes.includes({ id: 'ACC', nameEn: 'Accepted', nameFr: '(FR) Accepted' }));
  });
});
