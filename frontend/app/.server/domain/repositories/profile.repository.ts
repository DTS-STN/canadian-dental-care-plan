import { injectable } from 'inversify';

import type { AddressRequestDto, CommunicationPreferenceRequestDto, DentalBenefitsRequestDto, EmailAddressRequestDto, PhoneNumberRequestDto } from '~/.server/domain/dtos';
import type { Logger } from '~/.server/logging';
import { createLogger } from '~/.server/logging';

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
   * @param PhoneNumberDto The phone number dto.
   * @returns A Promise that resolves when the update is complete.
   */
  updatePhoneNumbers(PhoneNumberDto: PhoneNumberRequestDto): Promise<void>;

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

@injectable()
export class DefaultProfileRepository implements ProfileRepository {
  private readonly log: Logger;

  constructor() {
    this.log = createLogger('DefaultProfileRepository');
  }

  async updateCommunicationPreferences(communicationPreferenceDto: CommunicationPreferenceRequestDto): Promise<void> {
    await Promise.reject(new Error('Method not implemented.'));
  }

  async updatePhoneNumbers(PhoneNumberDto: PhoneNumberRequestDto): Promise<void> {
    await Promise.reject(new Error('Method not implemented.'));
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

  async updatePhoneNumbers(phoneNumberDto: PhoneNumberRequestDto): Promise<void> {
    this.log.debug('Mock updating phone numbers for request [%j]', phoneNumberDto);

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
