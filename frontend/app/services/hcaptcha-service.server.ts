import moize from 'moize';
import { z } from 'zod';

import { getAuditService } from '~/services/audit-service.server';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getEnv } from '~/utils/env-utils.server';
import { getLogger } from '~/utils/logging.server';

/**
 * Return a singleton instance (by means of memomization) of the hCaptcha service.
 */
export const getHCaptchaService = moize(createHCaptchaService, {
  onCacheAdd: () => {
    const log = getLogger('hcaptcha-service.server/getHCaptchaService');
    log.info('Creating new hCaptcha service');
  },
});

function createHCaptchaService() {
  const log = getLogger('hcaptcha-service.server/createHCaptchaService');
  const { HCAPTCHA_SECRET_KEY, HCAPTCHA_VERIFY_URL } = getEnv();

  /**
   * Verify the user response (ie. the "h-captcha-response" token).
   *
   * @see https://docs.hcaptcha.com/#verify-the-user-response-server-side
   */
  async function verifyHCaptchaResponse(hCaptchaResponse: string, ipAddress: string | null) {
    log.debug('Verifying hCaptcha response token');
    log.trace('hCaptcha response token: [%s]; IP address: [%s]', hCaptchaResponse, ipAddress);
    const instrumentationService = getInstrumentationService();

    getAuditService().audit('hcaptcha.verify', { userId: 'anonymous' });

    const url = new URL(HCAPTCHA_VERIFY_URL);
    url.searchParams.set('response', hCaptchaResponse);
    url.searchParams.set('secret', HCAPTCHA_SECRET_KEY);
    if (ipAddress) {
      url.searchParams.set('remoteip', ipAddress);
    }

    const response = await fetch(url, { method: 'POST' });
    instrumentationService.countHttpStatus('http.client.hcaptcha.posts', response.status);

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

    const verifyResultSchema = z.object({
      success: z.boolean(),
      score: z.number().optional(),
    });

    const json = await response.json();

    const verifyResult = verifyResultSchema.parse(json);
    if (verifyResult.success) {
      log.trace('hCaptcha verification successful with site verify response: [%j]', json);
    } else {
      log.warn('hCaptcha verification unsuccessful with site verify response: [%j]', json);
    }

    log.trace('Returning hCaptcha verify result: [%s]', verifyResult);
    return verifyResult;
  }

  return { verifyHCaptchaResponse };
}
