import { inject, injectable } from 'inversify';
import type { Option } from 'oxide.ts';
import { None, Some } from 'oxide.ts';

import { TYPES } from '~/.server/constants';
import type { ClientApplicationDto, ClientApplicationRenewalEligibilityDto } from '~/.server/domain/dtos';
import type { ClientEligibilityService } from '~/.server/domain/services';
import { createLogger } from '~/.server/logging';
import type { Logger } from '~/.server/logging';

export interface ClientApplicationRenewalEligibilityDtoMapper {
  mapToClientApplicationRenewalEligibilityDto(clientApplicationDto: Option<ClientApplicationDto>): Option<ClientApplicationRenewalEligibilityDto>;
}

@injectable()
export class DefaultClientApplicationRenewalEligibilityDtoMapper implements ClientApplicationRenewalEligibilityDtoMapper {
  private log: Logger;
  private clientEligibilityService: ClientEligibilityService;

  constructor(@inject(TYPES.ClientEligibilityService) clientEligibilityService: ClientEligibilityService) {
    this.log = createLogger('DefaultClientApplicationRenewalEligibilityDtoMapper');
    this.clientEligibilityService = clientEligibilityService;
  }

  mapToClientApplicationRenewalEligibilityDto(clientApplicationDto: Option<ClientApplicationDto>): Option<ClientApplicationRenewalEligibilityDto> {
    this.log.trace('Mapping client application dto to client application renewal eligibility dto: [%j]', clientApplicationDto);
    return clientApplicationDto.isSome() ? Some(clientApplicationDto.unwrap()) : None;
  }
}
