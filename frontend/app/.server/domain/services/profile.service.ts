import { inject, injectable } from 'inversify';

import { TYPES } from '~/.server/constants';
import type { CommunicationPreferenceRequestDto, PhoneNumberRequestDto } from '~/.server/domain/dtos';
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
}
