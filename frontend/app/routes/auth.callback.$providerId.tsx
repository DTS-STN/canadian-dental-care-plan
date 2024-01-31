import { type LoaderFunctionArgs, redirect } from '@remix-run/node';

import { raoidcService } from '~/services/raoidc-service.server';
import { sessionService } from '~/services/session-service.server';
import { getLogger } from '~/utils/logging.server';
import { generateCallbackUri } from '~/utils/raoidc-utils.server';

export async function loader({ request, params }: LoaderFunctionArgs) {
  const log = getLogger('auth.login');

  if (!raoidcService) {
    log.warn('Call to /auth/callback/%s but authentication is disabled', params.providerId);
    // TODO :: GjB :: handle this better than just throwing an error
    throw new Error('RAOIDC service not configured');
  }

  const session = await sessionService.getSession(request.headers.get('Cookie'));
  const codeVerifier = session.get('codeVerifier');
  const state = session.get('state');
  const redirectUri = generateCallbackUri(new URL(request.url).origin, params.providerId);

  const { auth, user_info: userInfo } = await raoidcService.handleCallback(request, codeVerifier, state, redirectUri);
  session.set('auth', auth);
  session.set('userInfo', userInfo);

  return redirect('/', {
    headers: {
      'Set-Cookie': await sessionService.commitSession(session),
    },
  });
}
