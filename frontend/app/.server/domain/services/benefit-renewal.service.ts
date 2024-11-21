import { inject, injectable } from 'inversify';

import { TYPES } from '~/.server/constants';
import { AdultChildBenefitRenewalDto, ItaBenefitRenewalDto } from '~/.server/domain/dtos';
import type { BenefitRenewalDtoMapper } from '~/.server/domain/mappers';
import type { BenefitRenewalRepository } from '~/.server/domain/repositories';
import type { AuditService } from '~/.server/domain/services';
import type { LogFactory, Logger } from '~/.server/factories';

export interface BenefitRenewalService {
  /**
   * Submits an adult child benefit renewal request.
   *
   * @param adultChildBenefitRenewalDto The adult child benefit renewal request dto
   */
  createAdultChildBenefitRenewal(adultChildBenefitRenewalDto: AdultChildBenefitRenewalDto): Promise<void>;

  /**
   * Submits an ITA benefit renewal request.
   *
   * @param adultChildBenefitRenewalDto The adult child benefit renewal request dto
   */
  createItaBenefitRenewal(itaBenefitRenewalDto: ItaBenefitRenewalDto): Promise<void>;
}

@injectable()
export class BenefitRenewalServiceImpl implements BenefitRenewalService {
  private readonly log: Logger;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.domain.mappers.BenefitRenewalDtoMapper) private readonly benefitRenewalDtoMapper: BenefitRenewalDtoMapper,
    @inject(TYPES.domain.repositories.BenefitRenewalRepository) private readonly benefitRenewalRepository: BenefitRenewalRepository,
    @inject(TYPES.domain.services.AuditService) private readonly auditService: AuditService,
  ) {
    this.log = logFactory.createLogger('BenefitRenewalServiceImpl');
  }

  async createAdultChildBenefitRenewal(adultChildBenefitRenewalDto: AdultChildBenefitRenewalDto): Promise<void> {
    this.log.trace('Creating adult child benefit renewal for request [%j]', adultChildBenefitRenewalDto);

    this.auditService.createAudit('adult-child-renewal-submit.post', { userId: adultChildBenefitRenewalDto.userId });

    const benefitRenewalRequestEntity = this.benefitRenewalDtoMapper.mapAdultChildBenefitRenewalDtoToBenefitRenewalRequestEntity(adultChildBenefitRenewalDto);
    await this.benefitRenewalRepository.createBenefitRenewal(benefitRenewalRequestEntity);

    this.log.trace('Successfully created adult child benefit renewal for request [%j]', adultChildBenefitRenewalDto);
  }

  async createItaBenefitRenewal(itaBenefitRenewalDto: ItaBenefitRenewalDto): Promise<void> {
    this.log.trace('Creating ITA benefit renewal for request [%j]', itaBenefitRenewalDto);

    this.auditService.createAudit('ita-renewal-submit.post', { userId: itaBenefitRenewalDto.userId });

    const benefitRenewalRequestEntity = this.benefitRenewalDtoMapper.mapItaBenefitRenewalDtoToBenefitRenewalRequestEntity(itaBenefitRenewalDto);
    await this.benefitRenewalRepository.createBenefitRenewal(benefitRenewalRequestEntity);

    this.log.trace('Successfully created ITA benefit renewal for request [%j]', itaBenefitRenewalDto);
  }
}
