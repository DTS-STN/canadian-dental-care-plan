import { inject, injectable } from 'inversify';
import moize from 'moize';

import type { ServerConfig } from '~/.server/configs';
import { SERVICE_IDENTIFIER } from '~/.server/constants';
import type {
  DisabilityStatusDto,
  DisabilityStatusLocalizedDto,
  EthnicGroupDto,
  EthnicGroupLocalizedDto,
  GenderStatusDto,
  GenderStatusLocalizedDto,
  IndigenousStatusDto,
  IndigenousStatusLocalizedDto,
  LocationBornStatusDto,
  LocationBornStatusLocalizedDto,
} from '~/.server/domain/dtos';
import { DisabilityStatusNotFoundException, EthnicGroupNotFoundException, GenderStatusNotFoundException, IndigenousStatusNotFoundException, LocationBornStatusNotFoundException } from '~/.server/domain/exceptions';
import type { DemographicSurveyDtoMapper } from '~/.server/domain/mappers';
import type { DemographicSurveyRepository } from '~/.server/domain/repositories';
import type { LogFactory, Logger } from '~/.server/factories';

/**
 * Service interface for managing demographic survey data.
 */
export interface DemographicSurveyService {
  /**
   * Retrieves a list of all inidigenous statuses.
   *
   * @returns An array of IndigenousStatus DTOs.
   */
  listIndigenousStatuses(): ReadonlyArray<IndigenousStatusDto>;

  /**
   * Retrieves a specific inidigenous status by its ID.
   *
   * @param id - The ID of the inidigenous status to retrieve.
   * @returns The IndigenousStatus DTO corresponding to the specified ID.
   * @throws {IndigenousStatusNotFoundException} If no inidigenous status is found with the specified ID.
   */
  getIndigenousStatusById(id: string): IndigenousStatusDto;

  /**
   * Retrieves a list of all inidigenous statuses in the specified locale.
   *
   * @param locale - The desired locale (e.g., 'en' or 'fr').
   * @returns An array of IndigenousStatus DTOs in the specified locale.
   */
  listLocalizedIndigenousStatuses(locale: AppLocale): ReadonlyArray<IndigenousStatusLocalizedDto>;

  /**
   * Retrieves a specific inidigenous status by its ID in the specified locale.
   *
   * @param id - The ID of the inidigenous status to retrieve.
   * @param locale - The desired locale (e.g., 'en' or 'fr').
   * @returns The IndigenousStatus DTO corresponding to the specified ID in the given locale.
   * @throws {IndigenousStatusNotFoundException} If no inidigenous status is found with the specified ID.
   */
  getLocalizedIndigenousStatusById(id: string, locale: AppLocale): IndigenousStatusLocalizedDto;

  /**
   * Retrieves a list of all disability statuses.
   *
   * @returns An array of DisabilityStatus DTOs.
   */
  listDisabilityStatuses(): ReadonlyArray<DisabilityStatusDto>;

  /**
   * Retrieves a specific disability status by its ID.
   *
   * @param id - The ID of the disability status to retrieve.
   * @returns The DisabilityStatus DTO corresponding to the specified ID.
   * @throws {DisabilityStatusNotFoundException} If no disability status is found with the specified ID.
   */
  getDisabilityStatusById(id: string): DisabilityStatusDto;

  /**
   * Retrieves a list of all disability statuses in the specified locale.
   *
   * @param locale - The desired locale (e.g., 'en' or 'fr').
   * @returns An array of DisabilityStatus DTOs in the specified locale.
   */
  listLocalizedDisabilityStatuses(locale: AppLocale): ReadonlyArray<DisabilityStatusLocalizedDto>;

  /**
   * Retrieves a specific disability status by its ID in the specified locale.
   *
   * @param id - The ID of the disability status to retrieve.
   * @param locale - The desired locale (e.g., 'en' or 'fr').
   * @returns The DisabilityStatus DTO corresponding to the specified ID in the given locale.
   * @throws {DisabilityStatusNotFoundException} If no disability status is found with the specified ID.
   */
  getLocalizedDisabilityStatusById(id: string, locale: AppLocale): DisabilityStatusLocalizedDto;

