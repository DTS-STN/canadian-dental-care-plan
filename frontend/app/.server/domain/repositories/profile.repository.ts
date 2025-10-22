import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { AddressRequestDto, CommunicationPreferenceRequestDto, DentalBenefitsRequestDto, EmailAddressRequestDto } from '~/.server/domain/dtos';
import type { UpdatePhoneNumbersRequestEntity } from '~/.server/domain/entities';
import type { HttpClient } from '~/.server/http';
import type { Logger } from '~/.server/logging';
import { createLogger } from '~/.server/logging';
import { HttpStatusCodes } from '~/constants/http-status-codes';

export interface ProfileRepository {
  /**
   * Updates communication preferences for a user.
   *
   * @param communicationPreferenceDto The communication preference dto.
   * @returns A Promise that resolves when the update is complete.
   */
  updateCommunicationPreferences(communicationPreferenceDto: CommunicationPreferenceRequestDto): Promise<void>;

  /**
   * Updates phone numbers for a user.
   *
   * @param updatePhoneNumbersRequestEntity The update phone number request entity.
   * @returns A Promise that resolves when the update is complete.
   */
  updatePhoneNumbers(updatePhoneNumbersRequestEntity: UpdatePhoneNumbersRequestEntity): Promise<void>;

  /**
   * Updates email address for a user.
   *
   * @param emailAddressDto The email address dto.
   * @returns A Promise that resolves when the update is complete.
   */
  updateEmailAddress(emailAddressDto: EmailAddressRequestDto): Promise<void>;

  /**
   * Updates dental benefits for a user.
   *
   * @param dentalBenefitsDto The dental benefits dto.
   * @returns A Promise that resolves when the update is complete.
   */
  updateDentalBenefits(dentalBenefitsDto: DentalBenefitsRequestDto): Promise<void>;

  /**
   * Updates mailing address for a user.
   *
   * @param addressDto The address dto.
   * @returns A Promise that resolves when the update is complete.
   */
  updateMailingAddress(addressDto: AddressRequestDto): Promise<void>;

  /**
   * Updates home address for a user.
   *
   * @param addressDto The address dto.
   * @returns A Promise that resolves when the update is complete.
   */
  updateHomeAddress(addressDto: AddressRequestDto): Promise<void>;

  /**
   * Retrieves metadata associated with the letter repository.
   *
   * @returns A record where the keys and values are strings representing metadata information.
   */
  getMetadata(): Record<string, string>;

  /**
   * Performs a health check to ensure that the letter repository is operational.
   *
   * @throws An error if the health check fails or the repository is unavailable.
   * @returns A promise that resolves when the health check completes successfully.
   */
  checkHealth(): Promise<void>;
}

export type DefaultProfileRepositoryServerConfig = Pick<ServerConfig, 'HTTP_PROXY_URL' | 'INTEROP_API_BASE_URI' | 'INTEROP_API_MAX_RETRIES' | 'INTEROP_API_BACKOFF_MS' | 'INTEROP_API_SUBSCRIPTION_KEY'>;

@injectable()
export class DefaultProfileRepository implements ProfileRepository {
  private readonly log: Logger;
  private readonly serverConfig: DefaultProfileRepositoryServerConfig;
  private readonly httpClient: HttpClient;

  constructor(
    @inject(TYPES.ServerConfig)
    serverConfig: DefaultProfileRepositoryServerConfig,
    @inject(TYPES.HttpClient) httpClient: HttpClient,
  ) {
    this.log = createLogger('DefaultProfileRepository');
    this.serverConfig = serverConfig;
    this.httpClient = httpClient;
  }

  async updateCommunicationPreferences(communicationPreferenceDto: CommunicationPreferenceRequestDto): Promise<void> {
    await Promise.reject(new Error('Method not implemented.'));
  }

