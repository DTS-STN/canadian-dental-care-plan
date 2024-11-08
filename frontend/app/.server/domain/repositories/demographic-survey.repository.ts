import { inject, injectable } from 'inversify';

import { TYPES } from '~/.server/constants';
import type { DisabilityStatusEntity, EthnicGroupEntity, FirstNationsEntity, GenderStatusEntity, IndigenousStatusEntity, LocationBornStatusEntity } from '~/.server/domain/entities';
import type { LogFactory, Logger } from '~/.server/factories';
import EthnicGroupJsonDataSource from '~/.server/resources/power-platform/demographic-survey/ethnic-groups.json';
import FirstNationsJsonDataSource from '~/.server/resources/power-platform/demographic-survey/first-nations.json';
import DisabilityStatusJsonDataSource from '~/.server/resources/power-platform/demographic-survey/has-disability.json';
import IndigenousStatusJsonDataSource from '~/.server/resources/power-platform/demographic-survey/is-indigenous.json';
import GenderStatusJsonDataSource from '~/.server/resources/power-platform/demographic-survey/persons-gender.json';
import LocationBornStatusJsonDataSource from '~/.server/resources/power-platform/demographic-survey/where-was-person-born.json';

export interface DemographicSurveyRepository {
  /**
   * Fetch all indigenous status entities.
   * @returns All indigenous status entities.
   */
  listAllIndigenousStatuses(): IndigenousStatusEntity[];

  /**
   * Fetch a indigenous status entity by its id.
   * @param id The id of the indigenous status entity.
   * @returns The indigenous status entity or null if not found.
   */
  findIndigenousStatusById(id: string): IndigenousStatusEntity | null;

  /**
   * Fetch all First Nations entities.
   * @returns All First Nations entities.
   */
  listAllFirstNations(): FirstNationsEntity[];

  /**
   * Fetch a First Nations entity by its id.
   * @param id The id of the First Nations entity.
   * @returns The First Nations entity or null if not found.
   */
  findFirstNationsById(id: string): FirstNationsEntity | null;

  /**
   * Fetch all disability status entities.
   * @returns All disability status entities.
   */
  listAllDisabilityStatuses(): DisabilityStatusEntity[];

  /**
   * Fetch a disability status entity by its id.
   * @param id The id of the disability status entity.
   * @returns The disability status entity or null if not found.
   */
  findDisabilityStatusById(id: string): DisabilityStatusEntity | null;

  /**
   * Fetch all location born status entities.
   * @returns All location born status entities.
   */
  listAllEthnicGroups(): EthnicGroupEntity[];

  /**
   * Fetch a location born status entity by its id.
   * @param id The id of the location born status entity.
   * @returns The location born status entity or null if not found.
   */
  findEthnicGroupById(id: string): EthnicGroupEntity | null;

  /**
   * Fetch all location born status entities.
   * @returns All location born status entities.
   */
  listAllLocationBornStatuses(): LocationBornStatusEntity[];

  /**
   * Fetch a location born status entity by its id.
   * @param id The id of the location born status entity.
   * @returns The location born status entity or null if not found.
   */
  findLocationBornStatusById(id: string): LocationBornStatusEntity | null;

  /**
   * Fetch all gender status entities.
   * @returns All gender status entities.
   */
  listAllGenderStatuses(): GenderStatusEntity[];

  /**
   * Fetch a gender status entity by its id.
   * @param id The id of the gender status entity.
   * @returns The gender status entity or null if not found.
   */
  findGenderStatusById(id: string): GenderStatusEntity | null;
}

@injectable()
export class DemographicSurveyRepositoryImpl implements DemographicSurveyRepository {
  private readonly log: Logger;

  constructor(@inject(TYPES.factories.LogFactory) logFactory: LogFactory) {
    this.log = logFactory.createLogger('DemographicSurveyRepositoryImpl');
  }

  listAllIndigenousStatuses(): IndigenousStatusEntity[] {
    this.log.debug('Fetching all indigenous statuses');
    const indigenousStatusEntities = IndigenousStatusJsonDataSource.value.at(0)?.OptionSet.Options;

    if (!indigenousStatusEntities) {
      this.log.warn('No indigenous statuses found');
      return [];
    }

    this.log.trace('Returning indigenous statuses: [%j]', indigenousStatusEntities);
    return indigenousStatusEntities;
  }

  findIndigenousStatusById(id: string): IndigenousStatusEntity | null {
    this.log.debug('Fetching indigenous status with id: [%s]', id);

    const indigenousStatusEntities = IndigenousStatusJsonDataSource.value.at(0)?.OptionSet.Options;
    const indigenousStatusEntity = indigenousStatusEntities?.find(({ Value }) => Value.toString() === id);

    if (!indigenousStatusEntity) {
      this.log.warn('indigenous status not found; id: [%s]', id);
      return null;
    }

    return indigenousStatusEntity;
  }

