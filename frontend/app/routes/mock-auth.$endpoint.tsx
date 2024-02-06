import { type LoaderFunctionArgs, redirect } from '@remix-run/node';

import { z } from 'zod';

import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';
import { generateRandomString } from '~/utils/raoidc-utils.server';

const log = getLogger('mock-auth.$endpoint');

/**
 * A mock OIDC auth provider that currently supports the `authorize` endpoint.
 */
export function loader({ context, request, params }: LoaderFunctionArgs) {
  const { endpoint } = params;

  switch (endpoint) {
    case 'authorize':
      return handleAuthorizeRequest({ context, request, params });
  }

  log.warn('Invalid endpoint requested: [%s]', endpoint);
  return new Response(null, { status: 404 });
}

/**
 * @see https://openid.net/specs/openid-connect-core-1_0.html#AuthorizationEndpoint
 */
function handleAuthorizeRequest({ request, params }: LoaderFunctionArgs) {
  const { MOCK_AUTH_ALLOWED_REDIRECTS } = getEnv(); // used to prevent phishing attacks

  const searchParamsSchema = z.object({
    clientId: z.string().min(1).max(64),
    codeChallenge: z.string().min(43).max(128),
    codeChallengeMethod: z.enum(['S256']),
    nonce: z.string().min(8).max(64),
    redirectUri: z.string().refine((val) => MOCK_AUTH_ALLOWED_REDIRECTS.includes(val)),
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
    return new Response(JSON.stringify(result.error.flatten().fieldErrors), { status: 400 });
  }

  const redirectUri = new URL(result.data.redirectUri);
  redirectUri.searchParams.set('code', generateRandomString(16));
  redirectUri.searchParams.set('state', result.data.state);

  return redirect(redirectUri.toString());
}
