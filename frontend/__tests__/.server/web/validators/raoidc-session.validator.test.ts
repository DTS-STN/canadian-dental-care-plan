import type { Session } from '@remix-run/node';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockProxy } from 'vitest-mock-extended';
import { mock } from 'vitest-mock-extended';

import type { ServerConfig } from '~/.server/configs';
import type { LogFactory, Logger } from '~/.server/factories';
import { validateSession } from '~/.server/utils/raoidc.utils';
import { DefaultRaoidcSessionValidator } from '~/.server/web/validators/raoidc-session.validator';

describe('DefaultRaoidcSessionValidator', () => {
  let mockServerConfig: MockProxy<ServerConfig>;
  let mockLogFactory: MockProxy<LogFactory>;
  let mockLogger: MockProxy<Logger>;
  let mockSession: MockProxy<Session>;

  beforeEach(() => {
    mockServerConfig = mock<ServerConfig>();
    mockLogFactory = mock<LogFactory>();
    mockLogger = mock<Logger>();
    mockSession = mock<Session>({ id: 'test-session-id' });
    mockLogFactory.createLogger.mockReturnValue(mockLogger);
    vi.mock('~/.server/utils/fetch.utils');
    vi.mock('~/.server/utils/raoidc.utils');
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should validate a valid RAOIDC session', async () => {
    mockSession.has.calledWith('idToken').mockReturnValueOnce(true);
    mockSession.get.calledWith('idToken').mockReturnValueOnce({ sid: 'mock_sid' });
    mockSession.has.calledWith('userInfoToken').mockReturnValueOnce(true);
    mockSession.get.calledWith('userInfoToken').mockReturnValueOnce({ mocked: false });
    vi.mocked(validateSession).mockResolvedValue(true);

    const validator = new DefaultRaoidcSessionValidator(mockLogFactory, mockServerConfig);
    await validator.validateRaoidcSession(mockSession);

    expect(mockLogger.debug).toHaveBeenCalledWith('Performing RAOIDC session [%s] validation', 'test-session-id');
    expect(mockLogger.debug).toHaveBeenCalledWith('Authentication check passed for RAOIDC session [%s]', 'test-session-id');
  });

  it('should throw error when session is invalid', async () => {
    mockSession.has.calledWith('idToken').mockReturnValueOnce(true);
    mockSession.get.calledWith('idToken').mockReturnValueOnce({ sid: 'mock_sid' });
    mockSession.has.calledWith('userInfoToken').mockReturnValueOnce(true);
    mockSession.get.calledWith('userInfoToken').mockReturnValueOnce({ mocked: false });
    vi.mocked(validateSession).mockResolvedValue(false);

    const validator = new DefaultRaoidcSessionValidator(mockLogFactory, mockServerConfig);
    await expect(validator.validateRaoidcSession(mockSession)).rejects.toThrowError('RAOIDC session validation failed');
    expect(mockLogger.debug).toHaveBeenCalledWith('RAOIDC session [%s] has expired', 'test-session-id');
  });

  it('should throw error when idToken is missing', async () => {
    mockSession.has.calledWith('idToken').mockReturnValueOnce(false);

    const validator = new DefaultRaoidcSessionValidator(mockLogFactory, mockServerConfig);
    await expect(validator.validateRaoidcSession(mockSession)).rejects.toThrowError('RAOIDC session validation failed');
    expect(mockLogger.debug).toHaveBeenCalledWith('Performing RAOIDC session [%s] validation', 'test-session-id');
  });

  it('should throw error when userInfoToken is missing', async () => {
    mockSession.has.calledWith('idToken').mockReturnValueOnce(true);
    mockSession.get.calledWith('idToken').mockReturnValueOnce({ sid: 'mock_sid' });
    mockSession.has.calledWith('userInfoToken').mockReturnValueOnce(false);

    const validator = new DefaultRaoidcSessionValidator(mockLogFactory, mockServerConfig);
    await expect(validator.validateRaoidcSession(mockSession)).rejects.toThrowError('RAOIDC session validation failed');
    expect(mockLogger.debug).toHaveBeenCalledWith('userInfoToken not found in session [%s]', 'test-session-id');
  });

  it('should skip validation for mocked user', async () => {
    mockSession.has.calledWith('idToken').mockReturnValueOnce(true);
    mockSession.get.calledWith('idToken').mockReturnValueOnce({ sid: 'mock_sid' });
    mockSession.has.calledWith('userInfoToken').mockReturnValueOnce(true);
    mockSession.get.calledWith('userInfoToken').mockReturnValueOnce({ mocked: true });

    const validator = new DefaultRaoidcSessionValidator(mockLogFactory, mockServerConfig);
    await validator.validateRaoidcSession(mockSession);

    expect(validateSession).not.toHaveBeenCalled();
    expect(mockLogger.debug).toHaveBeenCalledWith('Mocked user; skipping RAOIDC session [%s] validation', 'test-session-id');
  });
});
