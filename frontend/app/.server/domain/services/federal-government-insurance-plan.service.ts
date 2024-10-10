import { inject, injectable } from 'inversify';
import moize from 'moize';

import type { ServerConfig } from '~/.server/configs';
import { SERVICE_IDENTIFIER } from '~/.server/constants';
import type { FederalGovernmentInsurancePlanDto, FederalGovernmentInsurancePlanLocalizedDto } from '~/.server/domain/dtos';
import { FederalGovernmentInsurancePlanNotFoundException } from '~/.server/domain/exceptions';
import type { FederalGovernmentInsurancePlanDtoMapper } from '~/.server/domain/mappers';
import type { FederalGovernmentInsurancePlanRepository } from '~/.server/domain/repositories';
import type { LogFactory, Logger } from '~/.server/factories';

/**
 * Service interface for managing federal government insurance plan data.
 */
export interface FederalGovernmentInsurancePlanService {
  /**
   * Retrieves a specific federal government insurance plan by its ID.
   *
   * @param id - The ID of the federal government insurance plan to retrieve.
   * @returns The FederalGovernmentInsurancePlan DTO corresponding to the specified ID.
   * @throws {FederalGovernmentInsurancePlanNotFoundException} If no federal government insurance plan is found with the specified ID
   */
  getFederalGovernmentInsurancePlanById(id: string): FederalGovernmentInsurancePlanDto;

  /**
   * Retrieves a list of all federal government insurance plans.
   *
   * @returns An array of FederalGovernmentInsurancePlan DTOs.
   */
  listFederalGovernmentInsurancePlans(): ReadonlyArray<FederalGovernmentInsurancePlanDto>;

  /**
   * Retrieves a specific federal government insurance plan by its ID in the specified locale.
   *
   * @param id - The ID of the federal government insurance plan to retrieve.
   * @param locale - The desired locale (e.g., 'en' or 'fr').
   * @returns The FederalGovernmentInsurancePlan DTO corresponding to the specified ID in the given locale.
   * @throws {FederalGovernmentInsurancePlanNotFoundException} If no federal government insurance plan is found with the specified ID
   */
  getLocalizedFederalGovernmentInsurancePlanById(id: string, locale: AppLocale): FederalGovernmentInsurancePlanLocalizedDto;

  /**
   * Retrieves a list of all federal government insurance plans, sorted by name in the specified locale.
   *
   * @param locale - The desired locale (e.g., 'en' or 'fr').
   * @returns An array of FederalGovernmentInsurancePlanLocalized DTOs, sorted by name in the given locale.
   */
  listAndSortLocalizedFederalGovernmentInsurancePlans(locale: AppLocale): ReadonlyArray<FederalGovernmentInsurancePlanLocalizedDto>;
}

@injectable()
export class FederalGovernmentInsurancePlanServiceImpl implements FederalGovernmentInsurancePlanService {
  private readonly log: Logger;

  constructor(
    @inject(SERVICE_IDENTIFIER.LOG_FACTORY) logFactory: LogFactory,
    @inject(SERVICE_IDENTIFIER.FEDERAL_GOVERNMENT_INSURANCE_PLAN_DTO_MAPPER) private readonly federalGovernmentInsurancePlanDtoMapper: FederalGovernmentInsurancePlanDtoMapper,
    @inject(SERVICE_IDENTIFIER.FEDERAL_GOVERNMENT_INSURANCE_PLAN_REPOSITORY) private readonly federalGovernmentInsurancePlanRepository: FederalGovernmentInsurancePlanRepository,
    @inject(SERVICE_IDENTIFIER.SERVER_CONFIG) private readonly serverConfig: Pick<ServerConfig, 'LOOKUP_SVC_ALL_FEDERAL_GOVERNMENT_INSURANCE_PLANS_CACHE_TTL_SECONDS' | 'LOOKUP_SVC_FEDERAL_GOVERNMENT_INSURANCE_PLAN_CACHE_TTL_SECONDS'>,
  ) {
    this.log = logFactory.createLogger('FederalGovernmentInsurancePlanServiceImpl');

    // set moize options
    this.listFederalGovernmentInsurancePlans.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_ALL_FEDERAL_GOVERNMENT_INSURANCE_PLANS_CACHE_TTL_SECONDS;
    this.getFederalGovernmentInsurancePlanById.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_FEDERAL_GOVERNMENT_INSURANCE_PLAN_CACHE_TTL_SECONDS;
  }

  listFederalGovernmentInsurancePlans = moize(this.listFederalGovernmentInsurancePlansImpl, {
    onCacheAdd: () => this.log.info('Creating new listFederalGovernmentInsurancePlans memo'),
  });

