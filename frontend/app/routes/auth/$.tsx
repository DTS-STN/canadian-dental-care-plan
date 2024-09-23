import type { LoaderFunctionArgs } from '@remix-run/node';
import { redirect } from '@remix-run/node';

import { z } from 'zod';

import { getAuditService } from '~/services/audit-service.server';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getSessionService } from '~/services/session-service.server';
import { getEnv, mockEnabled } from '~/utils/env-utils.server';
import { getLocale } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import type { IdToken } from '~/utils/raoidc-utils.server';
import { generateCallbackUri, generateRandomString } from '~/utils/raoidc-utils.server';

const log = getLogger('auth.$');
const defaultProviderId = 'raoidc';

/**
 * A do-all authentication handler for the application
 */
export async function loader({ context, params, request }: LoaderFunctionArgs) {
  const { '*': slug } = params;

  switch (slug) {
    case 'login': {
      return handleLoginRequest({ context, params, request });
    }
    case 'logout': {
      return handleLogoutRequest({ context, params, request });
    }
    case 'login/raoidc': {
      return handleRaoidcLoginRequest({ context, params, request });
    }
    case 'callback/raoidc': {
      return handleRaoidcCallbackRequest({ context, params, request });
    }
    //
    // A mock authorize route for testing purposes
    //
    case 'authorize': {
      if (!mockEnabled('raoidc')) {
        log.warn('Call to mock authorize endpoint when mocks are not enabled');
        return new Response(null, { status: 404 });
      }

      return handleMockAuthorizeRequest({ context, params, request });
    }
  }

  log.warn('Invalid authentication route requested: [%s]', slug);
  getInstrumentationService().createCounter('auth.unknown.requests').add(1);

  return new Response(null, { status: 404 });
}

/**
 * Handler for /auth/login requests
 */
function handleLoginRequest({ request }: LoaderFunctionArgs) {
  log.debug('Handling login request');
  getInstrumentationService().createCounter('auth.login.requests').add(1);

  const url = new URL(`/auth/login/${defaultProviderId}`, request.url);
  url.search = new URL(request.url).search;

  log.debug('Redirecting to default provider handler: [%s]', url);
  return redirect(url.toString());
}

/**
 * Handler for /auth/logout requests
 */
async function handleLogoutRequest({ context: { session }, request }: LoaderFunctionArgs) {
  log.debug('Handling RAOIDC logout request');
  getInstrumentationService().createCounter('auth.logout.requests').add(1);

  const { AUTH_RASCL_LOGOUT_URL } = getEnv();

  const sessionService = await getSessionService();

  if (!session.has('idToken')) {
    log.debug(`User has not authenticated; bypassing RAOIDC logout and redirecting to RASCL logout`);
    getInstrumentationService().createCounter('auth.logout.requests.unauthenticated').add(1);
    throw redirect(AUTH_RASCL_LOGOUT_URL);
  }

  const idToken: IdToken = session.get('idToken');
  const locale = getLocale(request);

  const raoidcService = await getRaoidcService();
  const signoutUrl = raoidcService.generateSignoutRequest(idToken.sid, locale);

  log.debug('Destroying CDCP application session session and redirecting to downstream logout handler: [%s]', signoutUrl);
  getAuditService().audit('auth.session-destroyed', { userId: idToken.sub });

  return redirect(signoutUrl, {
    headers: { 'Set-Cookie': await sessionService.destroySession(session) },
  });
}

/**
 * Handler for /auth/login/raoidc requests
 */
