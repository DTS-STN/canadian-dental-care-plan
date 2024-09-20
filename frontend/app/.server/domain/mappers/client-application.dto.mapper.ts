import { injectable } from 'inversify';

import type { ClientApplicationDto } from '~/.server/domain/dtos';
import type { ClientApplicationEntity } from '~/.server/domain/entities';

export interface ClientApplicationDtoMapper {
  mapClientApplicationEntityToClientApplicationDto(clientApplicationEntity: ClientApplicationEntity): ClientApplicationDto;
}

@injectable()
export class ClientApplicationDtoMapperImpl implements ClientApplicationDtoMapper {
  // todo the requirements of the DTO haven't been finalized so for now we do a 1-to-1 mapping between entity and DTO
  mapClientApplicationEntityToClientApplicationDto(clientApplicationEntity: ClientApplicationEntity): ClientApplicationDto {
    return clientApplicationEntity;
  }
}
