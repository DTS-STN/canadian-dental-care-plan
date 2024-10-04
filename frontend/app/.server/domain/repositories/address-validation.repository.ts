import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { SERVICE_IDENTIFIER } from '~/.server/constants';
import type { AddressCorrectionResultEntity } from '~/.server/domain/entities';
import type { LogFactory, Logger } from '~/.server/factories';
import { getFetchFn, instrumentedFetch } from '~/utils/fetch-utils.server';

export interface AddressCorrectionRequest {
  /** The full or partial address. */
  address: string;

  /** The name of the city. */
  city: string;

  /** The 6-character postal code. */
  postalCode: string;

  /** The 2-character Canadian province or territorial code. */
  provinceCode: string;
}

export interface AddressValidationRepository {
  /**
   * Corrects the provided address using the data passed in the `AddressCorrectionRequest` object.
   *
   * @param addressCorrectionRequest The request object containing the address details that need to be corrected
   * @returns A promise that resolves to a `AddressCorrectionResultEntity` object containing corrected address results
   */
  getAddressCorrectionResult(addressCorrectionRequest: AddressCorrectionRequest): Promise<AddressCorrectionResultEntity>;
}

@injectable()
export class AddressValidationRepositoryImpl implements AddressValidationRepository {
  private readonly log: Logger;

  constructor(
    @inject(SERVICE_IDENTIFIER.LOG_FACTORY) logFactory: LogFactory,
    @inject(SERVICE_IDENTIFIER.SERVER_CONFIG) private readonly serverConfig: Pick<ServerConfig, 'HTTP_PROXY_URL' | 'INTEROP_API_BASE_URI' | 'INTEROP_API_SUBSCRIPTION_KEY'>,
  ) {
    this.log = logFactory.createLogger('AddressValidationRepositoryImpl');
  }

  async getAddressCorrectionResult(addressCorrectionRequest: AddressCorrectionRequest): Promise<AddressCorrectionResultEntity> {
    this.log.trace('Checking correctness of address for addressCorrectionRequest: [%j]', addressCorrectionRequest);
    const { address, city, postalCode, provinceCode } = addressCorrectionRequest;

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