  /**
   * Retrieves a list of all ethnic groups.
   *
   * @returns An array of EthnicGroup DTOs.
   */
  listEthnicGroups(): ReadonlyArray<EthnicGroupDto>;

  /**
   * Retrieves a specific ethnic group by its ID.
   *
   * @param id - The ID of the ethnic group to retrieve.
   * @returns The EthnicGroup DTO corresponding to the specified ID.
   * @throws {EthnicGroupNotFoundException} If no ethnic group is found with the specified ID.
   */
  getEthnicGroupById(id: string): EthnicGroupDto;

  /**
   * Retrieves a list of all ethnic groups in the specified locale.
   *
   * @param locale - The desired locale (e.g., 'en' or 'fr').
   * @returns An array of EthnicGroup DTOs in the specified locale.
   */
  listLocalizedEthnicGroups(locale: AppLocale): ReadonlyArray<EthnicGroupLocalizedDto>;

  /**
   * Retrieves a specific ethnic group by its ID in the specified locale.
   *
   * @param id - The ID of the ethnic group to retrieve.
   * @param locale - The desired locale (e.g., 'en' or 'fr').
   * @returns The EthnicGroup DTO corresponding to the specified ID in the given locale.
   * @throws {EthnicGroupNotFoundException} If no ethnic group is found with the specified ID.
   */
  getLocalizedEthnicGroupById(id: string, locale: AppLocale): EthnicGroupLocalizedDto;

  /**
   * Retrieves a list of all location born statuses.
   *
   * @returns An array of LocationBornStatus DTOs.
   */
  listLocationBornStatuses(): ReadonlyArray<LocationBornStatusDto>;

  /**
   * Retrieves a specific location born status by its ID.
   *
   * @param id - The ID of the location born status to retrieve.
   * @returns The LocationBornStatus DTO corresponding to the specified ID.
   * @throws {LocationBornStatusNotFoundException} If no location born status is found with the specified ID.
   */
  getLocationBornStatusById(id: string): LocationBornStatusDto;

  /**
   * Retrieves a list of all location born statuses in the specified locale.
   *
   * @param locale - The desired locale (e.g., 'en' or 'fr').
   * @returns An array of LocationBornStatus DTOs in the specified locale.
   */
  listLocalizedLocationBornStatuses(locale: AppLocale): ReadonlyArray<LocationBornStatusLocalizedDto>;

  /**
   * Retrieves a specific location born status by its ID in the specified locale.
   *
   * @param id - The ID of the location born status to retrieve.
   * @param locale - The desired locale (e.g., 'en' or 'fr').
   * @returns The LocationBornStatus DTO corresponding to the specified ID in the given locale.
   * @throws {LocationBornStatusNotFoundException} If no location born status is found with the specified ID.
   */
  getLocalizedLocationBornStatusById(id: string, locale: AppLocale): LocationBornStatusLocalizedDto;

  /**
   * Retrieves a list of all gender statuses.
   *
   * @returns An array of GenderStatus DTOs.
   */
  listGenderStatuses(): ReadonlyArray<GenderStatusDto>;

  /**
   * Retrieves a specific gender status by its ID.
   *
   * @param id - The ID of the gender status to retrieve.
   * @returns The GenderStatus DTO corresponding to the specified ID.
   * @throws {GenderStatusNotFoundException} If no gender status is found with the specified ID.
   */
  getGenderStatusById(id: string): GenderStatusDto;

  /**
   * Retrieves a list of all gender statuses in the specified locale.
   *
   * @param locale - The desired locale (e.g., 'en' or 'fr').
   * @returns An array of GenderStatus DTOs in the specified locale.
   */
  listLocalizedGenderStatuses(locale: AppLocale): ReadonlyArray<GenderStatusLocalizedDto>;

  /**
   * Retrieves a specific gender status by its ID in the specified locale.
   *
   * @param id - The ID of the gender status to retrieve.
   * @param locale - The desired locale (e.g., 'en' or 'fr').
   * @returns The GenderStatus DTO corresponding to the specified ID in the given locale.
   * @throws {GenderStatusNotFoundException} If no gender status is found with the specified ID.
   */
  getLocalizedGenderStatusById(id: string, locale: AppLocale): GenderStatusLocalizedDto;
}

