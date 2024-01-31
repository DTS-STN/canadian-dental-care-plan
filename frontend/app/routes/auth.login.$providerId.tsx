import { type LoaderFunctionArgs, redirect } from '@remix-run/node';

import { raoidcService } from '~/services/raoidc-service.server';
import { sessionService } from '~/services/session-service.server';
import { getLogger } from '~/utils/logging.server';
import { generateCallbackUri } from '~/utils/raoidc-utils.server';

/**
 * The loader() function generates an OIDC auth request and sends a redirect
 * back to the browser to initiate the login process.
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  const log = getLogger('auth.login');

  if (!raoidcService) {
    log.warn('Call to /auth/login/%s but authentication is disabled', params.providerId);
    // TODO :: GjB :: handle this better than just throwing an error
    throw new Error('RAOIDC service not configured');
  }

  const redirectUri = generateCallbackUri(new URL(request.url).origin, params.providerId);
  const { authUrl, codeVerifier, state } = raoidcService.generateAuthRequest(redirectUri);

  // codeVerifier and state will have to be validated in the callback handler
  const session = await sessionService.getSession(request.headers.get('Cookie'));
  session.set('codeVerifier', codeVerifier);
  session.set('state', state);

  return redirect(authUrl.href, {
    headers: {
      'Set-Cookie': await sessionService.commitSession(session),
    },
  });
}
