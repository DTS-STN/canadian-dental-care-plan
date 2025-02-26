import { inject, injectable } from 'inversify';

import { TYPES } from '~/.server/constants';
import type { EmailNotificationRequestDto } from '~/.server/domain/dtos';
import type { NotificationDtoMapper } from '~/.server/domain/mappers';
import type { NotificationRepository } from '~/.server/domain/repositories';
import type { AuditService } from '~/.server/domain/services/audit.service';
import type { LogFactory, Logger } from '~/.server/factories';

export interface NotificationService {
  /**
   * Sends a verification code email using the data passed in the `EmailNotificationRequestDto` object
   *
   * @param emailNotificationRequestDto The request DTO object containing email notification details.
   * @returns A promise that resolves when the email has been sent.
   */
  sendVerificationCodeEmail(emailNotificationRequestDto: EmailNotificationRequestDto): Promise<void>;
}

@injectable()
export class DefaultNotificationService implements NotificationService {
  private readonly log: Logger;
  private readonly notificationDtoMapper: NotificationDtoMapper;
  private readonly notificationRepository: NotificationRepository;
  private readonly auditService: AuditService;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.domain.mappers.NotificationDtoMapper) notificationDtoMapper: NotificationDtoMapper,
    @inject(TYPES.domain.repositories.NotificationRepository) notificationRepository: NotificationRepository,
    @inject(TYPES.domain.services.AuditService) auditService: AuditService,
  ) {
    this.log = logFactory.createLogger('DefaulNotificationService');
    this.notificationDtoMapper = notificationDtoMapper;
    this.notificationRepository = notificationRepository;
    this.auditService = auditService;
    this.init();
  }

  private init(): void {
    this.log.debug('DefaultNotificationService initiated.');
  }

  async sendVerificationCodeEmail(emailNotificationRequestDto: EmailNotificationRequestDto): Promise<void> {
    this.log.trace('Sending email notification for request [%j]', emailNotificationRequestDto);

    this.auditService.createAudit('email-notification.post', { userId: emailNotificationRequestDto.userId });

    const emailNotificationRequestEntity = this.notificationDtoMapper.mapEmailNotificationRequestDtoToEmailNotificationRequestEntity(emailNotificationRequestDto);
    await this.notificationRepository.sendVerificationCodeEmail(emailNotificationRequestEntity);

    this.log.trace('Email notification successfully sent for request [%j]', emailNotificationRequestDto);
  }
}
