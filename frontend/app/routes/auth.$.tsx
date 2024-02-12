import { type LoaderFunctionArgs, redirect } from '@remix-run/node';

import { z } from 'zod';

import { getRaoidcService } from '~/services/raoidc-service.server';
import { getSessionService } from '~/services/session-service.server';
import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';
import { generateCallbackUri, generateRandomString } from '~/utils/raoidc-utils.server';

const log = getLogger('auth.$');
const defaultProviderId = 'raoidc';

/**
 * A do-all authentication handler for the application
 */
export async function loader({ context, params, request }: LoaderFunctionArgs) {
  const { '*': slug } = params;

  switch (slug) {
    case 'login':
      return handleLoginRequest({ context, params, request });
    case 'login/raoidc':
      return handleRaoidcLoginRequest({ context, params, request });
    case 'callback/raoidc':
      return handleRaoidcCallbackRequest({ context, params, request });
    //
    // A mock authorize route for testing purposes
    //
    case 'authorize':
      const { ENABLED_MOCKS } = getEnv();

      if (!ENABLED_MOCKS.includes('raoidc')) {
        log.warn('Call to mock authorize endpoint when mocks are not enabled');
        return new Response(null, { status: 404 });
      }

      return handleMockAuthorizeRequest({ context, params, request });
  }

  log.warn('Invalid authentication route requested: [%s]', slug);
  return new Response(null, { status: 404 });
}

/**
 * Handler for /auth/login requests
 */
async function handleLoginRequest({ params, request }: LoaderFunctionArgs) {
  const url = new URL(`/auth/login/${defaultProviderId}`, request.url);
  url.search = new URL(request.url).search;

  log.debug('Redirecting to default provider handler: [%s]', url);
  return redirect(url.toString());
}

/**
 * Handler for /auth/login/raoidc requests
 */
async function handleRaoidcLoginRequest({ params, request }: LoaderFunctionArgs) {
  log.debug('Handling RAOIDC login request');

  const { origin, searchParams } = new URL(request.url);
  const returnUrl = searchParams.get('returnto');

  if (!returnUrl?.startsWith('/')) {
    log.warn('Invalid return URL [%s]', returnUrl);
    return new Response(null, { status: 400 });
  }

  const redirectUri = generateCallbackUri(origin, 'raoidc');

  const raoidcService = await getRaoidcService();
  const { authUrl, codeVerifier, state } = raoidcService.generateSigninRequest(redirectUri);

  log.debug('Storing [codeVerifier] and [state] in session for future validation');
  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request);
  // set as flash values so they're removed after the first get()
  session.flash('codeVerifier', codeVerifier);
  session.flash('returnUrl', returnUrl ?? '/');
  session.flash('state', state);

  log.debug('Redirecting to RAOIDC signin URL [%s]', authUrl.href);
  return redirect(authUrl.href, {
    headers: { 'Set-Cookie': await sessionService.commitSession(session) },
  });
}

/**
 * Handler for /auth/callback/raoidc requests
 */
async function handleRaoidcCallbackRequest({ params, request }: LoaderFunctionArgs) {
  log.debug('Handling RAOIDC callback request');

  const raoidcService = await getRaoidcService();
  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request);
  const codeVerifier = session.get('codeVerifier');
  const returnUrl = session.get('returnUrl') ?? '/';
  const state = session.get('state');

  const redirectUri = generateCallbackUri(new URL(request.url).origin, 'raoidc');

  log.debug('Storing auth tokens and userinfo in session');
  const { auth, user_info: userInfo } = await raoidcService.handleCallback(request, codeVerifier, state, redirectUri);
  session.set('auth', auth);
  session.set('userInfo', userInfo);

  log.debug('RAOIDC login successful; redirecting to [%s]', returnUrl);
  return redirect(returnUrl, {
    headers: { 'Set-Cookie': await sessionService.commitSession(session) },
  });
}

/**
 * @see https://openid.net/specs/openid-connect-core-1_0.html#AuthorizationEndpoint
 */
function handleMockAuthorizeRequest({ params, request }: LoaderFunctionArgs) {
  log.debug('Handling (mock) RAOIDC authorize request');

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
    return new Response(JSON.stringify(result.error.flatten().fieldErrors), { status: 400 });
  }

  const redirectUri = new URL(result.data.redirectUri);
  redirectUri.searchParams.set('code', generateRandomString(16));
  redirectUri.searchParams.set('state', result.data.state);

  log.debug('Mock login successful; redirecting to [%s]', redirectUri.toString());
  return redirect(redirectUri.toString());
}
