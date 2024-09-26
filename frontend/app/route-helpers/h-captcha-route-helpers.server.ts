import { getHCaptchaService } from '~/services/hcaptcha-service.server';
import { getEnv } from '~/utils/env-utils.server';
import { getClientIpAddress } from '~/utils/ip-address-utils.server';
import { getLogger } from '~/utils/logging.server';

/**
 * Verifies an hCaptcha response token and the client's IP address from the request object and calling the hCaptchaService with these two pieces of data.
 *
 * @param hCaptchaResponse - The "h-captcha-response" token value
 * @param request - The incoming HTTP request object.
 * @returns A promise that resolves to:
 * - 'false' if the hCaptcha verification results in a score greater than the HCAPTCHA_MAX_SCORE environment variable
 * - 'true' otherwise
 */
async function verifyHCaptchaResponse(hCaptchaResponse: string, request: Request) {
  const log = getLogger('h-captcha-route-helpers.server/verifyHCaptchaResponse');
  const { HCAPTCHA_MAX_SCORE } = getEnv();
  const clientIpAddress = getClientIpAddress(request);

  try {
    const hCaptchaService = getHCaptchaService();
    const verifyResult = await hCaptchaService.verifyHCaptchaResponse(hCaptchaResponse, clientIpAddress);
    if (verifyResult.score !== undefined && verifyResult.score > HCAPTCHA_MAX_SCORE) {
      return false;
    }
  } catch (error) {
    log.warn(`hCaptcha verification failed: [${error}]; Proceeding with normal application flow`);
  }

  return true;
}

export function getHCaptchaRouteHelpers() {
  return {
    verifyHCaptchaResponse,
  };
}
