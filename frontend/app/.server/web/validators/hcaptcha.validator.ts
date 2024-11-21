import { inject, injectable } from 'inversify';

import { HCaptchaVerifyRequestDto } from '../dtos';
import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { LogFactory, Logger } from '~/.server/factories';
import { HCaptchaInvalidException, HCaptchaResponseNotFoundException } from '~/.server/web/exceptions';
import type { HCaptchaService } from '~/.server/web/services';
import { getClientIpAddress } from '~/utils/ip-address-utils.server';

/**
 * Interface for validating hCaptcha responses.
 */
export interface HCaptchaValidator {
  /**
   * Validates the hCaptcha response from the provided HTTP request.
   *
   * @param request - The HTTP request containing the hCaptcha response to validate.
   * @param userId - (Optional) The ID of the user attempting the request. Defaults to 'anonymous'.
   * @throws {HCaptchaInvalidException} If the hCaptcha response is invalid or the validation fails.
   */
  validateHCaptchaResponse(request: Request, userId?: string): Promise<void>;
}

/**
 * Default implementation of the HCaptchaValidator interface.
 * Performs hCaptcha validation by interacting with the hCaptcha service.
 */
@injectable()
export class DefaultHCaptchaValidator implements HCaptchaValidator {
  private readonly log: Logger;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.configs.ServerConfig) private readonly serverConfig: Pick<ServerConfig, 'HCAPTCHA_MAX_SCORE'>,
    @inject(TYPES.web.services.HCaptchaService) private readonly hCaptchaService: HCaptchaService,
  ) {
    this.log = logFactory.createLogger('DefaultHCaptchaValidator');
  }

  /**
   * Validates the hCaptcha response from the provided HTTP request.
   *
   * @param request - The HTTP request containing the hCaptcha response.
   * @param userId - The user ID associated with the request. Defaults to 'anonymous'.
   * @throws {HCaptchaInvalidException} If the hCaptcha response is invalid, missing, or exceeds the max score.
   */
  async validateHCaptchaResponse(request: Request, userId: string = 'anonymous'): Promise<void> {
    this.log.debug('Starting hCaptcha response validation for user: %s, IP: %s', userId, getClientIpAddress(request));

    const ipAddress = getClientIpAddress(request);
    const hCaptchaResponse = await this.extractHCaptchaResponse(request);

    if (!hCaptchaResponse) {
      this.log.warn('hCaptcha response not found in request from user: %s', userId);
      throw new HCaptchaResponseNotFoundException('hCaptcha response not found in request.');
    }

    const hCaptchaVerifyRequestDto: HCaptchaVerifyRequestDto = {
      hCaptchaResponse,
      ipAddress: ipAddress ?? undefined,
      userId,
    };

    const { score } = await this.hCaptchaService.verifyHCaptchaResponse(hCaptchaVerifyRequestDto);
    this.log.trace('hCaptcha verification score for user %s: %s', userId, score);

    if (score && score > this.serverConfig.HCAPTCHA_MAX_SCORE) {
      this.log.warn('hCaptcha score exceeds max threshold for user: %s, score: %s', userId, score);
      throw new HCaptchaInvalidException('hCaptcha response validation failed; hCaptcha score exceeds threshold.');
    }

    this.log.debug('hCaptcha response validated successfully for user: %s', userId);
  }

  /**
   * Extracts the hCaptcha response from the provided HTTP request.
   *
   * @param request - The HTTP request to extract the hCaptcha response from.
   * @returns The hCaptcha response as a string, or `null` if not found.
   */
  private async extractHCaptchaResponse(request: Request): Promise<string | null> {
    const hCaptchaFieldName = 'h-captcha-response';

    // Try to extract the hCaptcha response from form data
    try {
      this.log.debug('Extracting hCaptcha response from form data.');
      const formData = await request.clone().formData();

      if (formData.has(hCaptchaFieldName)) {
        this.log.debug('hCaptcha response found in form data.');
        return String(formData.get(hCaptchaFieldName));
      }

      this.log.debug('hCaptcha response not found in form data.');
      return null;
    } catch (error) {
      this.log.debug('Error extracting hCaptcha response from form data; error: %s', error);
    }

    // If not found in form data, try extracting from the JSON body
    try {
      this.log.debug('Extracting hCaptcha response from JSON body.');
      const body = await request.clone().json();

      if (body[hCaptchaFieldName]) {
        this.log.debug('hCaptcha response found in JSON body.');
        return String(body[hCaptchaFieldName]);
      }

      this.log.debug('hCaptcha response not found in JSON body.');
      return null;
    } catch (error) {
      this.log.debug('Error extracting hCaptcha response from JSON body; error: %s', error);
    }

    // Return null if the hCaptcha response was not found
    this.log.warn('hCaptcha response not found in request.');
    return null;
  }
}
