import moize from 'moize';
import { z } from 'zod';

import { getAuditService } from '~/services/audit-service.server';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
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
    const instrumentationService = getInstrumentationService();

    getAuditService().audit('hcaptcha.verify', { userId: 'anonymous' });

    const url = new URL(HCAPTCHA_VERIFY_URL);
    url.searchParams.set('response', hCaptchaResponse);
    url.searchParams.set('secret', HCAPTCHA_SECRET_KEY);

    const response = await fetch(url, { method: 'POST' });

    if (!response.ok) {
      instrumentationService.countHttpStatus('http.client.hcaptcha.posts', response.status);
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
      challenge_ts: z.string().datetime(),
      hostname: z.string(),
      'error-codes': z.array(z.string()).optional(),
      score: z.number().optional(),
    });

    const verifyResult = verifyResultSchema.parse(await response.json());
    if (verifyResult.success) {
      instrumentationService.countHttpStatus('http.client.hcaptcha.posts.success', 200);
      log.info(`hCaptcha verification successful: [${JSON.stringify(verifyResult)}]`);
    } else {
      instrumentationService.countHttpStatus('http.client.hcaptcha.posts.failed', 200);
      log.warn(`hCaptcha verification failed: [${JSON.stringify(verifyResult)}]`);
    }
  }

  return { verifyHCaptchaResponse };
}
