import { fakerEN_CA as faker } from '@faker-js/faker';
import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { AddressCorrectionRequestEntity, AddressCorrectionResultEntity } from '~/.server/domain/entities';
import type { LogFactory, Logger } from '~/.server/factories';
import type { HttpClient } from '~/.server/http';

export interface AddressValidationRepository {
  /**
   * Corrects the provided address using the data passed in the `AddressCorrectionRequest` object.
   *
   * @param addressCorrectionRequestEntity The request entity object containing the address details that need to be corrected
   * @returns A promise that resolves to a `AddressCorrectionResultEntity` object containing corrected address results
   */
  getAddressCorrectionResult(addressCorrectionRequestEntity: AddressCorrectionRequestEntity): Promise<AddressCorrectionResultEntity>;

  getMetadata(): Record<string, string>;

  checkHealth(): Promise<void>;
}

@injectable()
export class DefaultAddressValidationRepository implements AddressValidationRepository {
  private readonly log: Logger;
  private readonly baseUrl: string;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.configs.ServerConfig) private readonly serverConfig: Pick<ServerConfig, 'HTTP_PROXY_URL' | 'INTEROP_API_BASE_URI' | 'INTEROP_API_SUBSCRIPTION_KEY'>,
    @inject(TYPES.http.HttpClient) private readonly httpClient: HttpClient,
  ) {
    this.log = logFactory.createLogger('DefaultAddressValidationRepository');
    this.baseUrl = `${this.serverConfig.INTEROP_API_BASE_URI}/address/validation/v1/CAN/correct`;
  }

  async getAddressCorrectionResult(addressCorrectionRequestEntity: AddressCorrectionRequestEntity): Promise<AddressCorrectionResultEntity> {
    this.log.trace('Checking correctness of address for addressCorrectionRequest: [%j]', addressCorrectionRequestEntity);
    const { address, city, postalCode, provinceCode } = addressCorrectionRequestEntity;

    const url = new URL(this.baseUrl);
    url.searchParams.set('AddressFullText', address);
    url.searchParams.set('AddressCityName', city);
    url.searchParams.set('AddressPostalCode', postalCode);
    url.searchParams.set('ProvinceCode', provinceCode);

    const response = await this.httpClient.instrumentedFetch('http.client.interop-api.address-validation-correct.gets', url, {
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

  getMetadata(): Record<string, string> {
    return {
      baseUrl: this.baseUrl,
    };
  }

  async checkHealth(): Promise<void> {
    await this.getAddressCorrectionResult({ address: '111 WELLINGTON ST', city: 'Ottawa', postalCode: 'K1A0A4', provinceCode: 'ON' });
  }
}

@injectable()
export class MockAddressValidationRepository implements AddressValidationRepository {
  private readonly log: Logger;

  constructor(@inject(TYPES.factories.LogFactory) logFactory: LogFactory) {
    this.log = logFactory.createLogger('MockAddressValidationRepository');
  }

  getAddressCorrectionResult(addressCorrectionRequestEntity: AddressCorrectionRequestEntity): Promise<AddressCorrectionResultEntity> {
    this.log.debug('Checking correctness of address for addressCorrectionRequest: [%j]', addressCorrectionRequestEntity);
    const statusCode = this.mockStatusCodeFromProvinceCode(addressCorrectionRequestEntity.provinceCode);
    const addressCorrectionResults: AddressCorrectionResultEntity = {
      'wsaddr:CorrectionResults': {
        'nc:AddressFullText': faker.location.streetAddress(true).toUpperCase(),
        'nc:AddressCityName': addressCorrectionRequestEntity.city.toUpperCase(),
        'can:ProvinceCode': addressCorrectionRequestEntity.provinceCode.toUpperCase(),
        'nc:AddressPostalCode': addressCorrectionRequestEntity.postalCode.toUpperCase(),
        'wsaddr:Information': {
          'wsaddr:StatusCode': statusCode,
        },
      },
    };

    this.log.debug('Address correction results: [%j]', addressCorrectionResults);
    return Promise.resolve(addressCorrectionResults);
  }

  protected mockStatusCodeFromProvinceCode(provinceCode: string) {
    // Newfoundland and Labrador
    if (provinceCode === 'NL') {
      throw Error('Address validation service is currently unavailable');
    }

    // Ontario
    if (provinceCode === 'ON') {
      return 'Corrected';
    }

    // Quebec
    if (provinceCode === 'QC') {
      return 'NotCorrect';
    }

    // Others
    return 'Valid';
  }

  getMetadata(): Record<string, string> {
    return {
      mockEnabled: 'true',
    };
  }

  checkHealth(): Promise<void> {
    return Promise.resolve();
  }
}
