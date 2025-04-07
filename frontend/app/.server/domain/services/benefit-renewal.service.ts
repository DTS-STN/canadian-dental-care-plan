import { inject, injectable } from 'inversify';

import { TYPES } from '~/.server/constants';
import type { AdultBenefitRenewalDto, AdultChildBenefitRenewalDto, ChildBenefitRenewalDto, ItaBenefitRenewalDto, ProtectedBenefitRenewalDto } from '~/.server/domain/dtos';
import type { BenefitRenewalDtoMapper } from '~/.server/domain/mappers';
import type { BenefitRenewalRepository } from '~/.server/domain/repositories';
import type { AuditService } from '~/.server/domain/services';
import { createLogger } from '~/.server/logging';
import type { Logger } from '~/.server/logging';

export interface BenefitRenewalService {
  /**
   * Submits an adult benefit renewal request.
   *
   * @param adultBenefitRenewalDto The adult benefit renewal request dto
   */
  createAdultBenefitRenewal(adultBenefitRenewalDto: AdultBenefitRenewalDto): Promise<void>;

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

  /**
   * Submits a child benefit renewal request.
   *
   * @param childBenefitRenewalDto The child benefit renewal request dto
   */
  createChildBenefitRenewal(childBenefitRenewalDto: ChildBenefitRenewalDto): Promise<void>;

  /**
   * Submits benefit renewal request for protected route.
   *
   * @param protectedBenefitRenewalDto The protected route benefit renewal request dto
   */
  createProtectedBenefitRenewal(protectedBenefitRenewalDto: ProtectedBenefitRenewalDto): Promise<void>;
}

@injectable()
export class DefaultBenefitRenewalService implements BenefitRenewalService {
  private readonly log: Logger;
  private readonly benefitRenewalDtoMapper: BenefitRenewalDtoMapper;
  private readonly benefitRenewalRepository: BenefitRenewalRepository;
  private readonly auditService: AuditService;

  constructor(
    @inject(TYPES.domain.mappers.BenefitRenewalDtoMapper) benefitRenewalDtoMapper: BenefitRenewalDtoMapper,
    @inject(TYPES.domain.repositories.BenefitRenewalRepository) benefitRenewalRepository: BenefitRenewalRepository,
    @inject(TYPES.domain.services.AuditService) auditService: AuditService,
  ) {
    this.log = createLogger('DefaultBenefitRenewalService');
    this.benefitRenewalDtoMapper = benefitRenewalDtoMapper;
    this.benefitRenewalRepository = benefitRenewalRepository;
    this.auditService = auditService;
    this.init();
  }

  private init(): void {
    this.log.debug('DefaultBenefitRenewalService initiated.');
  }

  async createAdultBenefitRenewal(adultBenefitRenewalDto: AdultBenefitRenewalDto): Promise<void> {
    this.log.trace('Creating adult benefit renewal for request [%j]', adultBenefitRenewalDto);

    this.auditService.createAudit('adult-renewal-submit.post', { userId: adultBenefitRenewalDto.userId });

    const benefitRenewalRequestEntity = this.benefitRenewalDtoMapper.mapAdultBenefitRenewalDtoToBenefitRenewalRequestEntity(adultBenefitRenewalDto);
    await this.benefitRenewalRepository.createBenefitRenewal(benefitRenewalRequestEntity);

    this.log.trace('Successfully created adult benefit renewal for request [%j]', adultBenefitRenewalDto);
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

  async createChildBenefitRenewal(childBenefitRenewalDto: ChildBenefitRenewalDto): Promise<void> {
    this.log.trace('Creating child benefit renewal for request [%j]', childBenefitRenewalDto);

    this.auditService.createAudit('child-renewal-submit.post', { userId: childBenefitRenewalDto.userId });

    const benefitRenewalRequestEntity = this.benefitRenewalDtoMapper.mapChildBenefitRenewalDtoToBenefitRenewalRequestEntity(childBenefitRenewalDto);
    await this.benefitRenewalRepository.createBenefitRenewal(benefitRenewalRequestEntity);

    this.log.trace('Successfully created child benefit renewal for request [%j]', childBenefitRenewalDto);
  }

  async createProtectedBenefitRenewal(protectedBenefitRenewalDto: ProtectedBenefitRenewalDto): Promise<void> {
    this.log.trace('Creating protected benefit renewal for request [%j]', protectedBenefitRenewalDto);

    this.auditService.createAudit('protected-renewal-submit.post', { userId: protectedBenefitRenewalDto.userId });

    const benefitRenewalRequestEntity = this.benefitRenewalDtoMapper.mapProtectedBenefitRenewalDtoToBenefitRenewalRequestEntity(protectedBenefitRenewalDto);
    await this.benefitRenewalRepository.createBenefitRenewal(benefitRenewalRequestEntity);

    this.log.trace('Successfully created protected benefit renewal for request [%j]', protectedBenefitRenewalDto);
  }
}
