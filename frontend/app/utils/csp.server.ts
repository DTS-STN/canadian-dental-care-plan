import { getLogger } from './logging.server';
import { getEnv } from '~/utils/environment.server';

const log = getLogger('csp.server');

/**
 * Generate a strict CSP.
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html
 */
export function generateContentSecurityPolicy(nonce: string) {
  const isDevelopment = getEnv('NODE_ENV') === 'development';

  const contentSecurityPolicy = [
    // prettier-ignore
    `base-uri 'none'`,
    `default-src 'none'`,
    `connect-src 'self'` + (isDevelopment ? ' ws://localhost:3001' : ''),
    `font-src 'self' fonts.gstatic.com`,
    `img-src 'self'`,
    `script-src 'strict-dynamic' 'nonce-${nonce}'`,
    `style-src 'self'`,
  ].join('; ');

  log.debug(`Generated content security policy: [${contentSecurityPolicy}]`);
  return contentSecurityPolicy;
}
