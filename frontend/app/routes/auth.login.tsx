import { type LoaderFunctionArgs, redirect } from '@remix-run/node';

/**
 * Requests to /auth/login should be forwarded to /auth/login/{providerId}
 */
export function loader({ request }: LoaderFunctionArgs) {
  // TODO :: GjB :: handle multiple providers
  return redirect('/auth/login/raoidc');
}
