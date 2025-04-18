import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { ApplicationYearResultEntity } from '~/.server/domain/entities';
import type { HttpClient } from '~/.server/http';
import type { Logger } from '~/.server/logging';
import { createLogger } from '~/.server/logging';
import { HttpStatusCodes } from '~/constants/http-status-codes';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

export interface ApplicationYearRepository {
  /**
   * Returns all application year entities given a date
   *
   * @param applicationYearRequestEntity The request entity object containing the current date.
   * @returns A promise that resolves to a `ApplicationYearResultEntity` object containing all application years.
   */
  listApplicationYears(date: string): Promise<ApplicationYearResultEntity>;
}

@injectable()
export class DefaultApplicationYearRepository implements ApplicationYearRepository {
  private readonly log: Logger;
  private readonly serverConfig: Pick<ServerConfig, 'HTTP_PROXY_URL' | 'INTEROP_API_BASE_URI' | 'INTEROP_API_SUBSCRIPTION_KEY'>;
  private readonly httpClient: HttpClient;

  constructor(@inject(TYPES.configs.ServerConfig) serverConfig: Pick<ServerConfig, 'HTTP_PROXY_URL' | 'INTEROP_API_BASE_URI' | 'INTEROP_API_SUBSCRIPTION_KEY'>, @inject(TYPES.http.HttpClient) httpClient: HttpClient) {
    this.log = createLogger('DefaultApplicationYearRepository');
    this.serverConfig = serverConfig;
    this.httpClient = httpClient;
  }

  async listApplicationYears(date: string): Promise<ApplicationYearResultEntity> {
    this.log.trace('Fetching all application year entities for date: [%s]', date);

    const url = new URL(`${this.serverConfig.INTEROP_API_BASE_URI}/dental-care/applicant-information/dts/v1/retrieve-benefit-application-config-dates`);
    url.searchParams.set('date', date);

    const response = await this.httpClient.instrumentedFetch('http.client.interop-api.retrieve-benefit-application-config-dates.gets', url, {
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

      if (response.status === HttpStatusCodes.TOO_MANY_REQUESTS) {
        // TODO ::: GjB ::: this throw is to facilitate enabling the application kill switch -- it should be removed once the killswitch functionality is removed
        throw new AppError('Failed to GET /retrieve-benefit-application-config-dates. Status: 429, Status Text: Too Many Requests', ErrorCodes.XAPI_TOO_MANY_REQUESTS);
      }

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

  constructor() {
    this.log = createLogger('MockApplicationYearRepository');
  }

  async listApplicationYears(date: string): Promise<ApplicationYearResultEntity> {
    this.log.debug('Fetching all application year entities for date: [%s]', date);

    const applicationYearResponseEntity: ApplicationYearResultEntity = {
      BenefitApplicationYear: [
        {
          BenefitApplicationYearIdentification: [
            {
              IdentificationID: '98f8ad43-4069-ee11-9ae7-000d3a09d1b8',
            },
          ],
          BenefitApplicationYearEffectivePeriod: {
            StartDate: {
              YearDate: '2024',
            },
          },
          BenefitApplicationYearTaxYear: {
            YearDate: '2023',
          },
          BenefitApplicationYearIntakePeriod: {
            StartDate: {
              date: '2024-05-01',
            },
            EndDate: {
              date: '2025-04-30',
            },
          },
          BenefitApplicationYearRenewalPeriod: {},
          BenefitApplicationYearNext: {
            BenefitApplicationYearIdentification: {
              IdentificationID: '9bb21bc9-028c-ef11-8a69-000d3a0a1a29',
            },
          },
          BenefitApplicationYearCoveragePeriod: {
            StartDate: {
              date: '2024-05-01',
            },
            EndDate: {
              date: '2025-06-30',
            },
          },
        },
        {
          BenefitApplicationYearIdentification: [
            {
              IdentificationID: '9bb21bc9-028c-ef11-8a69-000d3a0a1a29',
            },
          ],
          BenefitApplicationYearEffectivePeriod: {
            StartDate: {
              YearDate: '2025',
            },
          },
          BenefitApplicationYearTaxYear: {
            YearDate: '2024',
          },
          BenefitApplicationYearIntakePeriod: {
            StartDate: {
              date: '2025-05-01',
            },
          },
          BenefitApplicationYearRenewalPeriod: {
            StartDate: {
              date: '2024-12-01',
            },
          },
          BenefitApplicationYearNext: {
            BenefitApplicationYearIdentification: {},
          },
          BenefitApplicationYearCoveragePeriod: {
            StartDate: {
              date: '2025-06-01',
            },
            EndDate: {
              date: '2026-06-30',
            },
          },
        },
      ],
    };

    this.log.debug('Application years: [%j]', applicationYearResponseEntity);

    return await Promise.resolve(applicationYearResponseEntity);
  }
}
