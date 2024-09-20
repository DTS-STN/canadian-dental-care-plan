import { inject, injectable } from 'inversify';
import moize from 'moize';

import type { ServerConfig } from '~/.server/configs/server.config';
import { SERVICE_IDENTIFIER } from '~/.server/constants/service-identifier.contant';
import type { ProvincialGovernmentInsurancePlanDto } from '~/.server/domain/dtos';
import type { ProvincialGovernmentInsurancePlanDtoMapper } from '~/.server/domain/mappers';
import type { ProvincialGovernmentInsurancePlanRepository } from '~/.server/domain/repositories';
import type { LogFactory, Logger } from '~/.server/factories/log.factory';

export interface ProvincialGovernmentInsurancePlanService {
  findAll(): ProvincialGovernmentInsurancePlanDto[];
  findById(id: string): ProvincialGovernmentInsurancePlanDto | null;
}

@injectable()
export class ProvincialGovernmentInsurancePlanServiceImpl implements ProvincialGovernmentInsurancePlanService {
  private readonly log: Logger;

  constructor(
    @inject(SERVICE_IDENTIFIER.LOG_FACTORY) logFactory: LogFactory,
    @inject(SERVICE_IDENTIFIER.PROVINCIAL_GOVERNMENT_INSURANCE_PLAN_DTO_MAPPER) private readonly provincialGovernmentInsurancePlanDtoMapper: ProvincialGovernmentInsurancePlanDtoMapper,
    @inject(SERVICE_IDENTIFIER.PROVINCIAL_GOVERNMENT_INSURANCE_PLAN_REPOSITORY) private readonly provincialGovernmentInsurancePlanRepository: ProvincialGovernmentInsurancePlanRepository,
    @inject(SERVICE_IDENTIFIER.SERVER_CONFIG) private readonly serverConfig: Pick<ServerConfig, 'LOOKUP_SVC_ALL_PROVINCIAL_GOVERNMENT_INSURANCE_PLANS_CACHE_TTL_SECONDS' | 'LOOKUP_SVC_PROVINCIAL_GOVERNMENT_INSURANCE_PLAN_CACHE_TTL_SECONDS'>,
  ) {
    this.log = logFactory.createLogger('ProvincialGovernmentInsurancePlanServiceImpl');

    // set moize options
    this.findAll.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_ALL_PROVINCIAL_GOVERNMENT_INSURANCE_PLANS_CACHE_TTL_SECONDS;
    this.findById.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_PROVINCIAL_GOVERNMENT_INSURANCE_PLAN_CACHE_TTL_SECONDS;
  }

  private findAllImpl(): ProvincialGovernmentInsurancePlanDto[] {
    this.log.debug('Get all provincial government insurance plans');
    const provincialGovernmentInsurancePlanEntities = this.provincialGovernmentInsurancePlanRepository.findAll();
    const provincialGovernmentInsurancePlanDtos = this.provincialGovernmentInsurancePlanDtoMapper.mapProvincialGovernmentInsurancePlanEntitiesToProvincialGovernmentInsurancePlanDtos(provincialGovernmentInsurancePlanEntities);
    this.log.trace('Returning provincial government insurance plans: [%j]', provincialGovernmentInsurancePlanDtos);
    return provincialGovernmentInsurancePlanDtos;
  }

  findAll = moize(this.findAllImpl, {
    onCacheAdd: () => this.log.info('Creating new findAll memo'),
  });

  private findByIdImpl(id: string): ProvincialGovernmentInsurancePlanDto | null {
    this.log.debug('Get provincial government insurance plan with id: [%s]', id);
    const provincialGovernmentInsurancePlanEntity = this.provincialGovernmentInsurancePlanRepository.findById(id);
    const provincialGovernmentInsurancePlanDto = provincialGovernmentInsurancePlanEntity
      ? this.provincialGovernmentInsurancePlanDtoMapper.mapProvincialGovernmentInsurancePlanEntityToProvincialGovernmentInsurancePlanDto(provincialGovernmentInsurancePlanEntity)
      : null;
    this.log.trace('Returning provincial government insurance plan: [%j]', provincialGovernmentInsurancePlanDto);
    return provincialGovernmentInsurancePlanDto;
  }

  findById = moize(this.findByIdImpl, {
    maxSize: Infinity,
    onCacheAdd: () => this.log.info('Creating new findById memo'),
  });
}
