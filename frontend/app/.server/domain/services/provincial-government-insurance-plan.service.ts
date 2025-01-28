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
export class DefaultProvincialGovernmentInsurancePlanService implements ProvincialGovernmentInsurancePlanService {
  private readonly log: Logger;
  private readonly provincialGovernmentInsurancePlanDtoMapper: ProvincialGovernmentInsurancePlanDtoMapper;
  private readonly provincialGovernmentInsurancePlanRepository: ProvincialGovernmentInsurancePlanRepository;
  private readonly serverConfig: Pick<ServerConfig, 'LOOKUP_SVC_ALL_PROVINCIAL_GOVERNMENT_INSURANCE_PLANS_CACHE_TTL_SECONDS' | 'LOOKUP_SVC_PROVINCIAL_GOVERNMENT_INSURANCE_PLAN_CACHE_TTL_SECONDS'>;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.domain.mappers.ProvincialGovernmentInsurancePlanDtoMapper) provincialGovernmentInsurancePlanDtoMapper: ProvincialGovernmentInsurancePlanDtoMapper,
    @inject(TYPES.domain.repositories.ProvincialGovernmentInsurancePlanRepository) provincialGovernmentInsurancePlanRepository: ProvincialGovernmentInsurancePlanRepository,
    @inject(TYPES.configs.ServerConfig) serverConfig: Pick<ServerConfig, 'LOOKUP_SVC_ALL_PROVINCIAL_GOVERNMENT_INSURANCE_PLANS_CACHE_TTL_SECONDS' | 'LOOKUP_SVC_PROVINCIAL_GOVERNMENT_INSURANCE_PLAN_CACHE_TTL_SECONDS'>,
  ) {
    this.log = logFactory.createLogger('DefaultProvincialGovernmentInsurancePlanService');
    this.provincialGovernmentInsurancePlanDtoMapper = provincialGovernmentInsurancePlanDtoMapper;
    this.provincialGovernmentInsurancePlanRepository = provincialGovernmentInsurancePlanRepository;
    this.serverConfig = serverConfig;
    this.init();
  }

  private init(): void {
    const allProvincialGovernmentInsurancePlansCacheTTL = 1000 * this.serverConfig.LOOKUP_SVC_ALL_PROVINCIAL_GOVERNMENT_INSURANCE_PLANS_CACHE_TTL_SECONDS;
    const provincialGovernmentInsurancePlanCacheTTL = 1000 * this.serverConfig.LOOKUP_SVC_PROVINCIAL_GOVERNMENT_INSURANCE_PLAN_CACHE_TTL_SECONDS;

    this.log.debug('Cache TTL values; allProvincialGovernmentInsurancePlansCacheTTL: %d ms, provincialGovernmentInsurancePlanCacheTTL: %d ms', allProvincialGovernmentInsurancePlansCacheTTL, provincialGovernmentInsurancePlanCacheTTL);

    this.listProvincialGovernmentInsurancePlans = moize(this.listProvincialGovernmentInsurancePlans, {
      maxAge: allProvincialGovernmentInsurancePlansCacheTTL,
      onCacheAdd: () => this.log.info('Creating new listProvincialGovernmentInsurancePlans memo'),
    });

    this.getProvincialGovernmentInsurancePlanById = moize(this.getProvincialGovernmentInsurancePlanById, {
      maxAge: provincialGovernmentInsurancePlanCacheTTL,
      maxSize: Infinity,
      onCacheAdd: () => this.log.info('Creating new getProvincialGovernmentInsurancePlanById memo'),
    });

    this.log.debug('DefaultProvincialGovernmentInsurancePlanService initiated.');
  }

  listProvincialGovernmentInsurancePlans(): ReadonlyArray<ProvincialGovernmentInsurancePlanDto> {
    this.log.debug('Get all provincial government insurance plans');
    const provincialGovernmentInsurancePlanEntities = this.provincialGovernmentInsurancePlanRepository.listAllProvincialGovernmentInsurancePlans();
    const provincialGovernmentInsurancePlanDtos = this.provincialGovernmentInsurancePlanDtoMapper.mapProvincialGovernmentInsurancePlanEntitiesToProvincialGovernmentInsurancePlanDtos(provincialGovernmentInsurancePlanEntities);
    this.log.trace('Returning provincial government insurance plans: [%j]', provincialGovernmentInsurancePlanDtos);
    return provincialGovernmentInsurancePlanDtos;
  }

  getProvincialGovernmentInsurancePlanById(id: string): ProvincialGovernmentInsurancePlanDto {
    this.log.debug('Get provincial government insurance plan with id: [%s]', id);
    const provincialGovernmentInsurancePlanEntity = this.provincialGovernmentInsurancePlanRepository.findProvincialGovernmentInsurancePlanById(id);

    if (!provincialGovernmentInsurancePlanEntity) throw new ProvincialGovernmentInsurancePlanNotFoundException(`Provincial government insurance plan with id: [${id}] not found`);

    const provincialGovernmentInsurancePlanDto = this.provincialGovernmentInsurancePlanDtoMapper.mapProvincialGovernmentInsurancePlanEntityToProvincialGovernmentInsurancePlanDto(provincialGovernmentInsurancePlanEntity);
    this.log.trace('Returning provincial government insurance plan: [%j]', provincialGovernmentInsurancePlanDto);
    return provincialGovernmentInsurancePlanDto;
  }

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

  private sortLocalizedProvincialGovernmentInsurancePlanDtos(provincialGovernmentInsurancePlanLocalizedDtos: ReadonlyArray<ProvincialGovernmentInsurancePlanLocalizedDto>, locale: AppLocale): ReadonlyArray<ProvincialGovernmentInsurancePlanLocalizedDto> {
    const sortByNamePredicate = (a: ProvincialGovernmentInsurancePlanLocalizedDto, b: ProvincialGovernmentInsurancePlanLocalizedDto) => a.name.localeCompare(b.name, locale);
    return provincialGovernmentInsurancePlanLocalizedDtos.toSorted(sortByNamePredicate);
  }
}
