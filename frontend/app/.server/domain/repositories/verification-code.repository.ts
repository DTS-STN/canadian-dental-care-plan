import { randomUUID } from 'crypto';
import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { VerificationCodeEmailRequestEntity, VerificationCodeEmailResponseEntity } from '~/.server/domain/entities';
import type { LogFactory, Logger } from '~/.server/factories';
import type { HttpClient } from '~/.server/http';

export interface VerificationCodeRepository {
  /**
   * Sends a verification code email to the specified recipient.
   *
   * @param verificationCodeEmailRequestEntity The request entity containing verification code email request details.
   * @returns A promise resolving to an `VerificationCodeEmailResponseEntity` containing the result of the operation.
   */
  sendVerificationCodeEmail(verificationCodeEmailRequestEntity: VerificationCodeEmailRequestEntity): Promise<VerificationCodeEmailResponseEntity>;
}

@injectable()
export class DefaultVerificationCodeRepository implements VerificationCodeRepository {
  private readonly log: Logger;
  private readonly serverConfig: Pick<ServerConfig, 'GC_NOTIFY_API_KEY' | 'HTTP_PROXY_URL' | 'INTEROP_API_BASE_URI' | 'INTEROP_API_SUBSCRIPTION_KEY'>;
  private readonly httpClient: HttpClient;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.configs.ServerConfig) serverConfig: Pick<ServerConfig, 'GC_NOTIFY_API_KEY' | 'HTTP_PROXY_URL' | 'INTEROP_API_BASE_URI' | 'INTEROP_API_SUBSCRIPTION_KEY'>,
    @inject(TYPES.http.HttpClient) httpClient: HttpClient,
  ) {
    this.log = logFactory.createLogger('DefaultVerificationCodeRepository');
    this.serverConfig = serverConfig;
    this.httpClient = httpClient;
  }

  async sendVerificationCodeEmail(verificationCodeEmailRequestEntity: VerificationCodeEmailRequestEntity): Promise<VerificationCodeEmailResponseEntity> {
    this.log.trace('Sending verification code email for request: [%j]', verificationCodeEmailRequestEntity);

    const url = `${this.serverConfig.INTEROP_API_BASE_URI}/notifications/email-txt-notifications/v1/notifications/email`;
    const response = await this.httpClient.instrumentedFetch('http.client.interop-api.email-notifications.posts', url, {
      proxyUrl: this.serverConfig.HTTP_PROXY_URL,
      method: 'POST',
      headers: {
        Authorization: `ApiKey-v1 ${this.serverConfig.GC_NOTIFY_API_KEY}`,
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': this.serverConfig.INTEROP_API_SUBSCRIPTION_KEY,
      },
      body: JSON.stringify(verificationCodeEmailRequestEntity),
    });

    if (!response.ok) {
      this.log.error('%j', {
        message: `Failed to 'POST' email notification`,
        status: response.status,
        statusText: response.statusText,
        url,
        responseBody: await response.text(),
      });
      throw new Error(`Failed to 'POST' email notification. Status: ${response.status}, Status Text: ${response.statusText}`);
    }

    const verificationCodeEmailResponseEntity: VerificationCodeEmailResponseEntity = await response.json();
    this.log.trace('Returning verification code email response [%j]', verificationCodeEmailResponseEntity);
    return verificationCodeEmailResponseEntity;
  }
}

@injectable()
export class MockVerificationCodeRepository implements VerificationCodeRepository {
  private readonly log: Logger;

  constructor(@inject(TYPES.factories.LogFactory) logFactory: LogFactory) {
    this.log = logFactory.createLogger('MockVerificationCodeRepository');
  }

  async sendVerificationCodeEmail(verificationCodeEmailRequestEntity: VerificationCodeEmailRequestEntity): Promise<VerificationCodeEmailResponseEntity> {
    this.log.trace('Sending verification code email for request: [%j]', verificationCodeEmailRequestEntity);

    const id = randomUUID();
    const verificationCodeEmailResponseEntity: VerificationCodeEmailResponseEntity = {
      id,
      content: {
        subject: 'Email address verification',
        body: `Your verification code is: ${verificationCodeEmailRequestEntity.personalisation.EmailVerificationCode}`,
        from_email: 'test@example.com',
      },
      uri: `https://api.example.com/v1/notifications/${id}`,
      template: {
        id: verificationCodeEmailRequestEntity.template_id,
        version: 1,
        uri: `https://api.example.com/v1/templates/${verificationCodeEmailRequestEntity.template_id}`,
      },
    };

    this.log.trace('Returning verification code email response [%j]', verificationCodeEmailResponseEntity);
    return await Promise.resolve(verificationCodeEmailResponseEntity);
  }
}
