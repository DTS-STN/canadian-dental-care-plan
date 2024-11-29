import type { RequestHandler } from 'express';
import morganMiddleware from 'morgan';

import { getLogger } from '~/.server/utils/logging.utils';

// @see: https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html
export function securityHeaders(): RequestHandler {
  const log = getLogger('express.server/securityHeadersRequestHandler');

  // prettier-ignore
  const permissionsPolicy = [
    'camera=()',
    'display-capture=()',
    'fullscreen=()',
    'geolocation=()',
    'interest-cohort=()',
    'microphone=()',
    'publickey-credentials-get=()',
    'screen-wake-lock=()',
  ].join(', ');

  return (request, response, next) => {
    log.debug('Adding security headers to response');

    response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    response.setHeader('Permissions-Policy', permissionsPolicy);
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.setHeader('Server', 'webserver');
    response.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'deny');

    next();
  };
}

export function logging(isProduction: boolean): RequestHandler {
  const log = getLogger('express.server/loggingRequestHandler');

  const logFormat = isProduction ? 'tiny' : 'dev';

  const middleware = morganMiddleware(logFormat, {
    stream: { write: (msg) => log.audit(msg.trim()) },
  });

  return (request, response, next) => {
    return middleware(request, response, next);
  };
}