/**
 * Implementation of the DemographicSurveyService interface.
 *
 * This service provides methods to manage and retrieve demographic survey data,
 * including localized versions of the data.
 *
 * The service uses caching to optimize performance and reduce redundant
 * database lookups. It integrates with a logging system to trace operations.
 */
@injectable()
export class DemographicSurveyServiceServiceImpl implements DemographicSurveyService {
  private readonly log: Logger;

  constructor(
    @inject(SERVICE_IDENTIFIER.LOG_FACTORY) logFactory: LogFactory,
    @inject(SERVICE_IDENTIFIER.DEMOGRAPHIC_SURVEY_DTO_MAPPER) private readonly DemographicSurveyDtoMapper: DemographicSurveyDtoMapper,
    @inject(SERVICE_IDENTIFIER.DEMOGRAPHIC_SURVEY_REPOSITORY) private readonly DemographicSurveyRepository: DemographicSurveyRepository,
    @inject(SERVICE_IDENTIFIER.SERVER_CONFIG) private readonly serverConfig: Pick<ServerConfig, 'LOOKUP_SVC_DEMOGRAPHIC_SURVEY_CACHE_TTL_SECONDS'>,
  ) {
    this.log = logFactory.createLogger('DemographicSurveyServiceServiceImpl');

    // Configure caching
    this.listIndigenousStatuses.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_DEMOGRAPHIC_SURVEY_CACHE_TTL_SECONDS;
    this.getIndigenousStatusById.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_DEMOGRAPHIC_SURVEY_CACHE_TTL_SECONDS;
    this.listDisabilityStatuses.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_DEMOGRAPHIC_SURVEY_CACHE_TTL_SECONDS;
    this.getDisabilityStatusById.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_DEMOGRAPHIC_SURVEY_CACHE_TTL_SECONDS;
    this.listEthnicGroups.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_DEMOGRAPHIC_SURVEY_CACHE_TTL_SECONDS;
    this.getEthnicGroupById.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_DEMOGRAPHIC_SURVEY_CACHE_TTL_SECONDS;
    this.listLocationBornStatuses.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_DEMOGRAPHIC_SURVEY_CACHE_TTL_SECONDS;
    this.getLocationBornStatusById.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_DEMOGRAPHIC_SURVEY_CACHE_TTL_SECONDS;
    this.listGenderStatuses.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_DEMOGRAPHIC_SURVEY_CACHE_TTL_SECONDS;
    this.getGenderStatusById.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_DEMOGRAPHIC_SURVEY_CACHE_TTL_SECONDS;
  }

  // Indigenous status
  listIndigenousStatuses = moize(this.listIndigenousStatusesImpl, {
    onCacheAdd: () => this.log.info('Creating new listIndigenousStatuses memo'),
  });

  getIndigenousStatusById = moize(this.getIndigenousStatusByIdImpl, {
    maxSize: Infinity,
    onCacheAdd: () => this.log.info('Creating new getIndigenousStatusById memo'),
  });

  listLocalizedIndigenousStatuses(locale: AppLocale): ReadonlyArray<IndigenousStatusLocalizedDto> {
    this.log.debug('Get all localized inidigenous statuses with locale: [%s]', locale);
    const indigenousStatusDtos = this.listIndigenousStatuses();
    const localizedIndigenousStatusDtos = this.DemographicSurveyDtoMapper.mapIndigenousStatusDtosToIndigenousStatusLocalizedDtos(indigenousStatusDtos, locale);
    this.log.trace('Returning localized inidigenous statuses: [%j]', localizedIndigenousStatusDtos);
    return localizedIndigenousStatusDtos;
  }

  getLocalizedIndigenousStatusById(id: string, locale: AppLocale): IndigenousStatusLocalizedDto {
    this.log.debug('Get localized inidigenous status with id: [%s] and locale: [%s]', id, locale);
    const indigenousStatusDto = this.getIndigenousStatusById(id);
    const localizedIndigenousStatusDto = this.DemographicSurveyDtoMapper.mapIndigenousStatusDtoToIndigenousStatusLocalizedDto(indigenousStatusDto, locale);
    this.log.trace('Returning localized inidigenous status: [%j]', localizedIndigenousStatusDto);
    return localizedIndigenousStatusDto;
  }