  listAllFirstNations(): FirstNationsEntity[] {
    this.log.debug('Fetching all First Nations');
    const firstNationsEntities = FirstNationsJsonDataSource.value.at(0)?.OptionSet.Options;

    if (!firstNationsEntities) {
      this.log.warn('No First Nations found');
      return [];
    }

    this.log.trace('Returning First Nations: [%j]', firstNationsEntities);
    return firstNationsEntities;
  }

  findFirstNationsById(id: string): FirstNationsEntity | null {
    this.log.debug('Fetching First Nations with id: [%s]', id);

    const firstNationsEntities = FirstNationsJsonDataSource.value.at(0)?.OptionSet.Options;
    const firstNationsEntity = firstNationsEntities?.find(({ Value }) => Value.toString() === id);

    if (!firstNationsEntity) {
      this.log.warn('First Nations not found; id: [%s]', id);
      return null;
    }

    return firstNationsEntity;
  }

  listAllDisabilityStatuses(): DisabilityStatusEntity[] {
    this.log.debug('Fetching all disability statuses');
    const disabilityStatusEntities = DisabilityStatusJsonDataSource.value.at(0)?.OptionSet.Options;

    if (!disabilityStatusEntities) {
      this.log.warn('No disability statuses found');
      return [];
    }

    this.log.trace('Returning disability statuses: [%j]', disabilityStatusEntities);
    return disabilityStatusEntities;
  }

  findDisabilityStatusById(id: string): DisabilityStatusEntity | null {
    this.log.debug('Fetching disability status with id: [%s]', id);

    const disabilityStatusEntities = DisabilityStatusJsonDataSource.value.at(0)?.OptionSet.Options;
    const disabilityStatusEntity = disabilityStatusEntities?.find(({ Value }) => Value.toString() === id);

    if (!disabilityStatusEntity) {
      this.log.warn('disability status not found; id: [%s]', id);
      return null;
    }

    return disabilityStatusEntity;
  }

  listAllEthnicGroups(): EthnicGroupEntity[] {
    this.log.debug('Fetching all ethnic groups');
    const ethnicGroupEntities = EthnicGroupJsonDataSource.value.at(0)?.OptionSet.Options;

    if (!ethnicGroupEntities) {
      this.log.warn('No ethnic groups found');
      return [];
    }

    this.log.trace('Returning ethnic groups: [%j]', ethnicGroupEntities);
    return ethnicGroupEntities;
  }

  findEthnicGroupById(id: string): EthnicGroupEntity | null {
    this.log.debug('Fetching location born status with id: [%s]', id);

    const ethnicGroupEntities = EthnicGroupJsonDataSource.value.at(0)?.OptionSet.Options;
    const ethnicGroupEntity = ethnicGroupEntities?.find(({ Value }) => Value.toString() === id);

    if (!ethnicGroupEntity) {
      this.log.warn('location born status not found; id: [%s]', id);
      return null;
    }

    return ethnicGroupEntity;
  }

  listAllLocationBornStatuses(): LocationBornStatusEntity[] {
    this.log.debug('Fetching all location born statuses');
    const locationBornStatusEntities = LocationBornStatusJsonDataSource.value.at(0)?.OptionSet.Options;

    if (!locationBornStatusEntities) {
      this.log.warn('No location born statuses found');
      return [];
    }

    this.log.trace('Returning location born statuses: [%j]', locationBornStatusEntities);
    return locationBornStatusEntities;
  }

  findLocationBornStatusById(id: string): LocationBornStatusEntity | null {
    this.log.debug('Fetching location born status with id: [%s]', id);

    const locationBornStatusEntities = LocationBornStatusJsonDataSource.value.at(0)?.OptionSet.Options;
    const locationBornStatusEntity = locationBornStatusEntities?.find(({ Value }) => Value.toString() === id);

    if (!locationBornStatusEntity) {
      this.log.warn('location born status not found; id: [%s]', id);
      return null;
    }

    return locationBornStatusEntity;
  }

  listAllGenderStatuses(): GenderStatusEntity[] {
    this.log.debug('Fetching all gender statuses');
    const genderStatusEntities = GenderStatusJsonDataSource.value.at(0)?.OptionSet.Options;

    if (!genderStatusEntities) {
      this.log.warn('No gender statuses found');
      return [];
    }

    this.log.trace('Returning gender statuses: [%j]', genderStatusEntities);
    return genderStatusEntities;
  }

  findGenderStatusById(id: string): GenderStatusEntity | null {
    this.log.debug('Fetching gender status with id: [%s]', id);

    const genderStatusEntities = GenderStatusJsonDataSource.value.at(0)?.OptionSet.Options;
    const genderStatusEntity = genderStatusEntities?.find(({ Value }) => Value.toString() === id);

    if (!genderStatusEntity) {
      this.log.warn('gender status not found; id: [%s]', id);
      return null;
    }

    return genderStatusEntity;
  }
}
