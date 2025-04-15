import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { BenefitRenewalRequestEntity, BenefitRenewalResponseEntity } from '~/.server/domain/entities';
import type { HttpClient } from '~/.server/http';
import type { Logger } from '~/.server/logging';
import { createLogger } from '~/.server/logging';
import { createInteropClient } from '~/.server/shared/api/interop-client';
import type { InteropClient } from '~/.server/shared/api/interop-client';
import { HttpStatusCodes } from '~/constants/http-status-codes';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

export interface BenefitRenewalRepository {
  /**
   * Submits benefit renewal request.
   *
   * @param benefitRenewalRequest The renewal request stored in session.
   * @returns A Promise that resolves to the renewal response if successful, or `null` otherwise.
   */
  createBenefitRenewal(benefitRenewalRequest: BenefitRenewalRequestEntity): Promise<BenefitRenewalResponseEntity>;
}

@injectable()
export class DefaultBenefitRenewalRepository implements BenefitRenewalRepository {
  private readonly log: Logger;
  private readonly serverConfig: Pick<ServerConfig, 'INTEROP_API_BASE_URI' | 'HTTP_PROXY_URL' | 'INTEROP_API_SUBSCRIPTION_KEY'>;
  private readonly httpClient: HttpClient;
  private readonly interopClient: InteropClient;

  constructor(@inject(TYPES.configs.ServerConfig) serverConfig: Pick<ServerConfig, 'INTEROP_API_BASE_URI' | 'HTTP_PROXY_URL' | 'INTEROP_API_SUBSCRIPTION_KEY'>, @inject(TYPES.http.HttpClient) httpClient: HttpClient) {
    this.log = createLogger('DefaultBenefitRenewalRepository');
    this.serverConfig = serverConfig;
    this.httpClient = httpClient;

    this.interopClient = createInteropClient({
      baseUrl: `${this.serverConfig.INTEROP_API_BASE_URI}/dental-care/applicant-information/dts/v1/`,
    });
  }

  async createBenefitRenewal(benefitRenewalRequest: BenefitRenewalRequestEntity): Promise<BenefitRenewalResponseEntity> {
    this.log.trace('Submiting benefit renewal for request [%j]', benefitRenewalRequest);

    const { response, data, error } = await this.interopClient.POST('/benefit-application', {
      meta: {
        metricPrefix: 'http.client.interop-api.benefit-application-renewal.posts',
      },
      params: {
        header: {
          'Ocp-Apim-Subscription-Key': this.serverConfig.INTEROP_API_SUBSCRIPTION_KEY,
        },
        query: {
          scenario: 'RENEWAL',
        },
      },
      body: benefitRenewalRequest,
    });

    if (error) {
      this.log.error('%j', {
        message: "Failed to 'POST' for benefit renewal data",
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        responseBody: error,
      });

      if (response.status === HttpStatusCodes.TOO_MANY_REQUESTS) {
        // TODO ::: GjB ::: this throw is to facilitate enabling the application kill switch -- it should be removed once the killswitch functionality is removed
        throw new AppError('Failed to POST to /benefit-application. Status: 429, Status Text: Too Many Requests', ErrorCodes.XAPI_TOO_MANY_REQUESTS);
      }

      throw new Error(`Failed to 'POST' for benefit renewal data. Status: ${response.status}, Status Text: ${response.statusText}`);
    }

    this.log.trace('Benefit renewal: [%j]', data);
    return data;
  }
}

@injectable()
export class MockBenefitRenewalRepository implements BenefitRenewalRepository {
  private readonly log: Logger;

  constructor() {
    this.log = createLogger('MockBenefitRenewalRepository');
  }

  async createBenefitRenewal(benefitRenewalRequest: BenefitRenewalRequestEntity): Promise<BenefitRenewalResponseEntity> {
    this.log.debug('Submiting benefit renewal for request [%j]', benefitRenewalRequest);

    const benefitRenewalResponseEntity: BenefitRenewalResponseEntity = {
      BenefitApplication: {
        BenefitApplicationIdentification: [
          {
            IdentificationID: '2476124092174',
            IdentificationCategoryText: 'Confirmation Number',
          },
        ],
      },
    };

    this.log.debug('Benefit renewal: [%j]', benefitRenewalResponseEntity);

    return await Promise.resolve(benefitRenewalResponseEntity);
  }
}
