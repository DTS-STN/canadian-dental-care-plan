import { inject, injectable, optional } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { RedisService } from '~/.server/data';
import type { BenefitApplicationDto } from '~/.server/domain/dtos';
import type { BenefitApplicationDtoMapper } from '~/.server/domain/mappers';
import type { BenefitApplicationRepository } from '~/.server/domain/repositories';
import type { AuditService } from '~/.server/domain/services';
import { KILLSWITCH_KEY } from '~/.server/domain/services';
import type { Logger } from '~/.server/logging';
import { createLogger } from '~/.server/logging';
import { AppError, isAppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

export interface BenefitApplicationService {
  /**
   * Submits benefit application request.
   *
   * @param benefitApplicationRequestDto The benefit application request dto
   * @returns A Promise that resolves to the benefit application code
   */
  createBenefitApplication(benefitApplicationRequestDto: BenefitApplicationDto): Promise<string>;

  /**
   * Submits benefit application request for the protected route.
   *
   * @param protectedBenefitApplicationRequestDto The protected route benefit application request dto
   * @returns A Promise that resolves to the benefit application code
   */
  createProtectedBenefitApplication(protectedBenefitApplicationRequestDto: BenefitApplicationDto): Promise<string>;
}

@injectable()
export class DefaultBenefitApplicationService implements BenefitApplicationService {
  private readonly log: Logger;
  private readonly benefitApplicationDtoMapper: BenefitApplicationDtoMapper;
  private readonly benefitApplicationRepository: BenefitApplicationRepository;
  private readonly auditService: AuditService;
  private readonly serverConfig: ServerConfig;

  // TODO :: GjB :: the redis service is temporary.. it should be removed when HTTP429 mitigation is removed
  private readonly redisService?: RedisService;

  constructor(
    @inject(TYPES.BenefitApplicationDtoMapper) benefitApplicationDtoMapper: BenefitApplicationDtoMapper,
    @inject(TYPES.BenefitApplicationRepository) benefitApplicationRepository: BenefitApplicationRepository,
    @inject(TYPES.AuditService) auditService: AuditService,
    @inject(TYPES.ServerConfig) serverConfig: ServerConfig,
    @inject(TYPES.RedisService) @optional() redisService?: RedisService,
  ) {
    this.log = createLogger('DefaultBenefitApplicationService');
    this.benefitApplicationDtoMapper = benefitApplicationDtoMapper;
    this.benefitApplicationRepository = benefitApplicationRepository;
    this.auditService = auditService;
    this.serverConfig = serverConfig;

    // TODO :: GjB :: the redis service is temporary.. it should be removed when HTTP429 mitigation is removed
    this.redisService = redisService;

    this.init();
  }

  private init(): void {
    this.log.debug('DefaultBenefitApplicationService initiated.');
  }

  async createBenefitApplication(benefitApplicationRequestDto: BenefitApplicationDto): Promise<string> {
    this.log.trace('Creating benefit application for request [%j]', benefitApplicationRequestDto);

    const killswitchEngaged = await this.redisService?.get(KILLSWITCH_KEY);

    if (killswitchEngaged) {
      this.log.error('Request to create benefit application is unavailable (killswitch engaged).');
      new AppError('Request to create benefit application is unavailable (killswitch engaged)', ErrorCodes.XAPI_TOO_MANY_REQUESTS);
    }

    this.auditService.createAudit('application-submit.post', { userId: benefitApplicationRequestDto.userId });

    try {
      const benefitApplicationRequestEntity = this.benefitApplicationDtoMapper.mapBenefitApplicationDtoToBenefitApplicationRequestEntity(benefitApplicationRequestDto);
      const benefitApplicationResponseEntity = await this.benefitApplicationRepository.createBenefitApplication(benefitApplicationRequestEntity);
      const applicationCode = this.benefitApplicationDtoMapper.mapBenefitApplicationResponseEntityToApplicationCode(benefitApplicationResponseEntity);

      this.log.trace('Returning application code: [%s]', applicationCode);
      return applicationCode;
    } catch (error) {
      if (isAppError(error) && error.errorCode === ErrorCodes.XAPI_TOO_MANY_REQUESTS) {
        this.log.error('Received XAPI_TOO_MANY_REQUESTS; killswitch engage!');
        await this.redisService?.set(KILLSWITCH_KEY, true, this.serverConfig.APPLICATION_KILLSWITCH_TTL_SECONDS);
      }

      throw error;
    }
  }

  async createProtectedBenefitApplication(protectedBenefitApplicationRequestDto: BenefitApplicationDto): Promise<string> {
    this.log.trace('Creating protected benefit application for request [%j]', protectedBenefitApplicationRequestDto);

    this.auditService.createAudit('protected-application-submit.post', { userId: protectedBenefitApplicationRequestDto.userId });

    const protectedBenefitApplicationRequestEntity = this.benefitApplicationDtoMapper.mapBenefitApplicationDtoToProtectedBenefitApplicationRequestEntity(protectedBenefitApplicationRequestDto);
    const benefitApplicationResponseEntity = await this.benefitApplicationRepository.createBenefitApplication(protectedBenefitApplicationRequestEntity);
    const applicationCode = this.benefitApplicationDtoMapper.mapBenefitApplicationResponseEntityToApplicationCode(benefitApplicationResponseEntity);

    this.log.trace('Returning application code: [%s]', applicationCode);
    return applicationCode;
  }
}
