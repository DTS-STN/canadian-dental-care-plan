import { type LoaderFunctionArgs, redirect } from '@remix-run/node';

import { authService } from '~/services/auth-service.server';
import { sessionService } from '~/services/session-service.server';

/**
 * Creates the OIDC callback URL.
 */
function createRedirectUri(baseUri: string, providerId?: string) {
  return new URL(`/auth/callback/${providerId}`, baseUri).href;
}

/**
 * The loader() function generates an OIDC auth request and sends a redirect
 * back to the browser to initiate the login process.
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  const redirectUri = createRedirectUri(new URL(request.url).origin, params.providerId);
  const { authUrl, codeVerifier } = authService.generateAuthRequest(redirectUri);

  // codeVerifier will have to be validated in the callback handler, so store it in session
  const session = await sessionService.getSession(request.headers.get('Cookie'));
  session.set('codeVerifier', codeVerifier);

  return redirect(authUrl.href, {
    headers: {
      'Set-Cookie': await sessionService.commitSession(session),
    },
  });
}
