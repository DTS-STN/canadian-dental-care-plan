import { inject, injectable } from 'inversify';
import moize from 'moize';

import { FederalGovernmentInsurancePlanNotFoundException } from '../exceptions/FederalGovernmentInsurancePlanNotFoundException';
import type { ServerConfig } from '~/.server/configs';
import { SERVICE_IDENTIFIER } from '~/.server/constants';
import type { FederalGovernmentInsurancePlanDto } from '~/.server/domain/dtos';
import type { FederalGovernmentInsurancePlanDtoMapper } from '~/.server/domain/mappers';
import type { FederalGovernmentInsurancePlanRepository } from '~/.server/domain/repositories';
import type { LogFactory, Logger } from '~/.server/factories';

export interface FederalGovernmentInsurancePlanService {
  listFederalGovernmentInsurancePlans(): FederalGovernmentInsurancePlanDto[];
  getFederalGovernmentInsurancePlanById(id: string): FederalGovernmentInsurancePlanDto;
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

  private listFederalGovernmentInsurancePlansImpl(): FederalGovernmentInsurancePlanDto[] {
    this.log.debug('Get all federal government insurance plans');
    const federalGovernmentInsurancePlanEntities = this.federalGovernmentInsurancePlanRepository.findAll();
    const federalGovernmentInsurancePlanDtos = this.federalGovernmentInsurancePlanDtoMapper.mapFederalGovernmentInsurancePlanEntitiesToFederalGovernmentInsurancePlanDtos(federalGovernmentInsurancePlanEntities);
    this.log.trace('Returning federal government insurance plans: [%j]', federalGovernmentInsurancePlanDtos);
    return federalGovernmentInsurancePlanDtos;
  }

  listFederalGovernmentInsurancePlans = moize(this.listFederalGovernmentInsurancePlansImpl, {
    onCacheAdd: () => this.log.info('Creating new findAll memo'),
  });

  private getFederalGovernmentInsurancePlanByIdImpl(id: string): FederalGovernmentInsurancePlanDto {
    this.log.debug('Get federal government insurance plan with id: [%s]', id);
    const federalGovernmentInsurancePlanEntity = this.federalGovernmentInsurancePlanRepository.findById(id);

    if (!federalGovernmentInsurancePlanEntity) {
      this.log.error('Federal government insurance plan with id: [%s] not found', id);
      throw new FederalGovernmentInsurancePlanNotFoundException(`Federal government insurance plan with id: [${id}] not found`);
    }

    const federalGovernmentInsurancePlanDto = this.federalGovernmentInsurancePlanDtoMapper.mapFederalGovernmentInsurancePlanEntityToFederalGovernmentInsurancePlanDto(federalGovernmentInsurancePlanEntity);
    this.log.trace('Returning federal government insurance plan: [%j]', federalGovernmentInsurancePlanDto);
    return federalGovernmentInsurancePlanDto;
  }

  getFederalGovernmentInsurancePlanById = moize(this.getFederalGovernmentInsurancePlanByIdImpl, {
    maxSize: Infinity,
    onCacheAdd: () => this.log.info('Creating new findById memo'),
  });
}