async function handleRaoidcLoginRequest({ context: { session }, request }: LoaderFunctionArgs) {
  log.debug('Handling RAOIDC login request');
  getInstrumentationService().createCounter('auth.login.raoidc.requests').add(1);

  const sessionService = await getSessionService();
  await sessionService.destroySession(session);

  const { origin, searchParams } = new URL(request.url);
  const returnUrl = searchParams.get('returnto');

  if (returnUrl && !returnUrl.startsWith('/')) {
    log.warn('Invalid return URL [%s]', returnUrl);
    getInstrumentationService().createCounter('auth.login.raoidc.requests.invalid-return-url').add(1);

    return new Response(null, { status: 400 });
  }

  const redirectUri = generateCallbackUri(origin, 'raoidc');

  const raoidcService = await getRaoidcService();
  const { authUrl, codeVerifier, state } = raoidcService.generateSigninRequest(redirectUri);

  log.debug('Storing [codeVerifier] and [state] in session for future validation');
  session.set('codeVerifier', codeVerifier);
  session.set('returnUrl', returnUrl ?? '/');
  session.set('state', state);

  log.debug('Redirecting to RAOIDC signin URL [%s]', authUrl.href);
  return redirect(authUrl.href);
}

/**
 * Handler for /auth/callback/raoidc requests
 */
async function handleRaoidcCallbackRequest({ context: { session }, request }: LoaderFunctionArgs) {
  log.debug('Handling RAOIDC callback request');
  getInstrumentationService().createCounter('auth.callback.raoidc.requests').add(1);

  const raoidcService = await getRaoidcService();
  const codeVerifier = session.get('codeVerifier');
  const returnUrl = session.get('returnUrl') ?? '/';
  const state = session.get('state');

  const redirectUri = generateCallbackUri(new URL(request.url).origin, 'raoidc');

  log.debug('Storing auth tokens and userinfo in session');
  const { idToken, userInfoToken } = await raoidcService.handleCallback(request, codeVerifier, state, redirectUri);
  session.set('idToken', idToken);
  session.set('userInfoToken', userInfoToken);

  log.debug('RAOIDC login successful; redirecting to [%s]', returnUrl);
  getAuditService().audit('auth.session-created', { userId: idToken.sub });

  return redirect(returnUrl);
}

/**
 * @see https://openid.net/specs/openid-connect-core-1_0.html#AuthorizationEndpoint
 */
function handleMockAuthorizeRequest({ request }: LoaderFunctionArgs) {
  log.debug('Handling (mock) RAOIDC authorize request');
  getInstrumentationService().createCounter('auth.authorize.requests').add(1);

  const { MOCK_AUTH_ALLOWED_REDIRECTS } = getEnv();
  const isValidRedirectUri = (val: string): boolean => MOCK_AUTH_ALLOWED_REDIRECTS.includes(val);

  const searchParamsSchema = z.object({
    clientId: z.string().min(1).max(64),
    codeChallenge: z.string().min(43).max(128),
    codeChallengeMethod: z.enum(['S256']),
    nonce: z.string().min(8).max(64),
    redirectUri: z.string().refine(isValidRedirectUri),
    responseType: z.enum(['code']),
    scope: z.enum(['openid profile']),
    state: z.string().min(8).max(256),
  });

  const searchParams = new URL(request.url).searchParams;

  const result = searchParamsSchema.safeParse({
    clientId: searchParams.get('client_id'),
    codeChallenge: searchParams.get('code_challenge'),
    codeChallengeMethod: searchParams.get('code_challenge_method'),
    nonce: searchParams.get('nonce'),
    redirectUri: searchParams.get('redirect_uri'),
    responseType: searchParams.get('response_type'),
    scope: searchParams.get('scope'),
    state: searchParams.get('state'),
  });

  if (!result.success) {
    log.warn('Invalid authorize request [%j]', result.error.flatten().fieldErrors);
    getInstrumentationService().createCounter('auth.authorize.requests.invalid').add(1);

    return new Response(JSON.stringify(result.error.flatten().fieldErrors), { status: 400 });
  }

  const redirectUri = new URL(result.data.redirectUri);
  redirectUri.searchParams.set('code', generateRandomString(16));
  redirectUri.searchParams.set('state', result.data.state);

  log.debug('Mock login successful; redirecting to [%s]', redirectUri.toString());
  return redirect(redirectUri.toString());
}