  async updatePhoneNumbers(updatePhoneNumbersRequestEntity: UpdatePhoneNumbersRequestEntity): Promise<void> {
    this.log.trace('Updating phone numbers for request [%j]', updatePhoneNumbersRequestEntity);

    const url = `${this.serverConfig.INTEROP_API_BASE_URI}/dental-care/applicant-information/dts/v1/update-benefit-application`;
    const response = await this.httpClient.instrumentedFetch('http.client.interop-api.update-benefit-application.phone-numbers.posts', url, {
      proxyUrl: this.serverConfig.HTTP_PROXY_URL,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': this.serverConfig.INTEROP_API_SUBSCRIPTION_KEY,
      },
      body: JSON.stringify(updatePhoneNumbersRequestEntity),
      retryOptions: {
        retries: this.serverConfig.INTEROP_API_MAX_RETRIES,
        backoffMs: this.serverConfig.INTEROP_API_BACKOFF_MS,
        retryConditions: {
          [HttpStatusCodes.BAD_GATEWAY]: [],
        },
      },
    });

    if (!response.ok) {
      this.log.error('%j', {
        message: `Failed to 'POST' for update benefit application phone numbers`,
        status: response.status,
        statusText: response.statusText,
        url: url,
        responseBody: await response.text(),
      });

      throw new Error(`Failed to 'POST' for update benefit application phone numbers. Status: ${response.status}, Status Text: ${response.statusText}`);
    }
  }

  async updateEmailAddress(emailAddressDto: EmailAddressRequestDto): Promise<void> {
    await Promise.reject(new Error('Method not implemented.'));
  }

  async updateDentalBenefits(dentalBenefitsDto: DentalBenefitsRequestDto): Promise<void> {
    await Promise.reject(new Error('Method not implemented.'));
  }

  async updateMailingAddress(addressDto: AddressRequestDto): Promise<void> {
    await Promise.reject(new Error('Method not implemented.'));
  }

  async updateHomeAddress(addressDto: AddressRequestDto): Promise<void> {
    await Promise.reject(new Error('Method not implemented.'));
  }

  getMetadata(): Record<string, string> {
    throw new Error('Method not implemented.');
  }

  async checkHealth(): Promise<void> {
    await Promise.reject(new Error('Method not implemented.'));
  }
}

@injectable()
export class MockProfileRepository implements ProfileRepository {
  private readonly log: Logger;

  constructor() {
    this.log = createLogger('MockProfileRepository');
  }

  async updateCommunicationPreferences(communicationPreferenceDto: CommunicationPreferenceRequestDto): Promise<void> {
    this.log.debug('Mock updating communication preferences for request [%j]', communicationPreferenceDto);

    this.log.debug('Successfully mock updated communication preferences');
    return await Promise.resolve();
  }

  async updatePhoneNumbers(updatePhoneNumbersRequestEntity: UpdatePhoneNumbersRequestEntity): Promise<void> {
    this.log.debug('Mock updating phone numbers for request [%j]', updatePhoneNumbersRequestEntity);

    this.log.debug('Successfully mock updated phone numbers');
    return await Promise.resolve();
  }

  async updateDentalBenefits(dentalBenefitsDto: DentalBenefitsRequestDto): Promise<void> {
    this.log.debug('Mock updating dental benefits for request [%j]', dentalBenefitsDto);

    this.log.debug('Successfully mock updated dental benefits');
    return await Promise.resolve();
  }

  async updateEmailAddress(emailAddressDto: EmailAddressRequestDto): Promise<void> {
    this.log.debug('Mock updating email address for request [%j]', emailAddressDto);

    this.log.debug('Successfully mock updated email address');
    return await Promise.resolve();
  }

  async updateMailingAddress(addressDto: AddressRequestDto): Promise<void> {
    this.log.debug('Mock updating mailing address for request [%j]', addressDto);

    this.log.debug('Successfully mock updated mailing address');
    return await Promise.resolve();
  }

  async updateHomeAddress(addressDto: AddressRequestDto): Promise<void> {
    this.log.debug('Mock updating home address for request [%j]', addressDto);

    this.log.debug('Successfully mock updated home address');
    return await Promise.resolve();
  }

  getMetadata(): Record<string, string> {
    return {
      mockEnabled: 'true',
    };
  }

  async checkHealth(): Promise<void> {
    return await Promise.resolve();
  }
}
