import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { ApplicationStatusBasicInfoRequestEntity, ApplicationStatusEntity, ApplicationStatusSinRequestEntity } from '~/.server/domain/entities';
import type { LogFactory, Logger } from '~/.server/factories';
import { getFetchFn, instrumentedFetch } from '~/utils/fetch-utils.server';

/**
 * A repository that provides access to application status data.
 */
export interface ApplicationStatusRepository {
  /**
   * Gets the application status of an applicant by basic info.
   *
   * @param applicationStatusBasicInfoRequestEntity The basic info request entity.
   * @returns A Promise that resolves to the application status entity.
   */
  getApplicationStatusByBasicInfo(applicationStatusBasicInfoRequestEntity: ApplicationStatusBasicInfoRequestEntity): Promise<ApplicationStatusEntity>;

  /**
   * Gets the application status of an applicant by SIN.
   *
   * @param applicationStatusSinRequestEntity The SIN request entity.
   * @returns A Promise that resolves to the application status entity.
   */
  getApplicationStatusBySin(applicationStatusSinRequestEntity: ApplicationStatusSinRequestEntity): Promise<ApplicationStatusEntity>;
}

@injectable()
export class ApplicationStatusRepositoryImpl implements ApplicationStatusRepository {
  private readonly log: Logger;

  constructor(
    @inject(TYPES.LOG_FACTORY) logFactory: LogFactory,
    @inject(TYPES.SERVER_CONFIG) private readonly serverConfig: Pick<ServerConfig, 'HTTP_PROXY_URL' | 'INTEROP_API_BASE_URI' | 'INTEROP_API_SUBSCRIPTION_KEY' | 'INTEROP_STATUS_CHECK_API_BASE_URI' | 'INTEROP_STATUS_CHECK_API_SUBSCRIPTION_KEY'>,
  ) {
    this.log = logFactory.createLogger('ApplicationStatusRepositoryImpl');
  }

  async getApplicationStatusByBasicInfo(applicationStatusBasicInfoRequestEntity: ApplicationStatusBasicInfoRequestEntity): Promise<ApplicationStatusEntity> {
    this.log.trace('Fetching application status for basic info [%j]', applicationStatusBasicInfoRequestEntity);

    const url = `${this.serverConfig.INTEROP_STATUS_CHECK_API_BASE_URI ?? this.serverConfig.INTEROP_API_BASE_URI}/dental-care/status-check/v1/status_fnlndob`;
    const response = await instrumentedFetch(getFetchFn(this.serverConfig.HTTP_PROXY_URL), 'http.client.interop-api.status-fnlndob.posts', url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': this.serverConfig.INTEROP_API_SUBSCRIPTION_KEY,
      },
      body: JSON.stringify(applicationStatusBasicInfoRequestEntity),
    });

    if (!response.ok) {
      this.log.error('%j', {
        message: `Failed to 'POST' for application status by basic info`,
        status: response.status,
        statusText: response.statusText,
        url: url,
        responseBody: await response.text(),
      });
      throw new Error(`Failed to 'POST' for application status by basic info. Status: ${response.status}, Status Text: ${response.statusText}`);
    }

    const applicationStatusEntity: ApplicationStatusEntity = await response.json();
    this.log.trace('Returning application status [%j]', applicationStatusEntity);
    return applicationStatusEntity;
  }

  async getApplicationStatusBySin(applicationStatusSinRequestEntity: ApplicationStatusSinRequestEntity): Promise<ApplicationStatusEntity> {
    this.log.trace('Fetching application status for sin [%j]', applicationStatusSinRequestEntity);

    const url = `${this.serverConfig.INTEROP_STATUS_CHECK_API_BASE_URI ?? this.serverConfig.INTEROP_API_BASE_URI}/dental-care/status-check/v1/status`;
    const response = await instrumentedFetch(getFetchFn(this.serverConfig.HTTP_PROXY_URL), 'http.client.interop-api.status.posts', url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': this.serverConfig.INTEROP_API_SUBSCRIPTION_KEY,
      },
      body: JSON.stringify(applicationStatusSinRequestEntity),
    });

    if (!response.ok) {
      this.log.error('%j', {
        message: `Failed to 'POST' for application status by sin`,
        status: response.status,
        statusText: response.statusText,
        url: url,
        responseBody: await response.text(),
      });
      throw new Error(`Failed to 'POST' for application status by sin. Status: ${response.status}, Status Text: ${response.statusText}`);
    }

    const applicationStatusEntity: ApplicationStatusEntity = await response.json();
    this.log.trace('Returning application status [%j]', applicationStatusEntity);
    return applicationStatusEntity;
  }
}
