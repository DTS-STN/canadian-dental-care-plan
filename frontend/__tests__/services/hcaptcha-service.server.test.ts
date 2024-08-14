import { HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getHCaptchaService } from '~/services/hcaptcha-service.server';
import { getLogger } from '~/utils/logging.server';

vi.stubGlobal('fetch', vi.fn());

vi.mock('~/services/audit-service.server', () => ({
  getAuditService: vi.fn().mockReturnValue({
    audit: vi.fn(),
  }),
}));

vi.mock('~/services/instrumentation-service.server', () => ({
  getInstrumentationService: vi.fn().mockReturnValue({
    countHttpStatus: vi.fn(),
  }),
}));

vi.mock('~/utils/env-utils.server', () => ({
  getEnv: vi.fn().mockReturnValue({
    HCAPTCHA_SECRET_KEY: '0x0000000000000000000000000000000000000000',
    HCAPTCHA_VERIFY_URL: 'https://api.example.com',
  }),
}));

vi.mock('~/utils/logging.server', () => ({
  getLogger: vi.fn().mockReturnValue({
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    trace: vi.fn(),
    warn: vi.fn(),
  }),
}));

describe('hcaptcha-service.server tests', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('verifyHCaptchaResponse()', () => {
    it('should return verify result when fetch is successful', async () => {
      vi.mocked(fetch).mockResolvedValue(
        HttpResponse.json({
          success: true,
          score: 0,
        }),
      );

      const hCaptchaService = getHCaptchaService();
      const verifyResult = await hCaptchaService.verifyHCaptchaResponse('10000000-aaaa-bbbb-cccc-000000000001', '127.0.0.1');

      expect(verifyResult).toEqual({
        success: true,
        score: 0,
      });
    });

    it('should log warning when fetch is successful and verify result is unsuccessful', async () => {
      vi.mocked(fetch).mockResolvedValue(
        HttpResponse.json({
          success: false,
        }),
      );

      const hCaptchaService = getHCaptchaService();
      const verifyResult = await hCaptchaService.verifyHCaptchaResponse('10000000-aaaa-bbbb-cccc-000000000001', '127.0.0.1');

      expect(getLogger('hcaptcha-service.server').warn).toHaveBeenCalledOnce();
      expect(verifyResult).toEqual({
        success: false,
      });
    });

    it('should throw error if fetch response is not ok', async () => {
      vi.mocked(fetch).mockResolvedValue(new HttpResponse(null, { status: 500 }));

      const hCaptchaService = getHCaptchaService();
      await expect(() => hCaptchaService.verifyHCaptchaResponse('10000000-aaaa-bbbb-cccc-000000000001', '127.0.0.1')).rejects.toThrowError();
    });
  });
});
