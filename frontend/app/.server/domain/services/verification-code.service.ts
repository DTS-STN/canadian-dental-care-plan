import { inject, injectable } from 'inversify';

import { TYPES } from '~/.server/constants';
import type { VerificationCodeEmailRequestDto } from '~/.server/domain/dtos';
import type { VerificationCodeDtoMapper } from '~/.server/domain/mappers';
import type { VerificationCodeRepository } from '~/.server/domain/repositories';
import type { AuditService } from '~/.server/domain/services/audit.service';
import type { LogFactory, Logger } from '~/.server/factories';

export interface VerificationCodeService {
  /**
   * Sends a verification code email using the data passed in the `VerificationCodeEmailRequestDto` object
   *
   * @param verificationCodeEmailRequestDto The request DTO object containing verification code email details.
   * @returns A promise that resolves when the email has been sent.
   */
  sendVerificationCodeEmail(verificationCodeEmailRequestDto: VerificationCodeEmailRequestDto): Promise<void>;
}

@injectable()
export class DefaultVerificationCodeService implements VerificationCodeService {
  private readonly log: Logger;
  private readonly verificationCodeDtoMapper: VerificationCodeDtoMapper;
  private readonly verificationCodeRepository: VerificationCodeRepository;
  private readonly auditService: AuditService;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.domain.mappers.VerificationCodeDtoMapper) verificationCodeDtoMapper: VerificationCodeDtoMapper,
    @inject(TYPES.domain.repositories.VerificationCodeRepository) verificationCodeRepository: VerificationCodeRepository,
    @inject(TYPES.domain.services.AuditService) auditService: AuditService,
  ) {
    this.log = logFactory.createLogger('DefaultVerificationCodeService');
    this.verificationCodeDtoMapper = verificationCodeDtoMapper;
    this.verificationCodeRepository = verificationCodeRepository;
    this.auditService = auditService;
    this.init();
  }

  private init(): void {
    this.log.debug('DefaultVerificationCodeService initiated.');
  }

  async sendVerificationCodeEmail(verificationCodeEmailRequestDto: VerificationCodeEmailRequestDto): Promise<void> {
    this.log.trace('Sending verification code email for request [%j]', verificationCodeEmailRequestDto);

    this.auditService.createAudit('verification-code-email.post', { userId: verificationCodeEmailRequestDto.userId });

    const verificationCodeEmailRequestEntity = this.verificationCodeDtoMapper.mapVerificationCodeEmailRequestDtoToVerificationCodeEmailRequestEntity(verificationCodeEmailRequestDto);
    await this.verificationCodeRepository.sendVerificationCodeEmail(verificationCodeEmailRequestEntity);

    this.log.trace('Verification code email successfully sent for request [%j]', verificationCodeEmailRequestDto);
  }
}
