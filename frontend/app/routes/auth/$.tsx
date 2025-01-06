import type { LoaderFunctionArgs } from 'react-router';
import { redirectDocument } from 'react-router';

import { TYPES } from '~/.server/constants';
import { getLocale } from '~/.server/utils/locale.utils';
import { getLogger } from '~/.server/utils/logging.utils';
import type { IdToken } from '~/.server/utils/raoidc.utils';
import { generateCallbackUri } from '~/.server/utils/raoidc.utils';

const defaultProviderId = 'raoidc';

/**
 * A do-all authentication handler for the application
 */
export async function loader({ context, params, request }: LoaderFunctionArgs) {
  const log = getLogger('auth.$/loader');
  const { '*': slug } = params;
  const instrumentationService = context.appContainer.get(TYPES.observability.InstrumentationService);

  switch (slug) {
    case 'login': {
      return handleLoginRequest({ context, params, request });
    }
    case 'logout': {
      return handleLogoutRequest({ context, params, request });
    }
    case 'login/raoidc': {
      return await handleRaoidcLoginRequest({ context, params, request });
    }
    case 'callback/raoidc': {
      return await handleRaoidcCallbackRequest({ context, params, request });
    }
    default: {
      log.warn('Invalid authentication route requested: [%s]', slug);

      instrumentationService.createCounter('auth.unknown.requests').add(1);
      return Response.json(null, { status: 404 });
    }
  }
}

/**
 * Handler for /auth/login requests
 */
function handleLoginRequest({ context: { appContainer }, request }: LoaderFunctionArgs) {
  const log = getLogger('auth.$/handleLoginRequest');
  log.debug('Handling login request');
  const instrumentationService = appContainer.get(TYPES.observability.InstrumentationService);
  instrumentationService.createCounter('auth.login.requests').add(1);

  const url = new URL(`/auth/login/${defaultProviderId}`, request.url);
  url.search = new URL(request.url).search;

  log.debug('Redirecting to default provider handler: [%s]', url);
  return redirectDocument(url.toString());
}

/**
 * Handler for /auth/logout requests
 */
function handleLogoutRequest({ context: { appContainer, session }, request }: LoaderFunctionArgs) {
  const log = getLogger('auth.$/handleLogoutRequest');
  log.debug('Handling RAOIDC logout request');
  const instrumentationService = appContainer.get(TYPES.observability.InstrumentationService);
  instrumentationService.createCounter('auth.logout.requests').add(1);

  const { AUTH_RASCL_LOGOUT_URL } = appContainer.get(TYPES.configs.ServerConfig);

  if (!session.has('idToken')) {
    log.debug(`User has not authenticated; bypassing RAOIDC logout and redirecting to RASCL logout`);
    instrumentationService.createCounter('auth.logout.requests.unauthenticated').add(1);
    throw redirectDocument(AUTH_RASCL_LOGOUT_URL);
  }

  const idToken: IdToken = session.get('idToken');
  const locale = getLocale(request);

  const raoidcService = appContainer.get(TYPES.auth.RaoidcService);
  const signoutUrl = raoidcService.generateSignoutRequest({ sessionId: idToken.sid, locale });

  log.debug('Destroying CDCP application session session and redirecting to downstream logout handler: [%s]', signoutUrl);
  const auditService = appContainer.get(TYPES.domain.services.AuditService);
  auditService.createAudit('auth.session-destroyed', { userId: idToken.sub });

  session.destroy();
  return redirectDocument(signoutUrl);
}

/**
 * Handler for /auth/login/raoidc requests
 */
async function handleRaoidcLoginRequest({ context: { appContainer, session }, request }: LoaderFunctionArgs) {
  const log = getLogger('auth.$/handleRaoidcLoginRequest');
  log.debug('Handling RAOIDC login request');
  const instrumentationService = appContainer.get(TYPES.observability.InstrumentationService);
  instrumentationService.createCounter('auth.login.raoidc.requests').add(1);

  session.destroy();

  const { origin, searchParams } = new URL(request.url);
  const returnUrl = searchParams.get('returnto');

  if (returnUrl && !returnUrl.startsWith('/')) {
    log.warn('Invalid return URL [%s]', returnUrl);
    instrumentationService.createCounter('auth.login.raoidc.requests.invalid-return-url').add(1);

    return Response.json(null, { status: 400 });
  }

  const redirectUri = generateCallbackUri(origin, 'raoidc');

  const raoidcService = appContainer.get(TYPES.auth.RaoidcService);
  const { authUrl, codeVerifier, state } = await raoidcService.generateSigninRequest(redirectUri);

  log.debug('Storing [codeVerifier] and [state] in session for future validation');
  session.set('codeVerifier', codeVerifier);
  session.set('returnUrl', returnUrl ?? '/');
  session.set('state', state);

  log.debug('Redirecting to RAOIDC signin URL [%s]', authUrl.href);
  return redirectDocument(authUrl.href);
}

/**
 * Handler for /auth/callback/raoidc requests
 */
async function handleRaoidcCallbackRequest({ context: { appContainer, session }, request }: LoaderFunctionArgs) {
  const log = getLogger('auth.$/handleRaoidcCallbackRequest');
  log.debug('Handling RAOIDC callback request');
  const instrumentationService = appContainer.get(TYPES.observability.InstrumentationService);
  instrumentationService.createCounter('auth.callback.raoidc.requests').add(1);

  const raoidcService = appContainer.get(TYPES.auth.RaoidcService);
  const codeVerifier = session.get<string>('codeVerifier');
  const returnUrl = session.find<string>('returnUrl') ?? '/';
  const state = session.get<string>('state');

  const redirectUri = generateCallbackUri(new URL(request.url).origin, 'raoidc');

  log.debug('Storing auth tokens and userinfo in session');
  const { idToken, userInfoToken } = await raoidcService.handleCallback({ request, codeVerifier, expectedState: state, redirectUri });
  session.set('idToken', idToken);
  session.set('userInfoToken', userInfoToken);

  log.debug('RAOIDC login successful; redirecting to [%s]', returnUrl);
  const auditService = appContainer.get(TYPES.domain.services.AuditService);
  auditService.createAudit('auth.session-created', { userId: idToken.sub });

  return redirectDocument(returnUrl);
}
