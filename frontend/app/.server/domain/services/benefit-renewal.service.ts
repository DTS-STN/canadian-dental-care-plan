import { inject, injectable } from 'inversify';

import { BenefitRenewalResponseEntity } from '../entities/benefit-renewal.entity';
import { ToBenefitRenewalRequestFromApplyAdultStateArgs } from '../mappers/benefit-renewal.dto.mapper';
import { SERVICE_IDENTIFIER } from '~/.server/constants';
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
  submitRenewalRequest(benefitRenewalState: ToBenefitRenewalRequestFromApplyAdultStateArgs): Promise<BenefitRenewalResponseEntity | null>;
}

@injectable()
export class BenefitRenewalServiceImpl implements BenefitRenewalService {
  private readonly log: Logger;

  constructor(
    @inject(SERVICE_IDENTIFIER.LOG_FACTORY) logFactory: LogFactory,
    @inject(SERVICE_IDENTIFIER.BENEFIT_RENEWAL_DTO_MAPPER) private readonly BenefitRenewalDtoMapper: BenefitRenewalDtoMapper,
    @inject(SERVICE_IDENTIFIER.BENEFIT_RENEWAL_REPOSITORY) private readonly BenefitRenewalRepository: BenefitRenewalRepository,
  ) {
    this.log = logFactory.createLogger('BenefitRenewalServiceImpl');
  }

  async submitRenewalRequest(benefitRenewalState: ToBenefitRenewalRequestFromApplyAdultStateArgs): Promise<BenefitRenewalResponseEntity | null> {
    this.log.debug('Submit benefit renewal request');
    this.log.trace('Submit benefit renewal request with: [%j]', benefitRenewalState);

    const benefitRenewalRequest = this.BenefitRenewalDtoMapper.mapClientRenewalRequestToClientRenewalDto(benefitRenewalState);
    const benefitRenewalResponse = await this.BenefitRenewalRepository.submitRenewal(benefitRenewalRequest);

    this.log.trace('Returning client application: [%j]', benefitRenewalResponse);
    return benefitRenewalResponse;
  }
}
