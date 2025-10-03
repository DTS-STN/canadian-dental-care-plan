import { injectable } from 'inversify';

import type { CommunicationPreferenceDto } from '~/.server/domain/dtos';
import type { Logger } from '~/.server/logging';
import { createLogger } from '~/.server/logging';

export interface ProfileRepository {
  /**
   * Updates communication preferences for a user.
   *
   * @param communicationPreferenceDto The communication preference dto.
   * @returns A Promise that resolves when the update is complete.
   */
  updateCommunicationPreferences(communicationPreferenceDto: CommunicationPreferenceDto): Promise<void>;

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
export class MockProfileRepository implements ProfileRepository {
  private readonly log: Logger;

  constructor() {
    this.log = createLogger('MockProfileRepository');
  }

  async updateCommunicationPreferences(communicationPreferenceDto: CommunicationPreferenceDto): Promise<void> {
    this.log.debug('Mock updating communication preferences for request [%j]', communicationPreferenceDto);

    this.log.debug('Successfully mock updated communication preferences');
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
