import type { MiddlewareFunctionArgs } from 'remix-create-express-app/middleware';

import { getLogger } from '~/utils/logging.server';

const log = getLogger('securityheaders-middleware.server');

// @see: https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html
export async function securityHeadersMiddleware({ request, context, next }: MiddlewareFunctionArgs) {
  log.debug('Adding security headers to response');

  const response = await next();
  response.headers.append('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.append('Cross-Origin-Resource-Policy', 'same-origin');
  response.headers.append('Permissions-Policy', 'camera=(), display-capture=(), fullscreen=(), geolocation=(), interest-cohort=(), microphone=(), publickey-credentials-get=(), screen-wake-lock=()');
  response.headers.append('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.append('Server', 'webserver');
  response.headers.append('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
  response.headers.append('X-Content-Type-Options', 'nosniff');
  response.headers.append('X-Frame-Options', 'deny');
  return response;
}
