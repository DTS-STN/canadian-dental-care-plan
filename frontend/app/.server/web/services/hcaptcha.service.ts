import { inject, injectable } from 'inversify';

import { TYPES } from '~/.server/constants';
import type { AuditService } from '~/.server/domain/services';
import type { LogFactory, Logger } from '~/.server/factories';
import type { HCaptchaVerifyRequestDto, HCaptchaVerifyResponseDto } from '~/.server/web/dtos';
import type { HCaptchaDtoMapper } from '~/.server/web/mappers';
import type { HCaptchaRepository } from '~/.server/web/repositories';

export interface HCaptchaService {
  /**
   * Verifies a user's hCaptcha response.
   *
   * @param hCaptchaVerifyRequestDto The hCaptcha verify request dto that includes the hCaptcha response token, optional IP address and userId for auditing
   * @returns A Promise that resolves to the hCaptcha verify response dto that includes the success status and score if successful.
   */
  verifyHCaptchaResponse(hCaptchaVerifyRequestDto: HCaptchaVerifyRequestDto): Promise<HCaptchaVerifyResponseDto>;
}

@injectable()
export class HCaptchaServiceImpl implements HCaptchaService {
  private readonly log: Logger;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.web.mappers.HCaptchaDtoMapper) private readonly hCaptchaDtoMapper: HCaptchaDtoMapper,
    @inject(TYPES.web.repositories.HCaptchaRepository) private readonly hCaptchaRepository: HCaptchaRepository,
    @inject(TYPES.domain.services.AuditService) private readonly auditService: AuditService,
  ) {
    this.log = logFactory.createLogger('HCaptchaServiceImpl');
  }

  async verifyHCaptchaResponse(hCaptchaVerifyRequestDto: HCaptchaVerifyRequestDto): Promise<HCaptchaVerifyResponseDto> {
    this.log.trace('Verifying hCaptcha with request [%j]', hCaptchaVerifyRequestDto);

    this.auditService.createAudit('hcaptcha.verify', { userId: hCaptchaVerifyRequestDto.userId });

    const hCaptchaVerifyRequestEntity = this.hCaptchaDtoMapper.mapHCaptchaVerifyRequestDtoToHCaptchaVerifyRequestEntity(hCaptchaVerifyRequestDto);
    const hCaptchaVerifyResponseEntity = await this.hCaptchaRepository.verifyHCaptchaResponse(hCaptchaVerifyRequestEntity);
    const hCaptchaVerifyResponseDto = this.hCaptchaDtoMapper.mapHCaptchaVerifyResponseEntityToHCaptchaVerifyResponseDto(hCaptchaVerifyResponseEntity);

    this.log.trace('Returning hCaptcha verify result: [%j]', hCaptchaVerifyResponseDto);
    return hCaptchaVerifyResponseDto;
  }
}
