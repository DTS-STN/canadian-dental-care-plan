import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs/server.config';
import { SERVICE_IDENTIFIER } from '~/.server/constants/service-identifier.contant';
import type { PreferredCommunicationMethodDto } from '~/.server/domain/dtos/preferred-communication-method.dto';
import type { PreferredCommunicationMethodEntity } from '~/.server/domain/entities/preferred-communication-method.entity';

export interface PreferredCommunicationMethodDtoMapper {
  mapPreferredCommunicationMethodEntityToPreferredCommunicationMethodDto(preferredCommunicationMethodEntity: PreferredCommunicationMethodEntity): PreferredCommunicationMethodDto;
  mapPreferredCommunicationMethodEntitiesToPreferredCommunicationMethodDtos(preferredCommunicationMethodEntities: PreferredCommunicationMethodEntity[]): PreferredCommunicationMethodDto[];
}

@injectable()
export class PreferredCommunicationMethodDtoMapperImpl implements PreferredCommunicationMethodDtoMapper {
  constructor(@inject(SERVICE_IDENTIFIER.SERVER_CONFIG) private readonly serverConfig: Pick<ServerConfig, 'ENGLISH_LANGUAGE_CODE' | 'FRENCH_LANGUAGE_CODE'>) {}

  mapPreferredCommunicationMethodEntityToPreferredCommunicationMethodDto(preferredCommunicationMethodEntity: PreferredCommunicationMethodEntity): PreferredCommunicationMethodDto {
    const { ENGLISH_LANGUAGE_CODE, FRENCH_LANGUAGE_CODE } = this.serverConfig;

    const id = preferredCommunicationMethodEntity.Value.toString();
    const nameEn = preferredCommunicationMethodEntity.Label.LocalizedLabels.find((label) => label.LanguageCode === ENGLISH_LANGUAGE_CODE)?.Label;
    const nameFr = preferredCommunicationMethodEntity.Label.LocalizedLabels.find((label) => label.LanguageCode === FRENCH_LANGUAGE_CODE)?.Label;

    if (nameEn === undefined || nameFr === undefined) {
      throw new Error(`Preferred nommunication method missing English or French name; id: [${id}]`);
    }

    return { id, nameEn, nameFr };
  }

  mapPreferredCommunicationMethodEntitiesToPreferredCommunicationMethodDtos(preferredCommunicationMethodEntities: PreferredCommunicationMethodEntity[]): PreferredCommunicationMethodDto[] {
    return preferredCommunicationMethodEntities.map((entity) => this.mapPreferredCommunicationMethodEntityToPreferredCommunicationMethodDto(entity));
  }
}
