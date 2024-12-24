import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockProxy } from 'vitest-mock-extended';
import { mock } from 'vitest-mock-extended';

import type { LogFactory, Logger } from '~/.server/factories';
import type { HttpClient } from '~/.server/http';
import type { IdToken, UserinfoToken } from '~/.server/utils/raoidc.utils';
import { validateSession } from '~/.server/utils/raoidc.utils';
import type { Session } from '~/.server/web/session';
import { DefaultRaoidcSessionValidator } from '~/.server/web/validators';

vi.mock('~/.server/utils/raoidc.utils');

describe('DefaultRaoidcSessionValidator', () => {
  let mockHttpClient: MockProxy<HttpClient>;
  let mockLogFactory: MockProxy<LogFactory>;
  let mockLogger: MockProxy<Logger>;
  let mockSession: MockProxy<Session>;
  let mockServerConfig;
  let validator: DefaultRaoidcSessionValidator;

  beforeEach(() => {
    mockHttpClient = mock<HttpClient>();
    mockLogFactory = mock<LogFactory>();
    mockLogger = mock<Logger>();
    mockLogFactory.createLogger.mockReturnValue(mockLogger);

    mockServerConfig = {
      AUTH_RAOIDC_BASE_URL: 'https://auth.example.com',
      AUTH_RAOIDC_CLIENT_ID: 'client-id',
      HTTP_PROXY_URL: 'https://proxy.example.com',
    };

    mockSession = mock<Session>({ id: 'test-session-id' });

    validator = new DefaultRaoidcSessionValidator(mockLogFactory, mockServerConfig, mockHttpClient);
  });

  describe('validateRaoidcSession', () => {
    it('should return isValid: false if idToken is not found in session', async () => {
      mockSession.has.calledWith('idToken').mockReturnValueOnce(false);

      const result = await validator.validateRaoidcSession({ session: mockSession });

      expect(result).toEqual({ isValid: false, errorMessage: 'RAOIDC session validation failed; idToken not found in session [test-session-id]' });
      expect(mockLogger.debug).toHaveBeenCalledWith('idToken not found in session [%s]', 'test-session-id');
    });

    it('should return isValid: false if userInfoToken is not found in session', async () => {
      mockSession.has.calledWith('idToken').mockReturnValueOnce(true);
      mockSession.get.calledWith('idToken').mockReturnValueOnce({ sid: 'session-id' } satisfies Pick<IdToken, 'sid'>);
      mockSession.has.calledWith('userInfoToken').mockReturnValueOnce(true);

      const result = await validator.validateRaoidcSession({ session: mockSession });

      expect(result).toEqual({ isValid: false, errorMessage: 'RAOIDC session validation failed; userInfoToken not found in session [test-session-id]' });
      expect(mockLogger.debug).toHaveBeenCalledWith('userInfoToken not found in session [%s]', 'test-session-id');
    });

    it('should return isValid: true if session is mocked', async () => {
      mockSession.has.calledWith('idToken').mockReturnValueOnce(true);
      mockSession.get.calledWith('idToken').mockReturnValueOnce({ sid: 'session-id' } satisfies Pick<IdToken, 'sid'>);
      mockSession.has.calledWith('userInfoToken').mockReturnValueOnce(true);
      mockSession.get.calledWith('userInfoToken').mockReturnValueOnce({ mocked: true } satisfies Pick<UserinfoToken, 'mocked'>);

      const result = await validator.validateRaoidcSession({ session: mockSession });

      expect(result).toEqual({ isValid: true });
      expect(mockLogger.debug).toHaveBeenCalledWith('Mocked user; skipping RAOIDC session [%s] validation', 'test-session-id');
    });

    it('should return isValid: false if session is expired', async () => {
      mockSession.has.calledWith('idToken').mockReturnValueOnce(true);
      mockSession.get.calledWith('idToken').mockReturnValueOnce({ sid: 'session-id' } satisfies Pick<IdToken, 'sid'>);
      mockSession.has.calledWith('userInfoToken').mockReturnValueOnce(true);
      mockSession.get.calledWith('userInfoToken').mockReturnValueOnce({ mocked: false } satisfies Pick<UserinfoToken, 'mocked'>);
      vi.mocked(validateSession).mockResolvedValueOnce(false);

      const result = await validator.validateRaoidcSession({ session: mockSession });

      expect(result).toEqual({ isValid: false, errorMessage: 'RAOIDC session validation failed; session [test-session-id] has expired' });
      expect(mockLogger.debug).toHaveBeenCalledWith('RAOIDC session [%s] has expired', 'test-session-id');
    });

    it('should return isValid: true if session is valid', async () => {
      mockSession.has.calledWith('idToken').mockReturnValueOnce(true);
      mockSession.get.calledWith('idToken').mockReturnValueOnce({ sid: 'session-id' } satisfies Pick<IdToken, 'sid'>);
      mockSession.has.calledWith('userInfoToken').mockReturnValueOnce(true);
      mockSession.get.calledWith('userInfoToken').mockReturnValueOnce({ mocked: false } satisfies Pick<UserinfoToken, 'mocked'>);
      vi.mocked(validateSession).mockResolvedValueOnce(true);

      const result = await validator.validateRaoidcSession({ session: mockSession });

      expect(result).toEqual({ isValid: true });
      expect(mockLogger.debug).toHaveBeenCalledWith('Authentication check passed for RAOIDC session [%s]', 'test-session-id');
    });
  });

  describe('extractValueFromSession', () => {
    it('should return value from session when it exists', () => {
      mockSession.has.mockReturnValueOnce(true);
      mockSession.get.mockReturnValueOnce('mocked-value');

      const value = validator['extractValueFromSession'](mockSession, 'idToken');

      expect(value).toBe('mocked-value');
      expect(mockLogger.trace).toHaveBeenCalledWith('Extracted value for name [%s] from session [%s]', 'idToken', 'test-session-id');
    });

    it('should return null when value does not exist in session', () => {
      mockSession.has.mockReturnValueOnce(false);

      const value = validator['extractValueFromSession'](mockSession, 'idToken');

      expect(value).toBeNull();
      expect(mockLogger.debug).toHaveBeenCalledWith('Value not found for name [%s] in session [%s]', 'idToken', 'test-session-id');
    });
  });
});
