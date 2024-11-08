import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import { BenefitRenewalRequestEntity, BenefitRenewalResponseEntity } from '~/.server/domain/entities';
import type { LogFactory, Logger } from '~/.server/factories';
import { getFetchFn, instrumentedFetch } from '~/utils/fetch-utils.server';

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
export class BenefitRenewalRepositoryImpl implements BenefitRenewalRepository {
  private readonly log: Logger;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.configs.ServerConfig) private readonly serverConfig: Pick<ServerConfig, 'INTEROP_API_BASE_URI' | 'HTTP_PROXY_URL' | 'INTEROP_API_SUBSCRIPTION_KEY'>,
  ) {
    this.log = logFactory.createLogger('BenefitRenewalRepositoryImpl');
  }

  async createBenefitRenewal(benefitRenewalRequest: BenefitRenewalRequestEntity): Promise<BenefitRenewalResponseEntity> {
    this.log.trace('Submiting benefit renewal for request [%j]', benefitRenewalRequest);

    const url = new URL(`${this.serverConfig.INTEROP_API_BASE_URI}/dental-care/applicant-information/dts/v1/benefit-application`);
    url.searchParams.set('scenario', 'RENEWAL');

    const response = await instrumentedFetch(getFetchFn(this.serverConfig.HTTP_PROXY_URL), 'http.client.interop-api.benefit-application_renewal.posts', url, {
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
