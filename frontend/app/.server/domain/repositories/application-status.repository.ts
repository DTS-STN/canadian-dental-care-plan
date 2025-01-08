import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { ApplicationStatusBasicInfoRequestEntity, ApplicationStatusEntity, ApplicationStatusSinRequestEntity } from '~/.server/domain/entities';
import type { LogFactory, Logger } from '~/.server/factories';
import type { HttpClient } from '~/.server/http';
import clientFriendlyStatusDataSource from '~/.server/resources/power-platform/client-friendly-status.json';

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

  /**
   * Retrieves metadata associated with the application status repository.
   *
   * @returns A record where the keys and values are strings representing metadata information.
   */
  getMetadata(): Record<string, string>;

  /**
   * Performs a health check to ensure that the application status repository is operational.
   *
   * @throws An error if the health check fails or the repository is unavailable.
   * @returns A promise that resolves when the health check completes successfully.
   */
  checkHealth(): Promise<void>;
}

@injectable()
export class DefaultApplicationStatusRepository implements ApplicationStatusRepository {
  private readonly log: Logger;
  private readonly baseUrl: string;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.configs.ServerConfig)
    private readonly serverConfig: Pick<ServerConfig, 'HEALTH_PLACEHOLDER_REQUEST_VALUE' | 'HTTP_PROXY_URL' | 'INTEROP_API_BASE_URI' | 'INTEROP_API_SUBSCRIPTION_KEY' | 'INTEROP_STATUS_CHECK_API_BASE_URI' | 'INTEROP_STATUS_CHECK_API_SUBSCRIPTION_KEY'>,
    @inject(TYPES.http.HttpClient) private readonly httpClient: HttpClient,
  ) {
    this.log = logFactory.createLogger('DefaultApplicationStatusRepository');
    this.baseUrl = `${this.serverConfig.INTEROP_STATUS_CHECK_API_BASE_URI ?? this.serverConfig.INTEROP_API_BASE_URI}/dental-care/status-check/v1`;
  }

  async getApplicationStatusByBasicInfo(applicationStatusBasicInfoRequestEntity: ApplicationStatusBasicInfoRequestEntity): Promise<ApplicationStatusEntity> {
    this.log.trace('Fetching application status for basic info [%j]', applicationStatusBasicInfoRequestEntity);

    const url = `${this.baseUrl}/status_fnlndob`;
    const response = await this.httpClient.instrumentedFetch('http.client.interop-api.status-fnlndob.posts', url, {
      proxyUrl: this.serverConfig.HTTP_PROXY_URL,
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

    const url = `${this.baseUrl}/status`;
    const response = await this.httpClient.instrumentedFetch('http.client.interop-api.status.posts', url, {
      proxyUrl: this.serverConfig.HTTP_PROXY_URL,
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

  getMetadata(): Record<string, string> {
    return {
      baseUrl: this.baseUrl,
    };
  }

  async checkHealth(): Promise<void> {
    await this.getApplicationStatusBySin({
      BenefitApplication: {
        Applicant: {
          ClientIdentification: [
            {
              IdentificationID: this.serverConfig.HEALTH_PLACEHOLDER_REQUEST_VALUE,
            },
          ],
          PersonSINIdentification: {
            IdentificationID: this.serverConfig.HEALTH_PLACEHOLDER_REQUEST_VALUE,
          },
        },
      },
    });
  }
}

@injectable()
export class MockApplicationStatusRepository implements ApplicationStatusRepository {
  /**
   * Mock mapping for application codes to application status codes
   * which can then be used to render on the frontend
   *
   * Example mapping:
   *  {
   *    '000001': '873ac4c6-77c0-ee11-9079-000d3a09d132',
   *    '000002': 'f752c665-c4e6-ee11-a204-000d3a09d1b8',
   *    '000003': 'e882086c-c4e6-ee11-a204-000d3a09d1b8',
   *  }
   */
  private readonly MOCK_APPLICATION_CODES_TO_STATUS_CODES_MAP: Record<string, string> = clientFriendlyStatusDataSource.value.reduce(
    (acc, { esdc_clientfriendlystatusid }, i) => ({ ...acc, [(i + 1).toString().padStart(6, '0')]: esdc_clientfriendlystatusid }),
    {},
  );

  private readonly log: Logger;

  constructor(@inject(TYPES.factories.LogFactory) logFactory: LogFactory) {
    this.log = logFactory.createLogger('MockApplicationStatusRepository');
  }

  async getApplicationStatusByBasicInfo(applicationStatusBasicInfoRequestEntity: ApplicationStatusBasicInfoRequestEntity): Promise<ApplicationStatusEntity> {
    this.log.debug('Fetching application status for basic info [%j]', applicationStatusBasicInfoRequestEntity);

    const statusCode = this.MOCK_APPLICATION_CODES_TO_STATUS_CODES_MAP[applicationStatusBasicInfoRequestEntity.BenefitApplication.Applicant.ClientIdentification[0].IdentificationID];

    const applicationStatusEntity: ApplicationStatusEntity = {
      BenefitApplication: {
        BenefitApplicationStatus: [
          {
            ReferenceDataID: statusCode || 'c23252fe-604e-ee11-be6f-000d3a09d640',
            ReferenceDataName: 'Dental Status Code',
          },
        ],
      },
    };

    this.log.debug('Returning application status [%j]', applicationStatusEntity);
    return await Promise.resolve(applicationStatusEntity);
  }

  async getApplicationStatusBySin(applicationStatusSinRequestEntity: ApplicationStatusSinRequestEntity): Promise<ApplicationStatusEntity> {
    this.log.debug('Fetching application status for sin [%j]', applicationStatusSinRequestEntity);

    const statusCode = this.MOCK_APPLICATION_CODES_TO_STATUS_CODES_MAP[applicationStatusSinRequestEntity.BenefitApplication.Applicant.ClientIdentification[0].IdentificationID];

    const applicationStatusEntity: ApplicationStatusEntity = {
      BenefitApplication: {
        BenefitApplicationStatus: [
          {
            ReferenceDataID: statusCode || 'c23252fe-604e-ee11-be6f-000d3a09d640',
            ReferenceDataName: 'Dental Status Code',
          },
        ],
      },
    };

    this.log.debug('Returning application status [%j]', applicationStatusEntity);
    return await Promise.resolve(applicationStatusEntity);
  }

  getMetadata(): Record<string, string> {
    return {
      mockEnabled: 'true',
    };
  }

  async checkHealth(): Promise<void> {
    return await Promise.resolve();
  }
}
