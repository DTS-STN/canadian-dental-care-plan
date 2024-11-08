import { inject, injectable } from 'inversify';
import moize from 'moize';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { ProvincialGovernmentInsurancePlanDto, ProvincialGovernmentInsurancePlanLocalizedDto } from '~/.server/domain/dtos';
import { ProvincialGovernmentInsurancePlanNotFoundException } from '~/.server/domain/exceptions';
import type { ProvincialGovernmentInsurancePlanDtoMapper } from '~/.server/domain/mappers';
import type { ProvincialGovernmentInsurancePlanRepository } from '~/.server/domain/repositories';
import type { LogFactory, Logger } from '~/.server/factories';

export interface ProvincialGovernmentInsurancePlanService {
  listProvincialGovernmentInsurancePlans(): ReadonlyArray<ProvincialGovernmentInsurancePlanDto>;
  getProvincialGovernmentInsurancePlanById(id: string): ProvincialGovernmentInsurancePlanDto;
  listAndSortLocalizedProvincialGovernmentInsurancePlans(locale: AppLocale): ReadonlyArray<ProvincialGovernmentInsurancePlanLocalizedDto>;
  getLocalizedProvincialGovernmentInsurancePlanById(id: string, locale: AppLocale): ProvincialGovernmentInsurancePlanLocalizedDto;
}

@injectable()
export class ProvincialGovernmentInsurancePlanServiceImpl implements ProvincialGovernmentInsurancePlanService {
  private readonly log: Logger;

  constructor(
    @inject(TYPES.LogFactory) logFactory: LogFactory,
    @inject(TYPES.ProvincialGovernmentInsurancePlanDtoMapper) private readonly provincialGovernmentInsurancePlanDtoMapper: ProvincialGovernmentInsurancePlanDtoMapper,
    @inject(TYPES.ProvincialGovernmentInsurancePlanRepository) private readonly provincialGovernmentInsurancePlanRepository: ProvincialGovernmentInsurancePlanRepository,
    @inject(TYPES.ServerConfig) private readonly serverConfig: Pick<ServerConfig, 'LOOKUP_SVC_ALL_PROVINCIAL_GOVERNMENT_INSURANCE_PLANS_CACHE_TTL_SECONDS' | 'LOOKUP_SVC_PROVINCIAL_GOVERNMENT_INSURANCE_PLAN_CACHE_TTL_SECONDS'>,
  ) {
    this.log = logFactory.createLogger('ProvincialGovernmentInsurancePlanServiceImpl');

    // set moize options
    this.listProvincialGovernmentInsurancePlans.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_ALL_PROVINCIAL_GOVERNMENT_INSURANCE_PLANS_CACHE_TTL_SECONDS;
    this.getProvincialGovernmentInsurancePlanById.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_PROVINCIAL_GOVERNMENT_INSURANCE_PLAN_CACHE_TTL_SECONDS;
  }

  listProvincialGovernmentInsurancePlans = moize(this.listProvincialGovernmentInsurancePlansImpl, {
    onCacheAdd: () => this.log.info('Creating new listProvincialGovernmentInsurancePlans memo'),
  });

  getProvincialGovernmentInsurancePlanById = moize(this.getProvincialGovernmentInsurancePlanByIdImpl, {
    maxSize: Infinity,
    onCacheAdd: () => this.log.info('Creating new getProvincialGovernmentInsurancePlanById memo'),
  });