  private listIndigenousStatusesImpl(): ReadonlyArray<IndigenousStatusDto> {
    this.log.debug('Get all inidigenous statuses');
    const indigenousStatusEntities = this.DemographicSurveyRepository.listAllIndigenousStatuses();
    const indigenousStatusDtos = this.DemographicSurveyDtoMapper.mapIndigenousStatusEntitiesToIndigenousStatusDtos(indigenousStatusEntities);
    this.log.trace('Returning inidigenous statuses: [%j]', indigenousStatusDtos);
    return indigenousStatusDtos;
  }

  private getIndigenousStatusByIdImpl(id: string): IndigenousStatusDto {
    this.log.debug('Get inidigenous status with id: [%s]', id);
    const indigenousStatusEntity = this.DemographicSurveyRepository.findIndigenousStatusById(id);

    if (!indigenousStatusEntity) {
      this.log.error('inidigenous status with id: [%s] not found', id);
      throw new IndigenousStatusNotFoundException(`inidigenous status with id: [${id}] not found`);
    }

    const indigenousStatusDto = this.DemographicSurveyDtoMapper.mapIndigenousStatusEntityToIndigenousStatusDto(indigenousStatusEntity);
    this.log.trace('Returning inidigenous status: [%j]', indigenousStatusDto);
    return indigenousStatusDto;
  }

  // Disability status
  listDisabilityStatuses = moize(this.listDisabilityStatusesImpl, {
    onCacheAdd: () => this.log.info('Creating new listDisabilityStatuses memo'),
  });

  getDisabilityStatusById = moize(this.getDisabilityStatusByIdImpl, {
    maxSize: Infinity,
    onCacheAdd: () => this.log.info('Creating new getDisabilityStatusById memo'),
  });

  listLocalizedDisabilityStatuses(locale: AppLocale): ReadonlyArray<DisabilityStatusLocalizedDto> {
    this.log.debug('Get all localized disability statuses with locale: [%s]', locale);
    const disabilityStatusDtos = this.listDisabilityStatuses();
    const localizedDisabilityStatusDtos = this.DemographicSurveyDtoMapper.mapDisabilityStatusDtosToDisabilityStatusLocalizedDtos(disabilityStatusDtos, locale);
    this.log.trace('Returning localized disability statuses: [%j]', localizedDisabilityStatusDtos);
    return localizedDisabilityStatusDtos;
  }

  getLocalizedDisabilityStatusById(id: string, locale: AppLocale): DisabilityStatusLocalizedDto {
    this.log.debug('Get localized disability status with id: [%s] and locale: [%s]', id, locale);
    const disabilityStatusDto = this.getDisabilityStatusById(id);
    const localizedDisabilityStatusDto = this.DemographicSurveyDtoMapper.mapDisabilityStatusDtoToDisabilityStatusLocalizedDto(disabilityStatusDto, locale);
    this.log.trace('Returning localized disability status: [%j]', localizedDisabilityStatusDto);
    return localizedDisabilityStatusDto;
  }

  private listDisabilityStatusesImpl(): ReadonlyArray<DisabilityStatusDto> {
    this.log.debug('Get all disability statuses');
    const disabilityStatusEntities = this.DemographicSurveyRepository.listAllDisabilityStatuses();
    const disabilityStatusDtos = this.DemographicSurveyDtoMapper.mapDisabilityStatusEntitiesToDisabilityStatusDtos(disabilityStatusEntities);
    this.log.trace('Returning disability statuses: [%j]', disabilityStatusDtos);
    return disabilityStatusDtos;
  }

  private getDisabilityStatusByIdImpl(id: string): DisabilityStatusDto {
    this.log.debug('Get disability status with id: [%s]', id);
    const disabilityStatusEntity = this.DemographicSurveyRepository.findDisabilityStatusById(id);

    if (!disabilityStatusEntity) {
      this.log.error('disability status with id: [%s] not found', id);
      throw new DisabilityStatusNotFoundException(`disability status with id: [${id}] not found`);
    }

    const disabilityStatusDto = this.DemographicSurveyDtoMapper.mapDisabilityStatusEntityToDisabilityStatusDto(disabilityStatusEntity);
    this.log.trace('Returning disability status: [%j]', disabilityStatusDto);
    return disabilityStatusDto;
  }

