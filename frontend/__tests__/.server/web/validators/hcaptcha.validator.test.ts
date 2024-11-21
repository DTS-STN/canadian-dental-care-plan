import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockProxy } from 'vitest-mock-extended';
import { mock } from 'vitest-mock-extended';

import type { ServerConfig } from '~/.server/configs';
import type { LogFactory, Logger } from '~/.server/factories';
import { HCaptchaInvalidException, HCaptchaResponseNotFoundException } from '~/.server/web/exceptions';
import type { HCaptchaService } from '~/.server/web/services';
import { DefaultHCaptchaValidator } from '~/.server/web/validators';
import { getClientIpAddress } from '~/utils/ip-address-utils.server';

vi.mock('~/utils/ip-address-utils.server');

describe('DefaultHCaptchaValidator', () => {
  let validator: DefaultHCaptchaValidator;
  let mockLogFactory: MockProxy<LogFactory>;
  let mockHCaptchaService: MockProxy<HCaptchaService>;
  let mockServerConfig: Pick<ServerConfig, 'HCAPTCHA_MAX_SCORE'>;
  let mockRequest: Request;
  const userId = 'test-user';

  beforeEach(() => {
    // Mock the Logger behavior
    const mockLogger = mock<Logger>();

    // Mock dependencies using vitest-mock-extended
    mockLogFactory = mock<LogFactory>();
    mockLogFactory.createLogger.mockReturnValue(mockLogger);

    mockServerConfig = { HCAPTCHA_MAX_SCORE: 0.9 };
    mockHCaptchaService = mock<HCaptchaService>();

    validator = new DefaultHCaptchaValidator(mockLogFactory, mockServerConfig, mockHCaptchaService);

    // Mock request
    mockRequest = new Request('https://example.com', {
      method: 'POST',
      body: JSON.stringify({ 'h-captcha-response': 'mock-response' }),
    });

    // Mock getClientIpAddress function
    vi.mocked(getClientIpAddress).mockReturnValue('192.168.1.1');
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should validate the hCaptcha response successfully if the score is below the threshold', async () => {
    // Mock hCaptcha service response
    mockHCaptchaService.verifyHCaptchaResponse.mockResolvedValue({ success: true, score: 0.5 });

    await expect(validator.validateHCaptchaResponse(mockRequest, userId)).resolves.toBeUndefined();
    expect(mockLogFactory.createLogger).toHaveBeenCalledWith('DefaultHCaptchaValidator');
    expect(mockHCaptchaService.verifyHCaptchaResponse).toHaveBeenCalledWith({
      hCaptchaResponse: 'mock-response',
      ipAddress: '192.168.1.1',
      userId,
    });
  });

  it('should throw HCaptchaResponseNotFoundException if hCaptcha response is not found in the request', async () => {
    // Mock request with no hCaptcha response
    mockRequest = new Request('https://example.com', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    await expect(validator.validateHCaptchaResponse(mockRequest, userId)).rejects.toThrow(new HCaptchaResponseNotFoundException('hCaptcha response not found in request.'));
  });

  it('should throw HCaptchaInvalidException if hCaptcha score exceeds the threshold', async () => {
    // Mock hCaptcha service response with high score
    mockHCaptchaService.verifyHCaptchaResponse.mockResolvedValue({ success: true, score: 1.0 });

    await expect(validator.validateHCaptchaResponse(mockRequest, userId)).rejects.toThrow(new HCaptchaInvalidException('hCaptcha response validation failed; hCaptcha score exceeds threshold.'));
  });

  it('should extract hCaptcha response from FormData and validate it successfully', async () => {
    // Create FormData with h-captcha-response
    const formData = new FormData();
    formData.append('h-captcha-response', 'mock-response');

    // Create a mock request with FormData as the body
    mockRequest = new Request('https://example.com', {
      method: 'POST',
      body: formData,
    });

    // Mock hCaptcha service response
    mockHCaptchaService.verifyHCaptchaResponse.mockResolvedValue({ success: true, score: 0.5 });

    await expect(validator.validateHCaptchaResponse(mockRequest, userId)).resolves.toBeUndefined();
    expect(mockLogFactory.createLogger).toHaveBeenCalledWith('DefaultHCaptchaValidator');
    expect(mockHCaptchaService.verifyHCaptchaResponse).toHaveBeenCalledWith({
      hCaptchaResponse: 'mock-response',
      ipAddress: '192.168.1.1',
      userId,
    });
  });
});