  listAndSortLocalizedProvincialGovernmentInsurancePlans(locale: AppLocale): ReadonlyArray<ProvincialGovernmentInsurancePlanLocalizedDto> {
    this.log.debug('Get and sort all localized provincial government insurance plans');
    const provincialGovernmentInsurancePlanDtos = this.listProvincialGovernmentInsurancePlans();
    const provincialGovernmentInsurancePlanLocalizedDtos = this.provincialGovernmentInsurancePlanDtoMapper.mapProvincialGovernmentInsurancePlanDtosToProvincialGovernmentInsurancePlanLocalizedDtos(provincialGovernmentInsurancePlanDtos, locale);
    const sortedProvincialGovernmentInsurancePlanLocalizedDtos = this.sortLocalizedProvincialGovernmentInsurancePlanDtos(provincialGovernmentInsurancePlanLocalizedDtos, locale);
    this.log.trace('Returning localized and sorted provincial government insurance plans: [%j]', sortedProvincialGovernmentInsurancePlanLocalizedDtos);
    return sortedProvincialGovernmentInsurancePlanLocalizedDtos;
  }

  getLocalizedProvincialGovernmentInsurancePlanById(id: string, locale: AppLocale): ProvincialGovernmentInsurancePlanLocalizedDto {
    this.log.debug('Get localized provincial government insurance plan with id: [%s]', id);
    const provincialGovernmentInsurancePlanDto = this.getProvincialGovernmentInsurancePlanById(id);
    const provincialGovernmentInsurancePlanLocalizedDto = this.provincialGovernmentInsurancePlanDtoMapper.mapProvincialGovernmentInsurancePlanDtoToProvincialGovernmentInsurancePlanLocalizedDto(provincialGovernmentInsurancePlanDto, locale);
    this.log.trace('Returning localized provincial government insurance plan: [%j]', provincialGovernmentInsurancePlanLocalizedDto);
    return provincialGovernmentInsurancePlanLocalizedDto;
  }

  private listProvincialGovernmentInsurancePlansImpl(): ReadonlyArray<ProvincialGovernmentInsurancePlanDto> {
    this.log.debug('Get all provincial government insurance plans');
    const provincialGovernmentInsurancePlanEntities = this.provincialGovernmentInsurancePlanRepository.listAllProvincialGovernmentInsurancePlans();
    const provincialGovernmentInsurancePlanDtos = this.provincialGovernmentInsurancePlanDtoMapper.mapProvincialGovernmentInsurancePlanEntitiesToProvincialGovernmentInsurancePlanDtos(provincialGovernmentInsurancePlanEntities);
    this.log.trace('Returning provincial government insurance plans: [%j]', provincialGovernmentInsurancePlanDtos);
    return provincialGovernmentInsurancePlanDtos;
  }

  private getProvincialGovernmentInsurancePlanByIdImpl(id: string): ProvincialGovernmentInsurancePlanDto {
    this.log.debug('Get provincial government insurance plan with id: [%s]', id);
    const provincialGovernmentInsurancePlanEntity = this.provincialGovernmentInsurancePlanRepository.findProvincialGovernmentInsurancePlanById(id);

    if (!provincialGovernmentInsurancePlanEntity) throw new ProvincialGovernmentInsurancePlanNotFoundException(`Provincial government insurance plan with id: [${id}] not found`);

    const provincialGovernmentInsurancePlanDto = this.provincialGovernmentInsurancePlanDtoMapper.mapProvincialGovernmentInsurancePlanEntityToProvincialGovernmentInsurancePlanDto(provincialGovernmentInsurancePlanEntity);
    this.log.trace('Returning provincial government insurance plan: [%j]', provincialGovernmentInsurancePlanDto);
    return provincialGovernmentInsurancePlanDto;
  }

  private sortLocalizedProvincialGovernmentInsurancePlanDtos(provincialGovernmentInsurancePlanLocalizedDtos: ReadonlyArray<ProvincialGovernmentInsurancePlanLocalizedDto>, locale: AppLocale): ReadonlyArray<ProvincialGovernmentInsurancePlanLocalizedDto> {
    const sortByNamePredicate = (a: ProvincialGovernmentInsurancePlanLocalizedDto, b: ProvincialGovernmentInsurancePlanLocalizedDto) => a.name.localeCompare(b.name, locale);
    return provincialGovernmentInsurancePlanLocalizedDtos.toSorted(sortByNamePredicate);
  }
}
