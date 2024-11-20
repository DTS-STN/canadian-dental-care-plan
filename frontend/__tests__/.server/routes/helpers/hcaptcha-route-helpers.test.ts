import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getHCaptchaRouteHelpers } from '~/.server/routes/helpers/hcaptcha-route-helpers';
import { getLogger } from '~/utils/logging.server';

vi.mock('~/utils/env-utils.server', () => ({
  getEnv: vi.fn().mockReturnValue({
    HCAPTCHA_MAX_SCORE: 0.5,
  }),
}));

vi.mock('~/utils/ip-address-utils.server', () => ({
  getClientIpAddress: vi.fn(),
}));

vi.mock('~/utils/logging.server', () => ({
  getLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    warn: vi.fn(),
  }),
}));

describe('hcaptcha-route-helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('verifyHCaptchaResponse', () => {
    it('should return false if hCaptcha verification results in a score greater than the HCAPTCHA_MAX_SCORE', async () => {
      const mockHCaptchaService = {
        verifyHCaptchaResponse: vi.fn().mockResolvedValue({ success: true, score: 0.51 }),
      };

      const result = await getHCaptchaRouteHelpers().verifyHCaptchaResponse({
        hCaptchaService: mockHCaptchaService,
        hCaptchaResponse: 'sample-h-captcha-response',
        request: new Request('http://www.example.com'),
      });

      expect(result).toEqual(false);
    });

    it('should return true if hCaptcha verification results in a score less than the HCAPTCHA_MAX_SCORE', async () => {
      const mockHCaptchaService = {
        verifyHCaptchaResponse: vi.fn().mockResolvedValue({ success: true, score: 0.49 }),
      };

      const result = await getHCaptchaRouteHelpers().verifyHCaptchaResponse({
        hCaptchaService: mockHCaptchaService,
        hCaptchaResponse: 'sample-h-captcha-response',
        request: new Request('http://www.example.com'),
      });

      expect(result).toEqual(true);
    });

    it('should return true and log warning if hCaptcha verification results in an error', async () => {
      const mockHCaptchaService = {
        verifyHCaptchaResponse: vi.fn().mockRejectedValue(() => {
          throw new Error('Example error');
        }),
      };

      const result = await getHCaptchaRouteHelpers().verifyHCaptchaResponse({
        hCaptchaService: mockHCaptchaService,
        hCaptchaResponse: 'sample-h-captcha-response',
        request: new Request('http://www.example.com'),
      });

      expect(result).toEqual(true);
      expect(getLogger('hcaptcha-route-helpers.server').warn).toHaveBeenCalledOnce();
    });
  });
});
