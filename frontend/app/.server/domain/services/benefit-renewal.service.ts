import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { RedisService } from '~/.server/data';
import type { AdultBenefitRenewalDto, AdultChildBenefitRenewalDto, ChildBenefitRenewalDto, ItaBenefitRenewalDto, ProtectedBenefitRenewalDto } from '~/.server/domain/dtos';
import type { BenefitRenewalDtoMapper } from '~/.server/domain/mappers';
import type { BenefitRenewalRepository } from '~/.server/domain/repositories';
import type { AuditService } from '~/.server/domain/services';
import { KILLSWITCH_KEY } from '~/.server/domain/services';
import type { Logger } from '~/.server/logging';
import { createLogger } from '~/.server/logging';
import { AppError, isAppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

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
  // TODO :: GjB :: the redis service is temporary.. it should be removed when HTTP429 mitigation is removed
  private readonly redisService: RedisService;
  private readonly serverConfig: ServerConfig;

  constructor(
    @inject(TYPES.domain.mappers.BenefitRenewalDtoMapper) benefitRenewalDtoMapper: BenefitRenewalDtoMapper,
    @inject(TYPES.domain.repositories.BenefitRenewalRepository) benefitRenewalRepository: BenefitRenewalRepository,
    @inject(TYPES.domain.services.AuditService) auditService: AuditService,
    @inject(TYPES.data.services.RedisService) redisService: RedisService,
    @inject(TYPES.configs.ServerConfig) serverConfig: ServerConfig,
  ) {
    this.log = createLogger('DefaultBenefitRenewalService');
    this.benefitRenewalDtoMapper = benefitRenewalDtoMapper;
    this.benefitRenewalRepository = benefitRenewalRepository;
    this.auditService = auditService;
    // TODO :: GjB :: the redis service is temporary.. it should be removed when HTTP429 mitigation is removed
    this.redisService = redisService;
    this.serverConfig = serverConfig;

    this.init();
  }

  private init(): void {
    this.log.debug('DefaultBenefitRenewalService initiated.');
  }

  async createAdultBenefitRenewal(adultBenefitRenewalDto: AdultBenefitRenewalDto): Promise<void> {
    this.log.trace('Creating adult benefit renewal for request [%j]', adultBenefitRenewalDto);

    const killswitchEngaged = await this.redisService.get(KILLSWITCH_KEY);

    if (killswitchEngaged) {
      this.log.info('Request to create benefit application is unavailable due to killswitch engagement.');
      new AppError('Request to create benefit application is unavailable due to killswitch engagement.', ErrorCodes.XAPI_TOO_MANY_REQUESTS);
    }

    this.auditService.createAudit('adult-renewal-submit.post', { userId: adultBenefitRenewalDto.userId });

    try {
      const benefitRenewalRequestEntity = this.benefitRenewalDtoMapper.mapAdultBenefitRenewalDtoToBenefitRenewalRequestEntity(adultBenefitRenewalDto);
      await this.benefitRenewalRepository.createBenefitRenewal(benefitRenewalRequestEntity);

      this.log.trace('Successfully created adult benefit renewal for request [%j]', adultBenefitRenewalDto);
    } catch (error) {
      if (isAppError(error) && error.errorCode === ErrorCodes.XAPI_TOO_MANY_REQUESTS) {
        this.log.warn('Received XAPI_TOO_MANY_REQUESTS... killswitch engage!');
        await this.redisService.set(KILLSWITCH_KEY, true, this.serverConfig.APPLICATION_KILLSWITCH_TTL_SECONDS);
      }

      throw error;
    }
  }

  async createAdultChildBenefitRenewal(adultChildBenefitRenewalDto: AdultChildBenefitRenewalDto): Promise<void> {
    this.log.trace('Creating adult child benefit renewal for request [%j]', adultChildBenefitRenewalDto);

    const killswitchEngaged = await this.redisService.get(KILLSWITCH_KEY);

    if (killswitchEngaged) {
      this.log.info('Request to create benefit application is unavailable due to killswitch engagement.');
      new AppError('Request to create benefit application is unavailable due to killswitch engagement.', ErrorCodes.XAPI_TOO_MANY_REQUESTS);
    }

    this.auditService.createAudit('adult-child-renewal-submit.post', { userId: adultChildBenefitRenewalDto.userId });

    try {
      const benefitRenewalRequestEntity = this.benefitRenewalDtoMapper.mapAdultChildBenefitRenewalDtoToBenefitRenewalRequestEntity(adultChildBenefitRenewalDto);
      await this.benefitRenewalRepository.createBenefitRenewal(benefitRenewalRequestEntity);

      this.log.trace('Successfully created adult child benefit renewal for request [%j]', adultChildBenefitRenewalDto);
    } catch (error) {
      if (isAppError(error) && error.errorCode === ErrorCodes.XAPI_TOO_MANY_REQUESTS) {
        this.log.warn('Received XAPI_TOO_MANY_REQUESTS... killswitch engage!');
        await this.redisService.set(KILLSWITCH_KEY, true, this.serverConfig.APPLICATION_KILLSWITCH_TTL_SECONDS);
      }

      throw error;
    }
  }

  async createItaBenefitRenewal(itaBenefitRenewalDto: ItaBenefitRenewalDto): Promise<void> {
    this.log.trace('Creating ITA benefit renewal for request [%j]', itaBenefitRenewalDto);

    const killswitchEngaged = await this.redisService.get(KILLSWITCH_KEY);

    if (killswitchEngaged) {
      this.log.info('Request to create benefit application is unavailable due to killswitch engagement.');
      new AppError('Request to create benefit application is unavailable due to killswitch engagement.', ErrorCodes.XAPI_TOO_MANY_REQUESTS);
    }

    this.auditService.createAudit('ita-renewal-submit.post', { userId: itaBenefitRenewalDto.userId });

    try {
      const benefitRenewalRequestEntity = this.benefitRenewalDtoMapper.mapItaBenefitRenewalDtoToBenefitRenewalRequestEntity(itaBenefitRenewalDto);
      await this.benefitRenewalRepository.createBenefitRenewal(benefitRenewalRequestEntity);

      this.log.trace('Successfully created ITA benefit renewal for request [%j]', itaBenefitRenewalDto);
    } catch (error) {
      if (isAppError(error) && error.errorCode === ErrorCodes.XAPI_TOO_MANY_REQUESTS) {
        this.log.warn('Received XAPI_TOO_MANY_REQUESTS... killswitch engage!');
        await this.redisService.set(KILLSWITCH_KEY, true, this.serverConfig.APPLICATION_KILLSWITCH_TTL_SECONDS);
      }

      throw error;
    }
  }

  async createChildBenefitRenewal(childBenefitRenewalDto: ChildBenefitRenewalDto): Promise<void> {
    this.log.trace('Creating child benefit renewal for request [%j]', childBenefitRenewalDto);

    const killswitchEngaged = await this.redisService.get(KILLSWITCH_KEY);

    if (killswitchEngaged) {
      this.log.info('Request to create benefit application is unavailable due to killswitch engagement.');
      new AppError('Request to create benefit application is unavailable due to killswitch engagement.', ErrorCodes.XAPI_TOO_MANY_REQUESTS);
    }

    this.auditService.createAudit('child-renewal-submit.post', { userId: childBenefitRenewalDto.userId });

    try {
      const benefitRenewalRequestEntity = this.benefitRenewalDtoMapper.mapChildBenefitRenewalDtoToBenefitRenewalRequestEntity(childBenefitRenewalDto);
      await this.benefitRenewalRepository.createBenefitRenewal(benefitRenewalRequestEntity);

      this.log.trace('Successfully created child benefit renewal for request [%j]', childBenefitRenewalDto);
    } catch (error) {
      if (isAppError(error) && error.errorCode === ErrorCodes.XAPI_TOO_MANY_REQUESTS) {
        this.log.warn('Received XAPI_TOO_MANY_REQUESTS... killswitch engage!');
        await this.redisService.set(KILLSWITCH_KEY, true, this.serverConfig.APPLICATION_KILLSWITCH_TTL_SECONDS);
      }

      throw error;
    }
  }

  async createProtectedBenefitRenewal(protectedBenefitRenewalDto: ProtectedBenefitRenewalDto): Promise<void> {
    this.log.trace('Creating protected benefit renewal for request [%j]', protectedBenefitRenewalDto);

    const killswitchEngaged = await this.redisService.get(KILLSWITCH_KEY);

    if (killswitchEngaged) {
      this.log.info('Request to create benefit application is unavailable due to killswitch engagement.');
      new AppError('Request to create benefit application is unavailable due to killswitch engagement.', ErrorCodes.XAPI_TOO_MANY_REQUESTS);
    }

    this.auditService.createAudit('protected-renewal-submit.post', { userId: protectedBenefitRenewalDto.userId });

    try {
      const benefitRenewalRequestEntity = this.benefitRenewalDtoMapper.mapProtectedBenefitRenewalDtoToBenefitRenewalRequestEntity(protectedBenefitRenewalDto);
      await this.benefitRenewalRepository.createBenefitRenewal(benefitRenewalRequestEntity);

      this.log.trace('Successfully created protected benefit renewal for request [%j]', protectedBenefitRenewalDto);
    } catch (error) {
      if (isAppError(error) && error.errorCode === ErrorCodes.XAPI_TOO_MANY_REQUESTS) {
        this.log.warn('Received XAPI_TOO_MANY_REQUESTS... killswitch engage!');
        await this.redisService.set(KILLSWITCH_KEY, true, this.serverConfig.APPLICATION_KILLSWITCH_TTL_SECONDS);
      }

      throw error;
    }
  }
}
