import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('csp-utils.server');

/**
 * Generate a strict content security policy.
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html
 */
export function generateContentSecurityPolicy(nonce: string) {
  const { NODE_ENV } = getEnv();
  const isDevelopment = NODE_ENV === 'development';

  const contentSecurityPolicy = [
    // prettier-ignore
    `base-uri 'none'`,
    `default-src 'none'`,
    `connect-src 'self' https://hcaptcha.com https://*.hcaptcha.com` + (isDevelopment ? ' ws://localhost:3001' : ''),
    `font-src 'self' fonts.gstatic.com`,
    `form-action 'self'`,
    `frame-ancestors 'self'`,
    `frame-src 'self' https://hcaptcha.com https://*.hcaptcha.com`,
    `img-src 'self' data:`,
    `script-src 'strict-dynamic' 'nonce-${nonce}' https://hcaptcha.com https://*.hcaptcha.com`,
    // unsafe-inline is required by remix-toast 💩
    `style-src 'self' 'unsafe-inline' https://hcaptcha.com https://*.hcaptcha.com`,
  ].join('; ');

  log.debug(`Generated content security policy: [${contentSecurityPolicy}]`);
  return contentSecurityPolicy;
}

/**
 * Generate a secure permissions policy.
 * @see https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html#permissions-policy-formerly-feature-policy
 */
export function generatePermissionsPolicy() {
  // prettier-ignore
  const permissionsPolicy = [
    'camera=()',
    'display-capture=()',
    'fullscreen=()',
    'geolocation=()',
    'microphone=()',
    'publickey-credentials-get=()',
    'screen-wake-lock=()',
  ].join(', ');

  log.debug(`Generated content security policy: [${permissionsPolicy}]`);
  return permissionsPolicy;
}
