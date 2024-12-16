import { inject, injectable } from 'inversify';

import { TYPES } from '~/.server/constants';
import type { BenefitApplicationDto } from '~/.server/domain/dtos';
import type { BenefitApplicationDtoMapper } from '~/.server/domain/mappers';
import type { BenefitApplicationRepository } from '~/.server/domain/repositories';
import type { AuditService } from '~/.server/domain/services';
import type { LogFactory, Logger } from '~/.server/factories';

export interface BenefitApplicationService {
  /**
   * Submits benefit application request.
   *
   * @param benefitApplicationRequestDto The benefit application request dto
   * @returns A Promise that resolves to the benefit application code
   */
  createBenefitApplication(benefitApplicationRequestDto: BenefitApplicationDto): Promise<string>;
}

@injectable()
export class DefaultBenefitApplicationService implements BenefitApplicationService {
  private readonly log: Logger;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.domain.mappers.BenefitApplicationDtoMapper) private readonly benefitApplicationDtoMapper: BenefitApplicationDtoMapper,
    @inject(TYPES.domain.repositories.BenefitApplicationRepository) private readonly benefitApplicationRepository: BenefitApplicationRepository,
    @inject(TYPES.domain.services.AuditService) private readonly auditService: AuditService,
  ) {
    this.log = logFactory.createLogger('DefaultBenefitApplicationService');
    this.init();
  }

  private init(): void {
    this.log.debug('DefaultBenefitApplicationService initiated.');
  }

  async createBenefitApplication(benefitApplicationRequestDto: BenefitApplicationDto): Promise<string> {
    this.log.trace('Creating benefit application for request [%j]', benefitApplicationRequestDto);

    this.auditService.createAudit('application-submit.post', { userId: benefitApplicationRequestDto.userId });

    const benefitApplicationRequestEntity = this.benefitApplicationDtoMapper.mapBenefitApplicationDtoToBenefitApplicationRequestEntity(benefitApplicationRequestDto);
    const benefitApplicationResponseEntity = await this.benefitApplicationRepository.createBenefitApplication(benefitApplicationRequestEntity);
    const applicationCode = this.benefitApplicationDtoMapper.mapBenefitApplicationResponseEntityToApplicationCode(benefitApplicationResponseEntity);

    this.log.trace('Returning application code: [%s]', applicationCode);
    return applicationCode;
  }
}
