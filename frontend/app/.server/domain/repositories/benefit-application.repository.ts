import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { BenefitApplicationRequestEntity, BenefitApplicationResponseEntity } from '~/.server/domain/entities';
import type { LogFactory, Logger } from '~/.server/factories';
import type { HttpClient } from '~/.server/http';

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

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.configs.ServerConfig)
    private readonly serverConfig: Pick<ServerConfig, 'HTTP_PROXY_URL' | 'INTEROP_API_BASE_URI' | 'INTEROP_API_SUBSCRIPTION_KEY' | 'INTEROP_BENEFIT_APPLICATION_API_BASE_URI' | 'INTEROP_BENEFIT_APPLICATION_API_SUBSCRIPTION_KEY'>,
    @inject(TYPES.http.HttpClient) private readonly httpClient: HttpClient,
  ) {
    this.log = logFactory.createLogger('DefaultBenefitApplicationRepository');
  }

  async createBenefitApplication(benefitApplicationRequestEntity: BenefitApplicationRequestEntity): Promise<BenefitApplicationResponseEntity> {
    this.log.trace('Creating benefit application for request [%j]', benefitApplicationRequestEntity);

    const url = `${this.serverConfig.INTEROP_BENEFIT_APPLICATION_API_BASE_URI ?? this.serverConfig.INTEROP_API_BASE_URI}/dental-care/applicant-information/dts/v1/benefit-application`;
    const response = await this.httpClient.instrumentedFetch('http.client.interop-api.benefit-application.posts', url, {
      proxyUrl: this.serverConfig.HTTP_PROXY_URL,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': this.serverConfig.INTEROP_BENEFIT_APPLICATION_API_SUBSCRIPTION_KEY ?? this.serverConfig.INTEROP_API_SUBSCRIPTION_KEY,
      },
      body: JSON.stringify(benefitApplicationRequestEntity),
    });

    if (!response.ok) {
      this.log.error('%j', {
        message: `Failed to 'POST' for benefit application`,
        status: response.status,
        statusText: response.statusText,
        url: url,
        responseBody: await response.text(),
      });
      throw new Error(`Failed to 'POST' for benefit application. Status: ${response.status}, Status Text: ${response.statusText}`);
    }

    const benefitApplicationResponseEntity: BenefitApplicationResponseEntity = await response.json();
    this.log.trace('Returning benefit application response [%j]', benefitApplicationResponseEntity);
    return benefitApplicationResponseEntity;
  }
}

@injectable()
export class MockBenefitApplicationRepository implements BenefitApplicationRepository {
  private readonly log: Logger;

  constructor(@inject(TYPES.factories.LogFactory) logFactory: LogFactory) {
    this.log = logFactory.createLogger('MockBenefitApplicationRepository');
  }

  createBenefitApplication(benefitApplicationRequestEntity: BenefitApplicationRequestEntity): Promise<BenefitApplicationResponseEntity> {
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
    return Promise.resolve(benefitApplicationResponseEntity);
  }
}
