import type { Session } from '@remix-run/node';

import type { JWTPayload } from 'jose';
import { subtle } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockProxy } from 'vitest-mock-extended';
import { mock } from 'vitest-mock-extended';

import { DefaultRaoidcService } from '~/.server/auth/raoidc.service';
import type { ServerConfig } from '~/.server/configs';
import type { LogFactory, Logger } from '~/.server/factories';
import { generateCryptoKey, generateJwkId } from '~/utils/crypto-utils.server';
import type { IdToken, JWKSet, ServerMetadata, UserinfoToken } from '~/utils/raoidc-utils.server';
import { fetchAccessToken, fetchServerMetadata, fetchUserInfo, generateAuthorizationRequest, generateCodeChallenge, generateRandomState, validateSession } from '~/utils/raoidc-utils.server';
import { expandTemplate } from '~/utils/string-utils';

vi.mock('node:crypto', () => ({
  randomUUID: vi.fn(),
  subtle: {
    exportKey: vi.fn(),
  },
}));

vi.mock('@remix-run/node', () => ({
  redirect: vi.fn((to: string) => `MockedRedirect(${to})`),
}));

vi.mock('moize');
vi.mock('~/utils/crypto-utils.server');
vi.mock('~/utils/fetch-utils.server');
vi.mock('~/utils/raoidc-utils.server');
vi.mock('~/utils/string-utils');