  getFederalGovernmentInsurancePlanById = moize(this.getFederalGovernmentInsurancePlanByIdImpl, {
    maxSize: Infinity,
    onCacheAdd: () => this.log.info('Creating new getFederalGovernmentInsurancePlanById memo'),
  });

  private listFederalGovernmentInsurancePlansImpl(): ReadonlyArray<FederalGovernmentInsurancePlanDto> {
    this.log.debug('Get all federal government insurance plans');
    const federalGovernmentInsurancePlanEntities = this.federalGovernmentInsurancePlanRepository.listAllFederalGovernmentInsurancePlans();
    const federalGovernmentInsurancePlanDtos = this.federalGovernmentInsurancePlanDtoMapper.mapFederalGovernmentInsurancePlanEntitiesToFederalGovernmentInsurancePlanDtos(federalGovernmentInsurancePlanEntities);
    this.log.trace('Returning federal government insurance plans: [%j]', federalGovernmentInsurancePlanDtos);
    return federalGovernmentInsurancePlanDtos;
  }

  private getFederalGovernmentInsurancePlanByIdImpl(id: string): FederalGovernmentInsurancePlanDto {
    this.log.debug('Get federal government insurance plan with id: [%s]', id);
    const federalGovernmentInsurancePlanEntity = this.federalGovernmentInsurancePlanRepository.findFederalGovernmentInsurancePlanById(id);

    if (!federalGovernmentInsurancePlanEntity) {
      this.log.error('Federal government insurance plan with id: [%s] not found', id);
      throw new FederalGovernmentInsurancePlanNotFoundException(`Federal government insurance plan with id: [${id}] not found`);
    }

    const federalGovernmentInsurancePlanDto = this.federalGovernmentInsurancePlanDtoMapper.mapFederalGovernmentInsurancePlanEntityToFederalGovernmentInsurancePlanDto(federalGovernmentInsurancePlanEntity);
    this.log.trace('Returning federal government insurance plan: [%j]', federalGovernmentInsurancePlanDto);
    return federalGovernmentInsurancePlanDto;
  }

  listAndSortLocalizedFederalGovernmentInsurancePlans(locale: AppLocale): ReadonlyArray<FederalGovernmentInsurancePlanLocalizedDto> {
    this.log.debug('Get and sort all localized federal government insurance plans');
    const federalGovernmentInsurancePlanDtos = this.listFederalGovernmentInsurancePlans();
    const federalGovernmentInsurancePlanLocalizedDtos = this.federalGovernmentInsurancePlanDtoMapper.mapFederalGovernmentInsurancePlanDtosToFederalGovernmentInsurancePlanLocalizedDtos(federalGovernmentInsurancePlanDtos, locale);
    const sortedFederalGovernmentInsurancePlanLocalizedDtos = this.sortFederalGovernmentInsurancePlanLocalizedDtos(federalGovernmentInsurancePlanLocalizedDtos, locale);
    this.log.trace('Returning localized and sorted federal government insurance plans: [%j]', sortedFederalGovernmentInsurancePlanLocalizedDtos);
    return sortedFederalGovernmentInsurancePlanLocalizedDtos;
  }

  getLocalizedFederalGovernmentInsurancePlanById(id: string, locale: AppLocale): FederalGovernmentInsurancePlanLocalizedDto {
    this.log.debug('Get localized federal government insurance plan with id: [%s]', id);
    const federalGovernmentInsurancePlanDto = this.getFederalGovernmentInsurancePlanById(id);
    const federalGovernmentInsurancePlanLocalizedDto = this.federalGovernmentInsurancePlanDtoMapper.mapFederalGovernmentInsurancePlanDtoToFederalGovernmentInsurancePlanLocalizedDto(federalGovernmentInsurancePlanDto, locale);
    this.log.trace('Returning localized federal government insurance plan: [%j]', federalGovernmentInsurancePlanLocalizedDto);
    return federalGovernmentInsurancePlanLocalizedDto;
  }

  private sortFederalGovernmentInsurancePlanLocalizedDtos(federalGovernmentInsurancePlanLocalizedDtos: ReadonlyArray<FederalGovernmentInsurancePlanLocalizedDto>, locale: AppLocale): ReadonlyArray<FederalGovernmentInsurancePlanLocalizedDto> {
    const sortByNamePredicate = (a: FederalGovernmentInsurancePlanLocalizedDto, b: FederalGovernmentInsurancePlanLocalizedDto) => a.name.localeCompare(b.name, locale);
    return federalGovernmentInsurancePlanLocalizedDtos.toSorted(sortByNamePredicate);
  }
}
