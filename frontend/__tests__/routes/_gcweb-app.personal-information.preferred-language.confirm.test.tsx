import { loader } from '~/routes/_gcweb-app.personal-information.preferred-language.confirm';
import { lookupService } from '~/services/lookup-service.server';
import { userService } from '~/services/user-service.server';
import { getEnv } from '~/utils/env.server';

vi.mock('~/services/user-service.server.ts', () => ({
  userService: {
    getUserId: vi.fn().mockReturnValue('some-id'),
    getUserInfo: vi.fn(),
  },
}));
vi.mock('~/services/lookup-service.server.ts', () => ({
  lookupService: {
    getPreferredLanguage: vi.fn().mockReturnValue({
      id: 'fr',
      nameEn: 'French',
      nameFr: 'Français',
    }),
  },
}));
vi.mock('~/utils/env.server.ts', () => ({
  getEnv: vi.fn().mockReturnValue({
    createCookie: vi.fn(),
  }),
}));
vi.mock('~/services/session-service.server.ts', () => ({
  createSessionService: vi.fn(),
  sessionService: {
    getSession: vi.fn().mockReturnValue({
      get: vi.fn(),
    }),
  },
}));

describe('_gcweb-app.personal-information.preferred-language.confirm', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('loader()', () => {
    it('should return userInfo object if userInfo is found', async () => {
      vi.mocked(getEnv, { partial: true }).mockReturnValue({
        SESSION_STORAGE_TYPE: 'file',
        AUTH_JWT_PUBLIC_KEY: 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDT04V6j20+5DQPA7rZCBfabQeyhfNLrKuKSs1yZF/7+y+47Pw80eOmqhgsLQXK9avPMZSvjd++viZ/++jIdej5+J6ifH5KpuVskfgAMY9kPsRLFkJAK8Orph2gibQT/PdfKweSokRmErJxdTWJOqKYTOw607QPh91ubdlgx+VcVwIDAQAB',
        AUTH_JWT_PRIVATE_KEY:
          'MIICdwIBADANBgkqhkiG9w0BAQEFAASCAmEwggJdAgEAAoGBANPThXqPbT7kNA8DutkIF9ptB7KF80usq4pKzXJkX/v7L7js/DzR46aqGCwtBcr1q88xlK+N376+Jn/76Mh16Pn4nqJ8fkqm5WyR+AAxj2Q+xEsWQkArw6umHaCJtBP8918rB5KiRGYSsnF1NYk6ophM7DrTtA+H3W5t2WDH5VxXAgMBAAECgYEAkW80wcUfuIJty7E/5CrOVcVt94BIXriavkRFcjjAPf1j8o+jTw68Qn2eQxZWV9b8szDTaQT7jbZ4MH8AgEGURmroSY2mesHYJtypGkV7ciZj9Z2hnhN0RcOZnl594ZElGljBl83howpwpYhuFDvtCtv9znDYfxeZJnbqWyTenoECQQD/nJ7rOHxk0JG6kHYDqXqZT4hCpnwAtPSppSXa4cHOTTdKM4PBHKBUu5fr003PPpcekbHRQ78HbkhZUdT+NYTxAkEA1CXgk/sLc5AJoFqkbUSnkhPQUBLzCu7kjDAwoQ1DSBerCtbU0/Kg1C1sLixt7g6xgDtMRvfElmqnXZlxzZdVxwJABeWvJO4gsJK/SfabQmpekbrsAd2lbr6+BkvxG6OpvQC7DdMybvoiGNJbJu2xFd7zzZi+6X0OozVAJg9lQpgpgQJBAMBohhHQm6c5GPH9o6mSneSH4ePt+86Lsm9O+Zvn+oC1LqULCUYdhS5K8BXEqANEAkrJ/TlUWFEP9DGZDLUpL1sCQGx9AJNJP6JajA4JWBCUpY2XpRqX7mr3g4TxmFGaXU6CMbz1LVL+2knWZx4wg53BemWEu8KY7v5FISzIyMfBjVs=',
      });
      vi.mocked(userService.getUserInfo).mockResolvedValue({ id: 'some-id', preferredLanguage: 'fr' });
      vi.mocked(lookupService.getPreferredLanguage).mockResolvedValue({ id: 'fr', nameEn: 'French', nameFr: 'Français' });

      const response = await loader({
        request: new Request('http://localhost:3000/personal-information/preferred/confirm'),
        context: {},
        params: {},
      });

      const data = await response.json();

      expect(data).toEqual({
        userInfo: { id: 'some-id', preferredLanguage: 'fr' },
        preferredLanguage: { id: 'fr', nameEn: 'French', nameFr: 'Français' },
      });
    });

    it('should throw 404 response if userInfo is not found', async () => {
      vi.mocked(getEnv, { partial: true }).mockReturnValue({
        SESSION_STORAGE_TYPE: 'file',
        AUTH_JWT_PUBLIC_KEY: 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDT04V6j20+5DQPA7rZCBfabQeyhfNLrKuKSs1yZF/7+y+47Pw80eOmqhgsLQXK9avPMZSvjd++viZ/++jIdej5+J6ifH5KpuVskfgAMY9kPsRLFkJAK8Orph2gibQT/PdfKweSokRmErJxdTWJOqKYTOw607QPh91ubdlgx+VcVwIDAQAB',
        AUTH_JWT_PRIVATE_KEY:
          'MIICdwIBADANBgkqhkiG9w0BAQEFAASCAmEwggJdAgEAAoGBANPThXqPbT7kNA8DutkIF9ptB7KF80usq4pKzXJkX/v7L7js/DzR46aqGCwtBcr1q88xlK+N376+Jn/76Mh16Pn4nqJ8fkqm5WyR+AAxj2Q+xEsWQkArw6umHaCJtBP8918rB5KiRGYSsnF1NYk6ophM7DrTtA+H3W5t2WDH5VxXAgMBAAECgYEAkW80wcUfuIJty7E/5CrOVcVt94BIXriavkRFcjjAPf1j8o+jTw68Qn2eQxZWV9b8szDTaQT7jbZ4MH8AgEGURmroSY2mesHYJtypGkV7ciZj9Z2hnhN0RcOZnl594ZElGljBl83howpwpYhuFDvtCtv9znDYfxeZJnbqWyTenoECQQD/nJ7rOHxk0JG6kHYDqXqZT4hCpnwAtPSppSXa4cHOTTdKM4PBHKBUu5fr003PPpcekbHRQ78HbkhZUdT+NYTxAkEA1CXgk/sLc5AJoFqkbUSnkhPQUBLzCu7kjDAwoQ1DSBerCtbU0/Kg1C1sLixt7g6xgDtMRvfElmqnXZlxzZdVxwJABeWvJO4gsJK/SfabQmpekbrsAd2lbr6+BkvxG6OpvQC7DdMybvoiGNJbJu2xFd7zzZi+6X0OozVAJg9lQpgpgQJBAMBohhHQm6c5GPH9o6mSneSH4ePt+86Lsm9O+Zvn+oC1LqULCUYdhS5K8BXEqANEAkrJ/TlUWFEP9DGZDLUpL1sCQGx9AJNJP6JajA4JWBCUpY2XpRqX7mr3g4TxmFGaXU6CMbz1LVL+2knWZx4wg53BemWEu8KY7v5FISzIyMfBjVs=',
      });

      vi.mocked(userService.getUserInfo).mockResolvedValue(null);

      try {
        await loader({
          request: new Request('http://localhost:3000/personal-information/preferred-language/confirm'),
          context: {},
          params: {},
        });
      } catch (error) {
        expect((error as Response).status).toEqual(404);
      }
    });
  });
});
