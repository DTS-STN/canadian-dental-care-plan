import { inject, injectable } from 'inversify';

import { AddressValidationRepository } from './address-validation.repository';
import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { AddressCorrectionRequestEntity, AddressCorrectionResultEntity } from '~/.server/domain/entities';
import type { LogFactory, Logger } from '~/.server/factories';
import { getFetchFn, instrumentedFetch } from '~/utils/fetch-utils.server';

@injectable()
export class DefaultAddressValidationRepository implements AddressValidationRepository {
  private readonly log: Logger;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.configs.ServerConfig) private readonly serverConfig: Pick<ServerConfig, 'HTTP_PROXY_URL' | 'INTEROP_API_BASE_URI' | 'INTEROP_API_SUBSCRIPTION_KEY'>,
  ) {
    this.log = logFactory.createLogger('DefaultAddressValidationRepository');
  }

  async getAddressCorrectionResult(addressCorrectionRequestEntity: AddressCorrectionRequestEntity): Promise<AddressCorrectionResultEntity> {
    this.log.trace('Checking correctness of address for addressCorrectionRequest: [%j]', addressCorrectionRequestEntity);
    const { address, city, postalCode, provinceCode } = addressCorrectionRequestEntity;

    const url = new URL(`${this.serverConfig.INTEROP_API_BASE_URI}/address/validation/v1/CAN/correct`);
    url.searchParams.set('AddressFullText', address);
    url.searchParams.set('AddressCityName', city);
    url.searchParams.set('AddressPostalCode', postalCode);
    url.searchParams.set('ProvinceCode', provinceCode);

    const response = await instrumentedFetch(getFetchFn(this.serverConfig.HTTP_PROXY_URL), 'http.client.interop-api.address-validation-correct.gets', url, {
      method: 'GET',
      headers: {
        'Accept-Language': 'en-CA',
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': this.serverConfig.INTEROP_API_SUBSCRIPTION_KEY,
      },
    });

    if (!response.ok) {
      this.log.error('%j', {
        message: 'Failed to correct address',
        status: response.status,
        statusText: response.statusText,
        url: url,
        responseBody: await response.text(),
      });
      throw new Error(`Failed to correct address. Status: ${response.status}, Status Text: ${response.statusText}`);
    }

    const addressCorrectionResults: AddressCorrectionResultEntity = await response.json();
    this.log.trace('Address correction results: [%j]', addressCorrectionResults);

    return addressCorrectionResults;
  }
}
