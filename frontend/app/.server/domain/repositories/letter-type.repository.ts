import { injectable } from 'inversify';

import type { LetterTypeEntity } from '~/.server/domain/entities';
import { createLogger } from '~/.server/logging';
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

  constructor() {
    this.log = createLogger('DefaultLetterTypeRepository');
  }

  listAllLetterTypes(): ReadonlyArray<LetterTypeEntity> {
    throw new Error('Letter type service is not yet implemented');
    //TODO: Implement listAllLetterTypes service
  }

  findLetterTypeById(id: string): LetterTypeEntity | null {
    throw new Error('Letter type service is not yet implemented');
    //TODO: Implement findLetterTypeById service
  }
}

@injectable()
export class MockLetterTypeRepository implements LetterTypeRepository {
  private readonly log: Logger;

  constructor() {
    this.log = createLogger('MockLetterTypeRepository');
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
