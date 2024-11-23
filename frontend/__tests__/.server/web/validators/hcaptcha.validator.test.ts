import { beforeEach, describe, expect, it } from 'vitest';
import { mock, mockReset } from 'vitest-mock-extended';

import type { ServerConfig } from '~/.server/configs';
import type { LogFactory, Logger } from '~/.server/factories';
import type { HCaptchaService } from '~/.server/web/services';
import { DefaultHCaptchaValidator } from '~/.server/web/validators';

const mockLogger = mock<Logger>();
const mockLogFactory = mock<LogFactory>();
const mockServerConfig = mock<Pick<ServerConfig, 'HCAPTCHA_MAX_SCORE'>>();
const mockHCaptchaService = mock<HCaptchaService>();

describe('DefaultHCaptchaValidator', () => {
  const logFactory = mockLogFactory;
  logFactory.createLogger.mockReturnValue(mockLogger);
  const serverConfig = mockServerConfig;
  const hCaptchaService = mockHCaptchaService;

  const validator = new DefaultHCaptchaValidator(logFactory, serverConfig, hCaptchaService);

  beforeEach(() => {
    mockReset(mockLogger);
    mockReset(mockLogFactory);
    mockReset(mockServerConfig);
    mockReset(mockHCaptchaService);
  });

  it('should return isValid: true when the hCaptcha response is valid', async () => {
    serverConfig.HCAPTCHA_MAX_SCORE = 0.9;
    hCaptchaService.verifyHCaptchaResponse.mockResolvedValue({ success: true, score: 0.5 });

    const result = await validator.validateHCaptchaResponse({
      hCaptchaResponse: 'valid-token',
      userId: 'test-user',
      ipAddress: '127.0.0.1',
    });

    expect(result).toEqual({ isValid: true });
    expect(mockLogger.debug).toHaveBeenCalledWith('Starting hCaptcha response validation for user: %s, IP: %s', 'test-user', '127.0.0.1');
  });

  it('should return isValid: true when the hCaptcha response is missing', async () => {
    const result = await validator.validateHCaptchaResponse({
      hCaptchaResponse: '',
      userId: 'test-user',
      ipAddress: '127.0.0.1',
    });

    expect(result).toEqual({ isValid: true });
    expect(mockLogger.warn).toHaveBeenCalledWith('hCaptcha response not found for user: %s; gracefully passing validation', 'test-user');
  });

  it('should return isValid: false when the hCaptcha score exceeds the threshold', async () => {
    serverConfig.HCAPTCHA_MAX_SCORE = 0.9;
    hCaptchaService.verifyHCaptchaResponse.mockResolvedValue({ success: true, score: 1.0 });

    const result = await validator.validateHCaptchaResponse({
      hCaptchaResponse: 'valid-token',
      userId: 'test-user',
      ipAddress: '127.0.0.1',
    });

    expect(result).toEqual({
      isValid: false,
      errorMessage: 'hCaptcha response validation failed; hCaptcha score exceeds threshold.',
    });
    expect(mockLogger.warn).toHaveBeenCalledWith('hCaptcha score exceeds max threshold for user: %s, score: %s', 'test-user', 1.0);
  });

  it('should return isValid: true when an error occurs during validation', async () => {
    serverConfig.HCAPTCHA_MAX_SCORE = 0.9;
    hCaptchaService.verifyHCaptchaResponse.mockRejectedValue(new Error('Service unavailable'));

    const result = await validator.validateHCaptchaResponse({
      hCaptchaResponse: 'valid-token',
      userId: 'test-user',
      ipAddress: '127.0.0.1',
    });

    expect(result).toEqual({ isValid: true });
    expect(mockLogger.warn).toHaveBeenCalledWith('Error during hCaptcha response validation for user: %s; gracefully passing validation; error: %s', 'test-user', 'Service unavailable');
  });
});
