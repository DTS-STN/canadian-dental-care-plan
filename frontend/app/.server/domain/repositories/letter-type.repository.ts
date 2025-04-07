import { inject, injectable } from 'inversify';

import { TYPES } from '~/.server/constants';
import type { LetterTypeEntity } from '~/.server/domain/entities';
import type { LogFactory } from '~/.server/factories';
import type { Logger } from '~/.server/logging';
import letterTypeJsonDataSource from '~/.server/resources/power-platform/letter-type.json';

export interface LetterTypeRepository {
  /**
   * Fetch all letter type entities.
   * @returns All letter type entities.
   */
  listAllLetterTypes(): ReadonlyArray<LetterTypeEntity>;

  /**
   * Fetch a letter type entity by its id.
   * @param id The id of the letter type entity.
   * @returns The letter type entity or null if not found.
   */
  findLetterTypeById(id: string): LetterTypeEntity | null;
}

@injectable()
export class DefaultLetterTypeRepository implements LetterTypeRepository {
  private readonly log: Logger;

  constructor(@inject(TYPES.factories.LogFactory) logFactory: LogFactory) {
    this.log = logFactory.createLogger('DefaultLetterTypeRepository');
  }

  listAllLetterTypes(): ReadonlyArray<LetterTypeEntity> {
    this.log.debug('Fetching all letter types');
    const letterTypeEntities = letterTypeJsonDataSource.value.at(0)?.OptionSet.Options;

    if (!letterTypeEntities) {
      this.log.warn('No letter types found');
      return [];
    }

    this.log.trace('Returning letter types: [%j]', letterTypeEntities);
    return letterTypeEntities;
  }

  findLetterTypeById(id: string): LetterTypeEntity | null {
    this.log.debug('Fetching letter type with id: [%s]', id);

    const letterTypeEntities = letterTypeJsonDataSource.value.at(0)?.OptionSet.Options;
    const letterTypeEntity = letterTypeEntities?.find(({ Value }) => Value.toString() === id);

    if (!letterTypeEntity) {
      this.log.warn('Letter type not found; id: [%s]', id);
      return null;
    }

    return letterTypeEntity;
  }
}
