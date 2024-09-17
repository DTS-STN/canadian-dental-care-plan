import { injectable } from 'inversify';

import type { ClientFriendlyStatusDto } from '~/.server/domain/dtos/client-friendly-status.dto';
import type { ClientFriendlyStatusEntity } from '~/.server/domain/entities/client-friendly-status.entity';

export interface ClientFriendlyStatusDtoMapper {
  mapClientFriendlyStatusEntityToClientFriendlyStatusDto(clientFriendlyStatusEntity: ClientFriendlyStatusEntity): ClientFriendlyStatusDto;
  mapClientFriendlyStatusEntitiesToClientFriendlyStatusDtos(clientFriendlyStatusEntities: ClientFriendlyStatusEntity[]): ClientFriendlyStatusDto[];
}

@injectable()
export class ClientFriendlyStatusDtoMapperImpl implements ClientFriendlyStatusDtoMapper {
  mapClientFriendlyStatusEntityToClientFriendlyStatusDto(clientFriendlyStatusEntity: ClientFriendlyStatusEntity): ClientFriendlyStatusDto {
    const id = clientFriendlyStatusEntity.esdc_clientfriendlystatusid;
    const nameEn = clientFriendlyStatusEntity.esdc_descriptionenglish;
    const nameFr = clientFriendlyStatusEntity.esdc_descriptionfrench;
    return { id, nameEn, nameFr };
  }

  mapClientFriendlyStatusEntitiesToClientFriendlyStatusDtos(clientFriendlyStatusEntities: ClientFriendlyStatusEntity[]): ClientFriendlyStatusDto[] {
    return clientFriendlyStatusEntities.map((entity) => this.mapClientFriendlyStatusEntityToClientFriendlyStatusDto(entity));
  }
}
