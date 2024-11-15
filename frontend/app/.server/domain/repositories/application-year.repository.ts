import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { ApplicationYearRequestEntity, ApplicationYearResultEntity } from '~/.server/domain/entities';
import type { LogFactory, Logger } from '~/.server/factories';
import { getFetchFn, instrumentedFetch } from '~/utils/fetch-utils.server';

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
export class ApplicationYearRepositoryImpl implements ApplicationYearRepository {
  private readonly log: Logger;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.configs.ServerConfig) private readonly serverConfig: Pick<ServerConfig, 'HTTP_PROXY_URL' | 'INTEROP_API_BASE_URI' | 'INTEROP_API_SUBSCRIPTION_KEY'>,
  ) {
    this.log = logFactory.createLogger('ApplicationYearRepositoryImpl');
  }

  async listApplicationYears(applicationYearRequestEntity: ApplicationYearRequestEntity): Promise<ApplicationYearResultEntity> {
    this.log.trace('Getting possible application year dates given applicationYearRequest: [%j]', applicationYearRequestEntity);

    const url = new URL(`${this.serverConfig.INTEROP_API_BASE_URI}/dental-care/dts/v1/application-years`);
    url.searchParams.set('currentDate', applicationYearRequestEntity.date);

    const response = await instrumentedFetch(getFetchFn(this.serverConfig.HTTP_PROXY_URL), 'http.client.interop-api.application-year.gets', url, {
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
