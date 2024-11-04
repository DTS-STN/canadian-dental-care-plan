import { injectable } from 'inversify';

import { HCaptchaVerifyRequestDto, HCaptchaVerifyResponseDto } from '~/.server/web/dtos';
import { HCaptchaVerifyRequestEntity, HCaptchaVerifyResponseEntity } from '~/.server/web/entities';

export interface HCaptchaDtoMapper {
  mapHCaptchaVerifyRequestDtoToHCaptchaVerifyRequestEntity(hCaptchaVerifyRequestDto: HCaptchaVerifyRequestDto): HCaptchaVerifyRequestEntity;
  mapHCaptchaVerifyResponseEntityToHCaptchaVerifyResponseDto(hCaptchaVerifyResponseEntity: HCaptchaVerifyResponseEntity): HCaptchaVerifyResponseDto;
}

@injectable()
export class HCaptchaDtoMapperImpl implements HCaptchaDtoMapper {
  mapHCaptchaVerifyRequestDtoToHCaptchaVerifyRequestEntity({ hCaptchaResponse, ipAddress }: HCaptchaVerifyRequestDto): HCaptchaVerifyRequestEntity {
    return { hCaptchaResponse, ipAddress };
  }

  mapHCaptchaVerifyResponseEntityToHCaptchaVerifyResponseDto({ success, score }: HCaptchaVerifyResponseEntity): HCaptchaVerifyResponseDto {
    return { success, score };
  }
}
