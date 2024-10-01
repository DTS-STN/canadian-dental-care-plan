import { injectable } from 'inversify';

import type { ClientFriendlyStatusDto } from '~/.server/domain/dtos';
import type { ClientFriendlyStatusEntity } from '~/.server/domain/entities';

export interface ClientFriendlyStatusDtoMapper {
  mapClientFriendlyStatusEntityToClientFriendlyStatusDto(clientFriendlyStatusEntity: ClientFriendlyStatusEntity): ClientFriendlyStatusDto;
  mapClientFriendlyStatusEntitiesToClientFriendlyStatusDtos(clientFriendlyStatusEntities: ReadonlyArray<ClientFriendlyStatusEntity>): ReadonlyArray<ClientFriendlyStatusDto>;
}

@injectable()
export class ClientFriendlyStatusDtoMapperImpl implements ClientFriendlyStatusDtoMapper {
  mapClientFriendlyStatusEntityToClientFriendlyStatusDto(clientFriendlyStatusEntity: ClientFriendlyStatusEntity): ClientFriendlyStatusDto {
    const id = clientFriendlyStatusEntity.esdc_clientfriendlystatusid;
    const nameEn = clientFriendlyStatusEntity.esdc_descriptionenglish;
    const nameFr = clientFriendlyStatusEntity.esdc_descriptionfrench;
    return { id, nameEn, nameFr };
  }

  mapClientFriendlyStatusEntitiesToClientFriendlyStatusDtos(clientFriendlyStatusEntities: ReadonlyArray<ClientFriendlyStatusEntity>): ReadonlyArray<ClientFriendlyStatusDto> {
    return clientFriendlyStatusEntities.map((entity) => this.mapClientFriendlyStatusEntityToClientFriendlyStatusDto(entity));
  }
}
