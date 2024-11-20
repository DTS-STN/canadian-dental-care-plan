import type { HCaptchaService } from '~/.server/web/services';
import { getEnv } from '~/utils/env-utils.server';
import { getClientIpAddress } from '~/utils/ip-address-utils.server';
import { getLogger } from '~/utils/logging.server';

interface VerifyHCaptchaResponseArgs {
  hCaptchaService: HCaptchaService;
  hCaptchaResponse: string;
  userId?: string;
  request: Request;
}

/**
 * Verifies an hCaptcha response token using the provided HCaptchaService and the client's IP address from the request object.
 *
 * @param hCaptchaService - An instance of the HCaptchaService used to perform hCaptcha verification.
 * @param hCaptchaResponse - The "h-captcha-response" token value
 * @param userId - The ID of the user making the request used for auditing (default is 'anonymous').
 * @param request - The incoming HTTP request object.
 * @returns A promise that resolves to:
 * - 'false' if the hCaptcha verification results in a score greater than the HCAPTCHA_MAX_SCORE environment variable
 * - 'true' otherwise
 */
async function verifyHCaptchaResponse({ hCaptchaService, hCaptchaResponse, userId = 'anonymous', request }: VerifyHCaptchaResponseArgs) {
  const log = getLogger('hcaptcha-route-helpers.server/verifyHCaptchaResponse');
  const { HCAPTCHA_MAX_SCORE } = getEnv();
  const ipAddress = getClientIpAddress(request);

  try {
    const hCaptchaVerifyRequest = {
      hCaptchaResponse,
      ipAddress: ipAddress ?? undefined,
      userId,
    };
    const verifyResult = await hCaptchaService.verifyHCaptchaResponse(hCaptchaVerifyRequest);
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