  // Ethnic group
  listEthnicGroups = moize(this.listEthnicGroupsImpl, {
    onCacheAdd: () => this.log.info('Creating new listEthnicGroups memo'),
  });

  getEthnicGroupById = moize(this.getEthnicGroupByIdImpl, {
    maxSize: Infinity,
    onCacheAdd: () => this.log.info('Creating new getEthnicGroupById memo'),
  });

  listLocalizedEthnicGroups(locale: AppLocale): ReadonlyArray<EthnicGroupLocalizedDto> {
    this.log.debug('Get all localized ethnic groups with locale: [%s]', locale);
    const ethnicGroupDtos = this.listEthnicGroups();
    const localizedEthnicGroupDtos = this.DemographicSurveyDtoMapper.mapEthnicGroupDtosToEthnicGroupLocalizedDtos(ethnicGroupDtos, locale);
    this.log.trace('Returning localized ethnic groups: [%j]', localizedEthnicGroupDtos);
    return localizedEthnicGroupDtos;
  }

  getLocalizedEthnicGroupById(id: string, locale: AppLocale): EthnicGroupLocalizedDto {
    this.log.debug('Get localized ethnic group with id: [%s] and locale: [%s]', id, locale);
    const ethnicGroupDto = this.getEthnicGroupById(id);
    const localizedEthnicGroupDto = this.DemographicSurveyDtoMapper.mapEthnicGroupDtoToEthnicGroupLocalizedDto(ethnicGroupDto, locale);
    this.log.trace('Returning localized ethnic group: [%j]', localizedEthnicGroupDto);
    return localizedEthnicGroupDto;
  }

  private listEthnicGroupsImpl(): ReadonlyArray<EthnicGroupDto> {
    this.log.debug('Get all ethnic groups');
    const ethnicGroupEntities = this.DemographicSurveyRepository.listAllEthnicGroups();
    const ethnicGroupDtos = this.DemographicSurveyDtoMapper.mapEthnicGroupEntitiesToEthnicGroupDtos(ethnicGroupEntities);
    this.log.trace('Returning ethnic groups: [%j]', ethnicGroupDtos);
    return ethnicGroupDtos;
  }

  private getEthnicGroupByIdImpl(id: string): EthnicGroupDto {
    this.log.debug('Get ethnic group with id: [%s]', id);
    const ethnicGroupEntity = this.DemographicSurveyRepository.findEthnicGroupById(id);

    if (!ethnicGroupEntity) {
      this.log.error('ethnic group with id: [%s] not found', id);
      throw new EthnicGroupNotFoundException(`ethnic group with id: [${id}] not found`);
    }

    const ethnicGroupDto = this.DemographicSurveyDtoMapper.mapEthnicGroupEntityToEthnicGroupDto(ethnicGroupEntity);
    this.log.trace('Returning ethnic group: [%j]', ethnicGroupDto);
    return ethnicGroupDto;
  }

  // Location born status
  listLocationBornStatuses = moize(this.listLocationBornStatusesImpl, {
    onCacheAdd: () => this.log.info('Creating new listLocationBornStatuses memo'),
  });

  getLocationBornStatusById = moize(this.getLocationBornStatusByIdImpl, {
    maxSize: Infinity,
    onCacheAdd: () => this.log.info('Creating new getLocationBornStatusById memo'),
  });

  listLocalizedLocationBornStatuses(locale: AppLocale): ReadonlyArray<LocationBornStatusLocalizedDto> {
    this.log.debug('Get all localized location born statuses with locale: [%s]', locale);
    const locationBornStatusDtos = this.listLocationBornStatuses();
    const localizedLocationBornStatusDtos = this.DemographicSurveyDtoMapper.mapLocationBornStatusDtosToLocationBornStatusLocalizedDtos(locationBornStatusDtos, locale);
    this.log.trace('Returning localized location born statuses: [%j]', localizedLocationBornStatusDtos);
    return localizedLocationBornStatusDtos;
  }

  getLocalizedLocationBornStatusById(id: string, locale: AppLocale): LocationBornStatusLocalizedDto {
    this.log.debug('Get localized location born status with id: [%s] and locale: [%s]', id, locale);
    const locationBornStatusDto = this.getLocationBornStatusById(id);
    const localizedLocationBornStatusDto = this.DemographicSurveyDtoMapper.mapLocationBornStatusDtoToLocationBornStatusLocalizedDto(locationBornStatusDto, locale);
    this.log.trace('Returning localized location born status: [%j]', localizedLocationBornStatusDto);
    return localizedLocationBornStatusDto;
  }

