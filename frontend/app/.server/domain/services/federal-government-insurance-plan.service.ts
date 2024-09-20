import { inject, injectable } from 'inversify';
import moize from 'moize';

import type { ServerConfig } from '~/.server/configs/server.config';
import { SERVICE_IDENTIFIER } from '~/.server/constants/service-identifier.contant';
import type { FederalGovernmentInsurancePlanDto } from '~/.server/domain/dtos';
import type { FederalGovernmentInsurancePlanDtoMapper } from '~/.server/domain/mappers';
import type { FederalGovernmentInsurancePlanRepository } from '~/.server/domain/repositories/federal-government-insurance-plan.repository';
import type { LogFactory, Logger } from '~/.server/factories/log.factory';

export interface FederalGovernmentInsurancePlanService {
  findAll(): FederalGovernmentInsurancePlanDto[];
  findById(id: string): FederalGovernmentInsurancePlanDto | null;
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
    this.findAll.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_ALL_FEDERAL_GOVERNMENT_INSURANCE_PLANS_CACHE_TTL_SECONDS;
    this.findById.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_FEDERAL_GOVERNMENT_INSURANCE_PLAN_CACHE_TTL_SECONDS;
  }

  private findAllImpl(): FederalGovernmentInsurancePlanDto[] {
    this.log.debug('Get all federal government insurance plans');
    const federalGovernmentInsurancePlanEntities = this.federalGovernmentInsurancePlanRepository.findAll();
    const federalGovernmentInsurancePlanDtos = this.federalGovernmentInsurancePlanDtoMapper.mapFederalGovernmentInsurancePlanEntitiesToFederalGovernmentInsurancePlanDtos(federalGovernmentInsurancePlanEntities);
    this.log.trace('Returning federal government insurance plans: [%j]', federalGovernmentInsurancePlanDtos);
    return federalGovernmentInsurancePlanDtos;
  }

  findAll = moize(this.findAllImpl, {
    onCacheAdd: () => this.log.info('Creating new findAll memo'),
  });

  private findByIdImpl(id: string): FederalGovernmentInsurancePlanDto | null {
    this.log.debug('Get federal government insurance plan with id: [%s]', id);
    const federalGovernmentInsurancePlanEntity = this.federalGovernmentInsurancePlanRepository.findById(id);
    const federalGovernmentInsurancePlanDto = federalGovernmentInsurancePlanEntity ? this.federalGovernmentInsurancePlanDtoMapper.mapFederalGovernmentInsurancePlanEntityToFederalGovernmentInsurancePlanDto(federalGovernmentInsurancePlanEntity) : null;
    this.log.trace('Returning federal government insurance plan: [%j]', federalGovernmentInsurancePlanDto);
    return federalGovernmentInsurancePlanDto;
  }

  findById = moize(this.findByIdImpl, {
    maxSize: Infinity,
    onCacheAdd: () => this.log.info('Creating new findById memo'),
  });
}
