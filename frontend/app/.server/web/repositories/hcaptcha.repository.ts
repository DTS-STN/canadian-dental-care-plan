import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { LogFactory, Logger } from '~/.server/factories';
import type { HttpClient } from '~/.server/http';
import type { HCaptchaVerifyRequestEntity, HCaptchaVerifyResponseEntity } from '~/.server/web/entities';

export interface HCaptchaRepository {
  /**
   * Verifies a user's hCaptcha response.
   * @see https://docs.hcaptcha.com/#verify-the-user-response-server-side
   *
   * @param hCaptchaVerifyRequestEntity The hCaptcha verify request entity that includes the hCaptcha response token and optional IP address.
   * @returns A Promise that resolves to the hCaptcha verify response entity that includes the success status and score if successful.
   */
  verifyHCaptchaResponse(hCaptchaVerifyRequestEntity: HCaptchaVerifyRequestEntity): Promise<HCaptchaVerifyResponseEntity>;
}

@injectable()
export class DefaultHCaptchaRepository implements HCaptchaRepository {
  private readonly log: Logger;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.configs.ServerConfig) private readonly serverConfig: Pick<ServerConfig, 'HCAPTCHA_SECRET_KEY' | 'HCAPTCHA_VERIFY_URL'>,
    @inject(TYPES.http.HttpClient) private readonly httpClient: HttpClient,
  ) {
    this.log = logFactory.createLogger('DefaultHCaptchaRepository');
  }

  async verifyHCaptchaResponse({ hCaptchaResponse, ipAddress }: HCaptchaVerifyRequestEntity): Promise<HCaptchaVerifyResponseEntity> {
    this.log.trace('Verifying hCaptchaResponse [%s] with ipAddress [%s]', hCaptchaResponse, ipAddress);

    const url = new URL(this.serverConfig.HCAPTCHA_VERIFY_URL);
    url.searchParams.set('response', hCaptchaResponse);
    url.searchParams.set('secret', this.serverConfig.HCAPTCHA_SECRET_KEY);
    if (ipAddress) {
      url.searchParams.set('remoteip', ipAddress);
    }

    const response = await this.httpClient.instrumentedFetch('http.client.hcaptcha.posts', url, { method: 'POST' });

    if (!response.ok) {
      this.log.error('%j', {
        message: 'Failed to verify hCaptcha',
        status: response.status,
        statusText: response.statusText,
        url,
        responseBody: await response.text(),
      });

      throw new Error(`Failed to verify hCaptcha: ${response.status}, Status Text: ${response.statusText}`);
    }

    const hCaptchaVerifyResponseEntity: HCaptchaVerifyResponseEntity = await response.json();

    if (hCaptchaVerifyResponseEntity.success) {
      this.log.trace('hCaptcha verification successful with site verify response: [%j]', hCaptchaVerifyResponseEntity);
    } else {
      this.log.warn('hCaptcha verification unsuccessful with site verify response: [%j]', hCaptchaVerifyResponseEntity);
    }

    return hCaptchaVerifyResponseEntity;
  }
}