  private listLocationBornStatusesImpl(): ReadonlyArray<LocationBornStatusDto> {
    this.log.debug('Get all location born statuses');
    const locationBornStatusEntities = this.DemographicSurveyRepository.listAllLocationBornStatuses();
    const locationBornStatusDtos = this.DemographicSurveyDtoMapper.mapLocationBornStatusEntitiesToLocationBornStatusDtos(locationBornStatusEntities);
    this.log.trace('Returning location born statuses: [%j]', locationBornStatusDtos);
    return locationBornStatusDtos;
  }

  private getLocationBornStatusByIdImpl(id: string): LocationBornStatusDto {
    this.log.debug('Get location born status with id: [%s]', id);
    const locationBornStatusEntity = this.DemographicSurveyRepository.findLocationBornStatusById(id);

    if (!locationBornStatusEntity) {
      this.log.error('location born status with id: [%s] not found', id);
      throw new LocationBornStatusNotFoundException(`location born status with id: [${id}] not found`);
    }

    const locationBornStatusDto = this.DemographicSurveyDtoMapper.mapLocationBornStatusEntityToLocationBornStatusDto(locationBornStatusEntity);
    this.log.trace('Returning location born status: [%j]', locationBornStatusDto);
    return locationBornStatusDto;
  }

  // Gender status
  listGenderStatuses = moize(this.listGenderStatusesImpl, {
    onCacheAdd: () => this.log.info('Creating new listGenderStatuses memo'),
  });

  getGenderStatusById = moize(this.getGenderStatusByIdImpl, {
    maxSize: Infinity,
    onCacheAdd: () => this.log.info('Creating new getGenderStatusById memo'),
  });

  listLocalizedGenderStatuses(locale: AppLocale): ReadonlyArray<GenderStatusLocalizedDto> {
    this.log.debug('Get all localized gender statuses with locale: [%s]', locale);
    const genderStatusDtos = this.listGenderStatuses();
    const localizedGenderStatusDtos = this.DemographicSurveyDtoMapper.mapGenderStatusDtosToGenderStatusLocalizedDtos(genderStatusDtos, locale);
    this.log.trace('Returning localized gender statuses: [%j]', localizedGenderStatusDtos);
    return localizedGenderStatusDtos;
  }

  getLocalizedGenderStatusById(id: string, locale: AppLocale): GenderStatusLocalizedDto {
    this.log.debug('Get localized gender status with id: [%s] and locale: [%s]', id, locale);
    const genderStatusDto = this.getGenderStatusById(id);
    const localizedGenderStatusDto = this.DemographicSurveyDtoMapper.mapGenderStatusDtoToGenderStatusLocalizedDto(genderStatusDto, locale);
    this.log.trace('Returning localized gender status: [%j]', localizedGenderStatusDto);
    return localizedGenderStatusDto;
  }

  private listGenderStatusesImpl(): ReadonlyArray<GenderStatusDto> {
    this.log.debug('Get all gender statuses');
    const genderStatusEntities = this.DemographicSurveyRepository.listAllGenderStatuses();
    const genderStatusDtos = this.DemographicSurveyDtoMapper.mapGenderStatusEntitiesToGenderStatusDtos(genderStatusEntities);
    this.log.trace('Returning gender statuses: [%j]', genderStatusDtos);
    return genderStatusDtos;
  }

  private getGenderStatusByIdImpl(id: string): GenderStatusDto {
    this.log.debug('Get gender status with id: [%s]', id);
    const genderStatusEntity = this.DemographicSurveyRepository.findGenderStatusById(id);

    if (!genderStatusEntity) {
      this.log.error('gender status with id: [%s] not found', id);
      throw new GenderStatusNotFoundException(`gender status with id: [${id}] not found`);
    }

    const genderStatusDto = this.DemographicSurveyDtoMapper.mapGenderStatusEntityToGenderStatusDto(genderStatusEntity);
    this.log.trace('Returning gender status: [%j]', genderStatusDto);
    return genderStatusDto;
  }
}
