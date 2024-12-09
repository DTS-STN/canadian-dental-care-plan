import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { ApplicationYearRequestEntity, ApplicationYearResultEntity } from '~/.server/domain/entities';
import type { LogFactory, Logger } from '~/.server/factories';
import type { HttpClient } from '~/.server/http';

export interface ApplicationYearRepository {
  /**
   * Returns possible application years given the current date in 'applicationYearRequestEntity'.
   *
   * @param applicationYearRequestEntity The request entity object containing the current date.
   * @returns A promise that resolves to a `ApplicationYearResultEntity` object containing the possible application years.
   */
  listApplicationYears(applicationYearRequestEntity: ApplicationYearRequestEntity): Promise<ApplicationYearResultEntity>;
}

@injectable()
export class DefaultApplicationYearRepository implements ApplicationYearRepository {
  private readonly log: Logger;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.configs.ServerConfig) private readonly serverConfig: Pick<ServerConfig, 'HTTP_PROXY_URL' | 'INTEROP_API_BASE_URI' | 'INTEROP_API_SUBSCRIPTION_KEY'>,
    @inject(TYPES.http.HttpClient) private readonly httpClient: HttpClient,
  ) {
    this.log = logFactory.createLogger('DefaultApplicationYearRepository');
  }

  async listApplicationYears(applicationYearRequestEntity: ApplicationYearRequestEntity): Promise<ApplicationYearResultEntity> {
    this.log.trace('Getting possible application year dates given applicationYearRequest: [%j]', applicationYearRequestEntity);

    const url = new URL(`${this.serverConfig.INTEROP_API_BASE_URI}/dental-care/dts/v1/application-years`);
    url.searchParams.set('currentDate', applicationYearRequestEntity.currentDate);

    const response = await this.httpClient.instrumentedFetch('http.client.interop-api.application-year.gets', url, {
      proxyUrl: this.serverConfig.HTTP_PROXY_URL,
      method: 'GET',
      headers: {
        'Accept-Language': 'en-CA',
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': this.serverConfig.INTEROP_API_SUBSCRIPTION_KEY,
      },
    });

    if (!response.ok) {
      this.log.error('%j', {
        message: 'Failed to fetch application year(s)',
        status: response.status,
        statusText: response.statusText,
        url: url,
        responseBody: await response.text(),
      });
      throw new Error(`Failed to fetch application year(s). Status: ${response.status}, Status Text: ${response.statusText}`);
    }

    const applicationYearResults: ApplicationYearResultEntity = await response.json();
    this.log.trace('Application year response: [%j]', applicationYearResults);

    return applicationYearResults;
  }
}

@injectable()
export class MockApplicationYearRepository implements ApplicationYearRepository {
  private readonly log: Logger;

  constructor(@inject(TYPES.factories.LogFactory) logFactory: LogFactory) {
    this.log = logFactory.createLogger('MockApplicationYearRepository');
  }

  listApplicationYears(applicationYearRequestEntity: ApplicationYearRequestEntity): Promise<ApplicationYearResultEntity> {
    this.log.debug('Fetching all application years for request [%j]', applicationYearRequestEntity);

    const applicationYearResponseEntity: ApplicationYearResultEntity = {
      ApplicationYearCollection: [
        {
          TaxYear: '2020',
          ApplicationYearID: 'AYR004',
        },
        {
          TaxYear: undefined,
          ApplicationYearID: 'AYR005',
        },
        {
          TaxYear: '2019',
          ApplicationYearID: undefined,
        },
      ],
    };

    this.log.debug('Application years: [%j]', applicationYearResponseEntity);

    return Promise.resolve(applicationYearResponseEntity);
  }
}
