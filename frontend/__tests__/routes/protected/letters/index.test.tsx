import type { AppLoadContext } from 'react-router';

import { None, Some } from 'oxide.ts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mock, mockDeep } from 'vitest-mock-extended';

import type { ClientConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { ApplicantService, AuditService, LetterService, LetterTypeService } from '~/.server/domain/services';
import type { SecurityHandler } from '~/.server/routes/security';
import type { IdToken, UserinfoToken } from '~/.server/utils/raoidc.utils';
import { loader } from '~/routes/protected/letters/index';

vi.mock('~/.server/utils/locale.utils');

describe('Letters Page', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loader()', () => {
    it('should return sorted letters', async () => {
      const mockAppLoadContext = mockDeep<AppLoadContext>();

      mockAppLoadContext.session.get.calledWith('idToken').mockReturnValueOnce({ sub: '00000000-0000-0000-0000-000000000000' } as IdToken);
      mockAppLoadContext.session.get.calledWith('userInfoToken').mockReturnValueOnce({ sin: '999999999', sub: '1111111' } as UserinfoToken);
      mockAppLoadContext.session.find.calledWith('clientNumber').mockReturnValueOnce(None);

      mockAppLoadContext.appContainer.get.calledWith(TYPES.SecurityHandler).mockReturnValueOnce(mock<SecurityHandler>());
      mockAppLoadContext.appContainer.get.calledWith(TYPES.ClientConfig).mockReturnValueOnce({
        SCCH_BASE_URI: 'https://api.example.com',
      } satisfies Partial<ClientConfig>);
      mockAppLoadContext.appContainer.get.calledWith(TYPES.AuditService).mockReturnValue({
        createAudit: vi.fn(),
      } satisfies Partial<AuditService>);
      mockAppLoadContext.appContainer.get.calledWith(TYPES.ApplicantService).mockReturnValue({
        findClientNumberBySin: async () => await Promise.resolve(Some('some-client-number')),
      } satisfies Partial<ApplicantService>);
      mockAppLoadContext.appContainer.get.calledWith(TYPES.LetterService).mockReturnValue({
        findLettersByClientId: async () =>
          await Promise.resolve([
            { id: '1', date: '2024-12-25', letterTypeId: 'ACC' },
            { id: '2', date: '2004-02-29', letterTypeId: 'DEN' },
            { id: '3', date: '2004-02-29', letterTypeId: 'DEN' },
          ]),
      } satisfies Partial<LetterService>);
      mockAppLoadContext.appContainer.get.calledWith(TYPES.LetterTypeService).mockReturnValue({
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

    mockAppLoadContext.session.get.calledWith('idToken').mockReturnValueOnce({ sub: '00000000-0000-0000-0000-000000000000' } as IdToken);
    mockAppLoadContext.session.get.calledWith('userInfoToken').mockReturnValueOnce({ sin: '999999999' } as UserinfoToken);
    mockAppLoadContext.session.find.calledWith('clientNumber').mockReturnValueOnce(None);

    mockAppLoadContext.appContainer.get.calledWith(TYPES.SecurityHandler).mockReturnValueOnce(mock<SecurityHandler>());
    mockAppLoadContext.appContainer.get.calledWith(TYPES.ClientConfig).mockReturnValue({
      SCCH_BASE_URI: 'https://api.example.com',
    } satisfies Partial<ClientConfig>);
    mockAppLoadContext.appContainer.get.calledWith(TYPES.AuditService).mockReturnValue({
      createAudit: vi.fn(),
    } satisfies Partial<AuditService>);
    mockAppLoadContext.appContainer.get.calledWith(TYPES.ApplicantService).mockReturnValue({
      findClientNumberBySin: async () => await Promise.resolve(Some('some-client-number')),
    } satisfies Partial<ApplicantService>);
    mockAppLoadContext.appContainer.get.calledWith(TYPES.LetterService).mockReturnValue({
      findLettersByClientId: async () =>
        await Promise.resolve([
          { id: '1', date: '2024-12-25', letterTypeId: 'ACC' },
          { id: '2', date: '2004-02-29', letterTypeId: 'DEN' },
          { id: '3', date: '2004-02-29', letterTypeId: 'DEN' },
        ]),
    } satisfies Partial<LetterService>);
    mockAppLoadContext.appContainer.get.calledWith(TYPES.LetterTypeService).mockReturnValue({
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

    expect(response.letterTypes).toContainEqual({ id: 'DEN', nameEn: 'Denied', nameFr: '(FR) Denied' });
    expect(response.letterTypes).toContainEqual({ id: 'ACC', nameEn: 'Accepted', nameFr: '(FR) Accepted' });
  });
});
