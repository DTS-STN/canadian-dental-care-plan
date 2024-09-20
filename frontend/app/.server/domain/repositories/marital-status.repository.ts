import { inject, injectable } from 'inversify';

import { SERVICE_IDENTIFIER } from '~/.server/constants';
import type { MaritalStatusEntity } from '~/.server/domain/entities';
import type { LogFactory, Logger } from '~/.server/factories/log.factory';
import maritalStatusJsonDataSource from '~/.server/resources/power-platform/marital-status.json';

export interface MaritalStatusRepository {
  /**
   * Fetch all marital status entities.
   * @returns All marital status entities.
   */
  findAll(): MaritalStatusEntity[];

  /**
   * Fetch a marital status entity by its id.
   * @param id The id of the marital status entity.
   * @returns The marital status entity or null if not found.
   */
  findById(id: string): MaritalStatusEntity | null;
}

@injectable()
export class MaritalStatusRepositoryImpl implements MaritalStatusRepository {
  private readonly log: Logger;

  constructor(@inject(SERVICE_IDENTIFIER.LOG_FACTORY) logFactory: LogFactory) {
    this.log = logFactory.createLogger('MaritalStatusRepositoryImpl');
  }

  findAll(): MaritalStatusEntity[] {
    this.log.debug('Fetching all marital statuses');
    const maritalStatusEntities = maritalStatusJsonDataSource.value.at(0)?.OptionSet.Options;

    if (!maritalStatusEntities) {
      this.log.warn('No marital statuses found');
      return [];
    }

    this.log.trace('Returning marital statuses: [%j]', maritalStatusEntities);
    return maritalStatusEntities;
  }

  findById(id: string): MaritalStatusEntity | null {
    this.log.debug('Fetching marital status with id: [%s]', id);

    const maritalStatusEntities = maritalStatusJsonDataSource.value.at(0)?.OptionSet.Options;
    const maritalStatusEntity = maritalStatusEntities?.find(({ Value }) => Value.toString() === id);

    if (!maritalStatusEntity) {
      this.log.warn('Marital status not found; id: [%s]', id);
      return null;
    }

    return maritalStatusEntity;
  }
}
