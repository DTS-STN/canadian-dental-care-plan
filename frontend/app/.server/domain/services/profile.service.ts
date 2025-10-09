import { inject, injectable } from 'inversify';

import { TYPES } from '~/.server/constants';
import type { AddressRequestDto, CommunicationPreferenceRequestDto, DentalBenefitsRequestDto, EmailAddressRequestDto, PhoneNumberRequestDto } from '~/.server/domain/dtos';
import type { ProfileRepository } from '~/.server/domain/repositories';
import type { AuditService } from '~/.server/domain/services';
import type { Logger } from '~/.server/logging';
import { createLogger } from '~/.server/logging';

export interface ProfileService {
  /**
   * Updates communication preferences for a user in the protected route.
   *
   * @param communicationPreferenceDto The communication preference dto
   * @returns A Promise that resolves when the update is complete
   */
  updateCommunicationPreferences(communicationPreferenceDto: CommunicationPreferenceRequestDto): Promise<void>;

  /**
   * Updates phone numbers for a user in the protected route.
   *
   * @param phoneNumberDto The phone number dto
   * @returns A Promise that resolves when the update is complete
   */
  updatePhoneNumbers(phoneNumberDto: PhoneNumberRequestDto): Promise<void>;

  /**
   * Updates dental benefits for a user in the protected route.
   *
   * @param dentalBenefitsDto The dental benefits dto
   * @returns A Promise that resolves when the update is complete
   */
  updateDentalBenefits(dentalBenefitsDto: DentalBenefitsRequestDto): Promise<void>;

  /**
   * Updates email address for a user in the protected route.
   *
   * @param emailAddressDto The email address dto
   * @returns A Promise that resolves when the update is complete
   */
  updateEmailAddress(emailAddressDto: EmailAddressRequestDto): Promise<void>;

  /**
   * Updates mailing address for a user in the protected route.
   *
   * @param addressDto The address dto
   * @returns A Promise that resolves when the update is complete
   */
  updateMailingAddress(addressDto: AddressRequestDto): Promise<void>;

  /**
   * Updates home address for a user in the protected route.
   *
   * @param addressDto The address dto
   * @returns A Promise that resolves when the update is complete
   */
  updateHomeAddress(addressDto: AddressRequestDto): Promise<void>;
}

@injectable()
export class DefaultProfileService implements ProfileService {
  private readonly log: Logger;
  private readonly profileRepository: ProfileRepository;

  constructor(@inject(TYPES.ProfileRepository) profileRepository: ProfileRepository, @inject(TYPES.AuditService) auditService: AuditService) {
    this.log = createLogger('DefaultProfileService');
    this.profileRepository = profileRepository;
    this.init();
  }

  private init(): void {
    this.log.debug('DefaultProfileService initiated.');
  }

  async updateCommunicationPreferences(communicationPreferenceDto: CommunicationPreferenceRequestDto): Promise<void> {
    this.log.trace('Updating communication preferences for request [%j]', communicationPreferenceDto);

    await this.profileRepository.updateCommunicationPreferences(communicationPreferenceDto);

    this.log.trace('Successfully updated communication preferences');
  }

  async updatePhoneNumbers(phoneNumberDto: PhoneNumberRequestDto): Promise<void> {
    this.log.trace('Updating phone numbers for request [%j]', phoneNumberDto);

    await this.profileRepository.updatePhoneNumbers(phoneNumberDto);

    this.log.trace('Successfully updated phone numbers');
  }

  async updateDentalBenefits(dentalBenefitsDto: DentalBenefitsRequestDto): Promise<void> {
    this.log.trace('Updating dental benefits for request [%j]', dentalBenefitsDto);

    await this.profileRepository.updateDentalBenefits(dentalBenefitsDto);

    this.log.trace('Successfully updated dental benefits');
  }

  async updateEmailAddress(emailAddressDto: EmailAddressRequestDto): Promise<void> {
    this.log.trace('Updating email address for request [%j]', emailAddressDto);

    await this.profileRepository.updateEmailAddress(emailAddressDto);

    this.log.trace('Successfully updated email address');
  }

  async updateMailingAddress(addressDto: AddressRequestDto): Promise<void> {
    this.log.trace('Updating mailing address for request [%j]', addressDto);

    await this.profileRepository.updateMailingAddress(addressDto);

    this.log.trace('Successfully updated mailing address');
  }

  async updateHomeAddress(addressDto: AddressRequestDto): Promise<void> {
    this.log.trace('Updating home address for request [%j]', addressDto);

    await this.profileRepository.updateHomeAddress(addressDto);

    this.log.trace('Successfully updated home address');
  }
}
