import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { EmailNotificationRequestEntity, EmailNotificationResponseEntity } from '~/.server/domain/entities';
import type { LogFactory, Logger } from '~/.server/factories';
import type { HttpClient } from '~/.server/http';

export interface NotificationRepository {
  /**
   * Sends a verification code email to the specified recipient.
   *
   * @param emailNotificationRequestEntity The request entity containing email notification details.
   * @returns A promise resolving to an `EmailNotificationResponseEntity` containing the result of the operation.
   */
  sendVerificationCodeEmail(emailNotificationRequestEntity: EmailNotificationRequestEntity): Promise<EmailNotificationResponseEntity>;
}

@injectable()
export class DefaultNotificationRepository implements NotificationRepository {
  private readonly log: Logger;
  private readonly serverConfig: Pick<ServerConfig, 'GC_NOTIFY_API_KEY' | 'GC_NOTIFY_EMAIL_NOTIFICATIONS_URL'>;
  private readonly httpClient: HttpClient;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.configs.ServerConfig) serverConfig: Pick<ServerConfig, 'GC_NOTIFY_API_KEY' | 'GC_NOTIFY_EMAIL_NOTIFICATIONS_URL'>,
    @inject(TYPES.http.HttpClient) httpClient: HttpClient,
  ) {
    this.log = logFactory.createLogger('DefaultNotificationRepository');
    this.serverConfig = serverConfig;
    this.httpClient = httpClient;
  }

  async sendVerificationCodeEmail(emailNotificationRequestEntity: EmailNotificationRequestEntity): Promise<EmailNotificationResponseEntity> {
    this.log.trace('Sending verification code email for request: [%j]', emailNotificationRequestEntity);

    const url = this.serverConfig.GC_NOTIFY_EMAIL_NOTIFICATIONS_URL;
    const response = await this.httpClient.instrumentedFetch('http.client.gc-notify.email-notification.posts', url, {
      method: 'POST',
      headers: {
        Authorization: `ApiKey-v1 ${this.serverConfig.GC_NOTIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailNotificationRequestEntity),
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

    const emailNotificationResponseEntity: EmailNotificationResponseEntity = await response.json();
    this.log.trace('Returning verification code email response [%j]', emailNotificationResponseEntity);
    return emailNotificationResponseEntity;
  }
}
