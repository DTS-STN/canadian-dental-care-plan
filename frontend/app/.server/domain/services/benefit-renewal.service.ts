import { inject, injectable } from 'inversify';

import { TYPES } from '~/.server/constants';
import { BenefitRenewalRequestDto, BenefitRenewalResponseDto } from '~/.server/domain/dtos';
import type { BenefitRenewalDtoMapper } from '~/.server/domain/mappers';
import type { BenefitRenewalRepository } from '~/.server/domain/repositories';
import type { LogFactory, Logger } from '~/.server/factories';

export interface BenefitRenewalService {
  /**
   * Submits benefit renewal request.
   *
   * @param benefitRenewalState The renewal state stored in session.
   * @returns A Promise that resolves to the renewal response if successful, or `null` otherwise.
   */
  createBenefitRenewal(benefitRenewalRequestDto: BenefitRenewalRequestDto): Promise<BenefitRenewalResponseDto>;
}

@injectable()
export class BenefitRenewalServiceImpl implements BenefitRenewalService {
  private readonly log: Logger;

  constructor(
    @inject(TYPES.LogFactory) logFactory: LogFactory,
    @inject(TYPES.BenefitRenewalDtoMapper) private readonly BenefitRenewalDtoMapper: BenefitRenewalDtoMapper,
    @inject(TYPES.BenefitRenewalRepository) private readonly BenefitRenewalRepository: BenefitRenewalRepository,
  ) {
    this.log = logFactory.createLogger('BenefitRenewalServiceImpl');
  }

  async createBenefitRenewal(benefitRenewalRequestDto: BenefitRenewalRequestDto): Promise<BenefitRenewalResponseDto> {
    this.log.debug('Submit benefit renewal request');
    this.log.trace('Submit benefit renewal request with: [%j]', benefitRenewalRequestDto);

    const benefitRenewalRequest = this.BenefitRenewalDtoMapper.mapBenefitRenewalRequestDtoToBenefitRenewalRequestEntity(benefitRenewalRequestDto);
    const benefitRenewalResponseEntity = await this.BenefitRenewalRepository.createBenefitRenewal(benefitRenewalRequest);
    const benefitRenewalResponse = this.BenefitRenewalDtoMapper.mapBenefitRenewalResponseEntityToBenefitRenewalResponseDto(benefitRenewalResponseEntity);
    this.log.trace('Returning client application: [%j]', benefitRenewalResponse);
    return benefitRenewalResponse;
  }
}
