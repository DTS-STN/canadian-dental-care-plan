import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { EmailNotificationRequestDto } from '~/.server/domain/dtos';
import type { EmailNotificationRequestEntity } from '~/.server/domain/entities';

export interface NotificationDtoMapper {
  mapEmailNotificationRequestDtoToEmailNotificationRequestEntity(emailNotificationRequestDto: EmailNotificationRequestDto): EmailNotificationRequestEntity;
}

@injectable()
export class DefaultNotificationDtoMapper implements NotificationDtoMapper {
  private readonly serverConfig: Pick<ServerConfig, 'GC_NOTIFY_ENGLISH_TEMPLATE_ID' | 'GC_NOTIFY_FRENCH_TEMPLATE_ID'>;

  constructor(@inject(TYPES.configs.ServerConfig) serverConfig: Pick<ServerConfig, 'GC_NOTIFY_ENGLISH_TEMPLATE_ID' | 'GC_NOTIFY_FRENCH_TEMPLATE_ID'>) {
    this.serverConfig = serverConfig;
  }

  mapEmailNotificationRequestDtoToEmailNotificationRequestEntity(emailNotificationRequestDto: EmailNotificationRequestDto): EmailNotificationRequestEntity {
    return {
      email_address: emailNotificationRequestDto.email,
      template_id: emailNotificationRequestDto.preferredLanguage === 'fr' ? this.serverConfig.GC_NOTIFY_FRENCH_TEMPLATE_ID : this.serverConfig.GC_NOTIFY_ENGLISH_TEMPLATE_ID,
      personalisation: {
        EmailVerificationCode: emailNotificationRequestDto.verificationCode,
      },
    };
  }
}
