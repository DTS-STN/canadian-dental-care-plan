import { inject, injectable } from 'inversify';
import moize from 'moize';

import type { ServerConfig } from '~/.server/configs';
import { SERVICE_IDENTIFIER } from '~/.server/constants';
import type { ProvincialGovernmentInsurancePlanDto } from '~/.server/domain/dtos';
import { ProvincialGovernmentInsurancePlanNotFoundException } from '~/.server/domain/exceptions';
import type { ProvincialGovernmentInsurancePlanDtoMapper } from '~/.server/domain/mappers';
import type { ProvincialGovernmentInsurancePlanRepository } from '~/.server/domain/repositories';
import type { LogFactory, Logger } from '~/.server/factories';

export interface ProvincialGovernmentInsurancePlanService {
  listProvincialGovernmentInsurancePlans(): ProvincialGovernmentInsurancePlanDto[];
  getProvincialGovernmentInsurancePlanById(id: string): ProvincialGovernmentInsurancePlanDto;
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
    this.listProvincialGovernmentInsurancePlans.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_ALL_PROVINCIAL_GOVERNMENT_INSURANCE_PLANS_CACHE_TTL_SECONDS;
    this.getProvincialGovernmentInsurancePlanById.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_PROVINCIAL_GOVERNMENT_INSURANCE_PLAN_CACHE_TTL_SECONDS;
  }

  private listProvincialGovernmentInsurancePlansImpl(): ProvincialGovernmentInsurancePlanDto[] {
    this.log.debug('Get all provincial government insurance plans');
    const provincialGovernmentInsurancePlanEntities = this.provincialGovernmentInsurancePlanRepository.findAll();
    const provincialGovernmentInsurancePlanDtos = this.provincialGovernmentInsurancePlanDtoMapper.mapProvincialGovernmentInsurancePlanEntitiesToProvincialGovernmentInsurancePlanDtos(provincialGovernmentInsurancePlanEntities);
    this.log.trace('Returning provincial government insurance plans: [%j]', provincialGovernmentInsurancePlanDtos);
    return provincialGovernmentInsurancePlanDtos;
  }

  listProvincialGovernmentInsurancePlans = moize(this.listProvincialGovernmentInsurancePlansImpl, {
    onCacheAdd: () => this.log.info('Creating new listProvincialGovernmentInsurancePlans memo'),
  });

  private getProvincialGovernmentInsurancePlanByIdImpl(id: string): ProvincialGovernmentInsurancePlanDto {
    this.log.debug('Get provincial government insurance plan with id: [%s]', id);
    const provincialGovernmentInsurancePlanEntity = this.provincialGovernmentInsurancePlanRepository.findById(id);

    if (!provincialGovernmentInsurancePlanEntity) throw new ProvincialGovernmentInsurancePlanNotFoundException(`Provincial government insurance plan with id: [${id}] not found`);

    const provincialGovernmentInsurancePlanDto = this.provincialGovernmentInsurancePlanDtoMapper.mapProvincialGovernmentInsurancePlanEntityToProvincialGovernmentInsurancePlanDto(provincialGovernmentInsurancePlanEntity);
    this.log.trace('Returning provincial government insurance plan: [%j]', provincialGovernmentInsurancePlanDto);
    return provincialGovernmentInsurancePlanDto;
  }

  getProvincialGovernmentInsurancePlanById = moize(this.getProvincialGovernmentInsurancePlanByIdImpl, {
    maxSize: Infinity,
    onCacheAdd: () => this.log.info('Creating new getProvincialGovernmentInsurancePlanById memo'),
  });
}
