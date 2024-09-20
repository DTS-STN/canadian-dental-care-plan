import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs/server.config';
import { SERVICE_IDENTIFIER } from '~/.server/constants/service-identifier.contant';
import type { PreferredLanguageDto } from '~/.server/domain/dtos';
import type { PreferredLanguageEntity } from '~/.server/domain/entities';

export interface PreferredLanguageDtoMapper {
  mapPreferredLanguageEntityToPreferredLanguageDto(preferredLanguageEntity: PreferredLanguageEntity): PreferredLanguageDto;
  mapPreferredLanguageEntitiesToPreferredLanguageDtos(preferredLanguageEntities: PreferredLanguageEntity[]): PreferredLanguageDto[];
}

@injectable()
export class PreferredLanguageDtoMapperImpl implements PreferredLanguageDtoMapper {
  constructor(@inject(SERVICE_IDENTIFIER.SERVER_CONFIG) private readonly serverConfig: Pick<ServerConfig, 'ENGLISH_LANGUAGE_CODE' | 'FRENCH_LANGUAGE_CODE'>) {}

  mapPreferredLanguageEntityToPreferredLanguageDto(preferredLanguageEntity: PreferredLanguageEntity): PreferredLanguageDto {
    const { ENGLISH_LANGUAGE_CODE, FRENCH_LANGUAGE_CODE } = this.serverConfig;

    const id = preferredLanguageEntity.Value.toString();
    const nameEn = preferredLanguageEntity.Label.LocalizedLabels.find((label) => label.LanguageCode === ENGLISH_LANGUAGE_CODE)?.Label;
    const nameFr = preferredLanguageEntity.Label.LocalizedLabels.find((label) => label.LanguageCode === FRENCH_LANGUAGE_CODE)?.Label;

    if (nameEn === undefined || nameFr === undefined) {
      throw new Error(`Preferred language missing English or French name; id: [${id}]`);
    }

    return { id, nameEn, nameFr };
  }

  mapPreferredLanguageEntitiesToPreferredLanguageDtos(preferredLanguageEntities: PreferredLanguageEntity[]): PreferredLanguageDto[] {
    return preferredLanguageEntities.map((entity) => this.mapPreferredLanguageEntityToPreferredLanguageDto(entity));
  }
}
