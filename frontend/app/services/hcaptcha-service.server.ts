import moize from 'moize';

import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('hcaptcha-service.server');

/**
 * Return a singleton instance (by means of memomization) of the hCaptcha service.
 */
export const getHCaptchaService = moize(createHCaptchaService, { onCacheAdd: () => log.info('Creating new hCaptcha service') });

function createHCaptchaService() {
  const { HCAPTCHA_SECRET_KEY, HCAPTCHA_VERIFY_URL } = getEnv();

  /**
   * Verify the user response (ie. the "h-captcha-response" token).
   *
   * @see https://docs.hcaptcha.com/#verify-the-user-response-server-side
   */
  async function verifyHCaptchaResponse(hCaptchaResponse: string) {
    const url = new URL(HCAPTCHA_VERIFY_URL);
    url.searchParams.set('response', hCaptchaResponse);
    url.searchParams.set('secret', HCAPTCHA_SECRET_KEY);

    const response = await fetch(url, { method: 'POST' });

    if (!response.ok) {
      log.error('%j', {
        message: 'Failed to verify hCaptcha',
        status: response.status,
        statusText: response.statusText,
        url: HCAPTCHA_VERIFY_URL,
        responseBody: await response.text(),
      });

      throw new Error(`Failed to verify hCaptcha: ${response.status}, Status Text: ${response.statusText}`);
    }

    return response.json();
  }

  return { verifyHCaptchaResponse };
}
