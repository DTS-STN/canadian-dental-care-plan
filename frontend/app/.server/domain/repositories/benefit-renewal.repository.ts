import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { BenefitRenewalRequestEntity, BenefitRenewalResponseEntity } from '~/.server/domain/entities';
import type { LogFactory, Logger } from '~/.server/factories';
import type { HttpClient } from '~/.server/http';

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

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.configs.ServerConfig) serverConfig: Pick<ServerConfig, 'INTEROP_API_BASE_URI' | 'HTTP_PROXY_URL' | 'INTEROP_API_SUBSCRIPTION_KEY'>,
    @inject(TYPES.http.HttpClient) httpClient: HttpClient,
  ) {
    this.log = logFactory.createLogger('DefaultBenefitRenewalRepository');
    this.serverConfig = serverConfig;
    this.httpClient = httpClient;
  }

  async createBenefitRenewal(benefitRenewalRequest: BenefitRenewalRequestEntity): Promise<BenefitRenewalResponseEntity> {
    this.log.trace('Submiting benefit renewal for request [%j]', benefitRenewalRequest);

    const url = new URL(`${this.serverConfig.INTEROP_API_BASE_URI}/dental-care/applicant-information/dts/v1/benefit-application`);
    url.searchParams.set('scenario', 'RENEWAL');

    const response = await this.httpClient.instrumentedFetch('http.client.interop-api.benefit-application-renewal.posts', url, {
      proxyUrl: this.serverConfig.HTTP_PROXY_URL,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': this.serverConfig.INTEROP_API_SUBSCRIPTION_KEY,
      },
      body: JSON.stringify(benefitRenewalRequest),
    });

    if (!response.ok) {
      this.log.error('%j', {
        message: "Failed to 'POST' for benefit renewal data",
        status: response.status,
        statusText: response.statusText,
        url: url,
        responseBody: await response.text(),
      });

      throw new Error(`Failed to 'POST' for benefit renewal data. Status: ${response.status}, Status Text: ${response.statusText}`);
    }

    const data = await response.json();
    this.log.trace('Benefit renewal: [%j]', data);

    return data;
  }
}

@injectable()
export class MockBenefitRenewalRepository implements BenefitRenewalRepository {
  private readonly log: Logger;

  constructor(@inject(TYPES.factories.LogFactory) logFactory: LogFactory) {
    this.log = logFactory.createLogger('MockBenefitRenewalRepository');
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