describe('DefaultRaoidcService', () => {
  const mockServerConfig: Pick<ServerConfig, 'AUTH_RAOIDC_BASE_URL' | 'AUTH_RAOIDC_CLIENT_ID' | 'AUTH_RAOIDC_METADATA_CACHE_TTL_SECONDS' | 'AUTH_JWT_PRIVATE_KEY' | 'AUTH_LOGOUT_REDIRECT_URL' | 'HTTP_PROXY_URL'> = {
    AUTH_RAOIDC_BASE_URL: 'https://example.com/auth',
    AUTH_RAOIDC_CLIENT_ID: 'mock_client_id',
    AUTH_RAOIDC_METADATA_CACHE_TTL_SECONDS: 10,
    AUTH_JWT_PRIVATE_KEY: 'mock_private_key',
    AUTH_LOGOUT_REDIRECT_URL: 'https://example.com/auth/logout',
    HTTP_PROXY_URL: 'https://example.com/proxy',
  };

  let mockLogFactory: MockProxy<LogFactory>;
  let mockLogger: MockProxy<Logger>;

  beforeEach(() => {
    mockLogger = mock<Logger>();
    mockLogFactory = mock<LogFactory>();
    mockLogFactory.createLogger.mockReturnValue(mockLogger);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('constructor', () => {
    it('sets the correct maxAge for moize options', () => {
      class DefaultRaoidcServiceTest extends DefaultRaoidcService {
        public readonly fetchServerMetadataTest = this.fetchServerMetadata;
      }

      const service = new DefaultRaoidcServiceTest(mockLogFactory, mockServerConfig);

      // Act and Assert
      expect(service.fetchServerMetadataTest.options.maxAge).toBe(10000); // 10 seconds in milliseconds
    });
  });

  describe('generateSigninRequest', () => {
    it('should generate a signin request', async () => {
      const mockCodeChallenge = 'mock_code_challenge';
      const mockCodeVerifier = 'mock_code_verifier';
      const mockState = 'mock_state';
      const mockAuthUrl = new URL('https://example.com/auth/auth');
      const mockServerMetadata = mock<ServerMetadata>({ authorization_endpoint: mockAuthUrl.toString() });
      const mockJwkSet = mock<JWKSet>();

      vi.mocked(generateCodeChallenge).mockReturnValue({ codeChallenge: mockCodeChallenge, codeVerifier: mockCodeVerifier });
      vi.mocked(generateRandomState).mockReturnValue(mockState);
      vi.mocked(fetchServerMetadata).mockResolvedValue({ serverMetadata: mockServerMetadata, jwkSet: mockJwkSet });
      vi.mocked(generateAuthorizationRequest).mockReturnValue(mockAuthUrl);

      const redirectUri = 'mock_redirect_uri';
      const service = new DefaultRaoidcService(mockLogFactory, mockServerConfig);
      const result = await service.generateSigninRequest(redirectUri);

      expect(result).toEqual({ authUrl: mockAuthUrl, codeVerifier: mockCodeVerifier, state: mockState });
    });
  });

  describe('generateSignoutRequest', () => {
    it('should generate a signout request', () => {
      const sessionId = 'mock_session_id';
      const locale: AppLocale = 'en';
      const expectedSignoutUrl = 'mock_signout_url';

      vi.mocked(expandTemplate).mockReturnValue(expectedSignoutUrl);

      const service = new DefaultRaoidcService(mockLogFactory, mockServerConfig);
      const signoutUrl = service.generateSignoutRequest({ sessionId, locale });
      expect(signoutUrl).toBe(expectedSignoutUrl);
    });
  });

  describe('handleCallback', () => {
    it('should handle a callback', async () => {
      // Implementation for handleCallback test
      const mockRequest = new Request('http://localhost?code=mock_auth_code&state=mock_state');
      const codeVerifier = 'mock_code_verifier';
      const expectedState = 'mock_state';
      const redirectUri = 'mock_redirect_uri';
      const mockAccessToken = 'mock_access_token';
      const mockIdToken = mock<IdToken & JWTPayload>();
      const mockUserInfoToken = mock<UserinfoToken & JWTPayload>();
      const mockPrivateDecryptionKey = mock<CryptoKey>();
      const mockPrivateSigningKey = mock<CryptoKey>();
      const mockPrivateKeyId = 'mock_private_key_id';
      const mockServerMetadata = mock<ServerMetadata>();
      const mockJwkSet = mock<JWKSet>();

      vi.mocked(generateCryptoKey).mockResolvedValueOnce(mockPrivateDecryptionKey).mockResolvedValueOnce(mockPrivateSigningKey);
      vi.mocked(subtle.exportKey).mockImplementationOnce(() => {
        const json = { name: 'Pankaj', age: 20 };
        const jsonString = JSON.stringify(json);
        const arrayBuffer = new TextEncoder().encode(jsonString).buffer;
        return Promise.resolve(arrayBuffer);
      });
      vi.mocked(generateJwkId).mockReturnValue(mockPrivateKeyId);
      vi.mocked(fetchServerMetadata).mockResolvedValue({ serverMetadata: mockServerMetadata, jwkSet: mockJwkSet });
      vi.mocked(fetchAccessToken).mockResolvedValue({ accessToken: mockAccessToken, idToken: mockIdToken });
      vi.mocked(fetchUserInfo).mockResolvedValue(mockUserInfoToken);

      const service = new DefaultRaoidcService(mockLogFactory, mockServerConfig);
      const result = await service.handleCallback({ request: mockRequest, codeVerifier, expectedState, redirectUri });

      expect(result).toEqual({ accessToken: mockAccessToken, idToken: mockIdToken, userInfoToken: mockUserInfoToken });
    });

    it('should handle a callback with error parameter', async () => {
      const mockRequest = new Request('http://localhost?error=mock_error&state=mock_state');
      const codeVerifier = 'mock_code_verifier';
      const expectedState = 'mock_state';
      const redirectUri = 'mock_redirect_uri';

      const service = new DefaultRaoidcService(mockLogFactory, mockServerConfig);
      await expect(service.handleCallback({ request: mockRequest, codeVerifier, expectedState, redirectUri })).rejects.toThrowError('Unexpected error: mock_error');
    });

    it('should handle a callback with missing authorization code', async () => {
      const mockRequest = new Request('http://localhost?state=mock_state');
      const codeVerifier = 'mock_code_verifier';
      const expectedState = 'mock_state';
      const redirectUri = 'mock_redirect_uri';

      const service = new DefaultRaoidcService(mockLogFactory, mockServerConfig);
      await expect(service.handleCallback({ request: mockRequest, codeVerifier, expectedState, redirectUri })).rejects.toThrowError('Missing authorization code in response');
    });

    it('should handle a callback with state mismatch', async () => {
      const mockRequest = new Request('http://localhost?code=mock_auth_code&state=wrong_state');
      const codeVerifier = 'mock_code_verifier';
      const expectedState = 'mock_state';
      const redirectUri = 'mock_redirect_uri';

      const service = new DefaultRaoidcService(mockLogFactory, mockServerConfig);
      await expect(service.handleCallback({ request: mockRequest, codeVerifier, expectedState, redirectUri })).rejects.toThrowError('CSRF error: incoming state [wrong_state] does not match expected state [mock_state]');
    });
  });

  describe('handleSessionValidation', () => {
    it('should handle session validation', async () => {
      const mockRequest = new Request('http://localhost/en/home?lang=en&id=00000000-0000-0000-0000-000000000000');
      const mockSession = mock<Session>();
      mockSession.has.calledWith('idToken').mockReturnValueOnce(true);
      mockSession.has.calledWith('userInfoToken').mockReturnValueOnce(true);
      mockSession.get.calledWith('idToken').mockReturnValueOnce({ sid: 'mock_sid' });
      mockSession.get.calledWith('userInfoToken').mockReturnValueOnce({ mocked: false });
      vi.mocked(validateSession).mockResolvedValue(true);

      const service = new DefaultRaoidcService(mockLogFactory, mockServerConfig);
      await service.handleSessionValidation({ request: mockRequest, session: mockSession });

      expect(validateSession).toHaveBeenCalledWith(mockServerConfig.AUTH_RAOIDC_BASE_URL, mockServerConfig.AUTH_RAOIDC_CLIENT_ID, 'mock_sid', undefined);
      expect(mockLogger.debug).toHaveBeenLastCalledWith('Authentication check passed');
    });

    it('should redirect to login if no idToken', async () => {
      const mockRequest = new Request('http://localhost/en/home?lang=en&id=00000000-0000-0000-0000-000000000000');
      const mockSession = mock<Session>();
      mockSession.has.calledWith('idToken').mockReturnValueOnce(false);
      mockSession.has.calledWith('userInfoToken').mockReturnValueOnce(false);

      const service = new DefaultRaoidcService(mockLogFactory, mockServerConfig);
      await expect(service.handleSessionValidation({ request: mockRequest, session: mockSession })).rejects.toThrow('MockedRedirect(/auth/login?returnto=%2Fen%2Fhome%3Flang%3Den%26id%3D00000000-0000-0000-0000-000000000000)');
      expect(validateSession).not.toHaveBeenCalled();
    });

    it('should redirect to login if no userInfoToken', async () => {
      const mockRequest = new Request('http://localhost/en/home?lang=en&id=00000000-0000-0000-0000-000000000000');
      const mockSession = mock<Session>();
      mockSession.has.calledWith('idToken').mockReturnValueOnce(true);
      mockSession.has.calledWith('userInfoToken').mockReturnValueOnce(false);

      const service = new DefaultRaoidcService(mockLogFactory, mockServerConfig);
      await expect(service.handleSessionValidation({ request: mockRequest, session: mockSession })).rejects.toThrow('MockedRedirect(/auth/login?returnto=%2Fen%2Fhome%3Flang%3Den%26id%3D00000000-0000-0000-0000-000000000000)');
      expect(validateSession).not.toHaveBeenCalled();
    });

    it('should skip validation for mocked users', async () => {
      const mockRequest = new Request('http://localhost/en/home?lang=en&id=00000000-0000-0000-0000-000000000000');
      const mockSession = mock<Session>();
      mockSession.has.calledWith('idToken').mockReturnValueOnce(true);
      mockSession.has.calledWith('userInfoToken').mockReturnValueOnce(true);
      mockSession.get.calledWith('idToken').mockReturnValueOnce({ sid: 'mock_sid' });
      mockSession.get.calledWith('userInfoToken').mockReturnValueOnce({ mocked: true });

      const service = new DefaultRaoidcService(mockLogFactory, mockServerConfig);
      await service.handleSessionValidation({ request: mockRequest, session: mockSession });

      expect(mockLogger.debug).toHaveBeenLastCalledWith('Mocked user; skipping RAOIDC session validation');
      expect(validateSession).not.toHaveBeenCalled();
    });

    it('should redirect to login if session is invalid', async () => {
      const mockRequest = new Request('http://localhost/en/home?lang=en&id=00000000-0000-0000-0000-000000000000');
      const mockSession = mock<Session>();
      mockSession.has.calledWith('idToken').mockReturnValueOnce(true);
      mockSession.has.calledWith('userInfoToken').mockReturnValueOnce(true);
      mockSession.get.calledWith('idToken').mockReturnValueOnce({ sid: 'mock_sid' });
      mockSession.get.calledWith('userInfoToken').mockReturnValueOnce({ mocked: false });
      vi.mocked(validateSession).mockResolvedValue(false);

      const service = new DefaultRaoidcService(mockLogFactory, mockServerConfig);
      await expect(service.handleSessionValidation({ request: mockRequest, session: mockSession })).rejects.toThrow('MockedRedirect(/auth/login?returnto=%2Fen%2Fhome%3Flang%3Den%26id%3D00000000-0000-0000-0000-000000000000)');
      expect(validateSession).toHaveBeenCalledWith(mockServerConfig.AUTH_RAOIDC_BASE_URL, mockServerConfig.AUTH_RAOIDC_CLIENT_ID, 'mock_sid', undefined);
    });
  });
});
