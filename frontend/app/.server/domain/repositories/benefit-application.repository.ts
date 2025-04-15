import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { BenefitApplicationRequestEntity, BenefitApplicationResponseEntity } from '~/.server/domain/entities';
import type { HttpClient } from '~/.server/http';
import type { Logger } from '~/.server/logging';
import { createLogger } from '~/.server/logging';
import { createInteropClient } from '~/.server/shared/api/interop-client';
import type { InteropClient } from '~/.server/shared/api/interop-client';
import { HttpStatusCodes } from '~/constants/http-status-codes';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

export interface BenefitApplicationRepository {
  /**
   * Submits a benefit application request.
   *
   * @param benefitApplicationRequestEntity The benefit application request entity.
   * @returns A Promise that resolves to the benefit application response entity.
   */
  createBenefitApplication(benefitApplicationRequestEntity: BenefitApplicationRequestEntity): Promise<BenefitApplicationResponseEntity>;
}

@injectable()
export class DefaultBenefitApplicationRepository implements BenefitApplicationRepository {
  private readonly log: Logger;
  private readonly serverConfig: Pick<ServerConfig, 'HTTP_PROXY_URL' | 'INTEROP_API_BASE_URI' | 'INTEROP_API_SUBSCRIPTION_KEY' | 'INTEROP_BENEFIT_APPLICATION_API_BASE_URI' | 'INTEROP_BENEFIT_APPLICATION_API_SUBSCRIPTION_KEY'>;
  private readonly httpClient: HttpClient;
  private readonly interopClient: InteropClient;

  constructor(
    @inject(TYPES.configs.ServerConfig)
    serverConfig: Pick<ServerConfig, 'HTTP_PROXY_URL' | 'INTEROP_API_BASE_URI' | 'INTEROP_API_SUBSCRIPTION_KEY' | 'INTEROP_BENEFIT_APPLICATION_API_BASE_URI' | 'INTEROP_BENEFIT_APPLICATION_API_SUBSCRIPTION_KEY'>,
    @inject(TYPES.http.HttpClient) httpClient: HttpClient,
  ) {
    this.log = createLogger('DefaultBenefitApplicationRepository');
    this.serverConfig = serverConfig;
    this.httpClient = httpClient;

    this.interopClient = createInteropClient({
      baseUrl: `${this.serverConfig.INTEROP_BENEFIT_APPLICATION_API_BASE_URI ?? this.serverConfig.INTEROP_API_BASE_URI}/dental-care/applicant-information/dts/v1/`,
    });
  }

  async createBenefitApplication(benefitApplicationRequestEntity: BenefitApplicationRequestEntity): Promise<BenefitApplicationResponseEntity> {
    this.log.trace('Creating benefit application for request [%j]', benefitApplicationRequestEntity);

    const { response, data, error } = await this.interopClient.POST('/benefit-application', {
      meta: {
        metricPrefix: 'http.client.interop-api.benefit-application.posts',
      },
      params: {
        header: {
          'Ocp-Apim-Subscription-Key': this.serverConfig.INTEROP_BENEFIT_APPLICATION_API_SUBSCRIPTION_KEY ?? this.serverConfig.INTEROP_API_SUBSCRIPTION_KEY,
        },
      },
      body: benefitApplicationRequestEntity,
    });

    if (error) {
      this.log.error('%j', {
        message: `Failed to 'POST' for benefit application`,
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        responseBody: error,
      });

      if (response.status === HttpStatusCodes.TOO_MANY_REQUESTS) {
        // TODO ::: GjB ::: this throw is to facilitate enabling the application kill switch -- it should be removed once the killswitch functionality is removed
        throw new AppError('Failed to POST to /benefit-application. Status: 429, Status Text: Too Many Requests', ErrorCodes.XAPI_TOO_MANY_REQUESTS);
      }

      throw new Error(`Failed to 'POST' for benefit application. Status: ${response.status}, Status Text: ${response.statusText}`);
    }

    this.log.trace('Returning benefit application response [%j]', data);
    return data;
  }
}

@injectable()
export class MockBenefitApplicationRepository implements BenefitApplicationRepository {
  private readonly log: Logger;

  constructor() {
    this.log = createLogger('MockBenefitApplicationRepository');
  }

  async createBenefitApplication(benefitApplicationRequestEntity: BenefitApplicationRequestEntity): Promise<BenefitApplicationResponseEntity> {
    this.log.debug('Creating benefit application for request [%j]', benefitApplicationRequestEntity);

    const benefitApplicationResponseEntity: BenefitApplicationResponseEntity = {
      BenefitApplication: {
        BenefitApplicationIdentification: [
          {
            IdentificationID: '2476124092174',
            IdentificationCategoryText: 'Confirmation Number',
          },
        ],
      },
    };

    this.log.debug('Returning benefit application response [%j]', benefitApplicationResponseEntity);
    return await Promise.resolve(benefitApplicationResponseEntity);
  }
}
