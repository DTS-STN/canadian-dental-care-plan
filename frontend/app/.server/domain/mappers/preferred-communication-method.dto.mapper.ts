import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { PreferredCommunicationMethodDto, PreferredCommunicationMethodLocalizedDto } from '~/.server/domain/dtos';
import type { PreferredCommunicationMethodEntity } from '~/.server/domain/entities';

export interface PreferredCommunicationMethodDtoMapper {
  mapPreferredCommunicationMethodDtoToPreferredCommunicationMethodLocalizedDto(preferredCommunicationMethodDto: PreferredCommunicationMethodDto, locale: AppLocale): PreferredCommunicationMethodLocalizedDto;
  mapPreferredCommunicationMethodDtosToPreferredCommunicationMethodLocalizedDtos(preferredCommunicationMethodDtos: ReadonlyArray<PreferredCommunicationMethodDto>, locale: AppLocale): ReadonlyArray<PreferredCommunicationMethodLocalizedDto>;
  mapPreferredCommunicationMethodEntitiesToPreferredCommunicationMethodDtos(preferredCommunicationMethodEntities: PreferredCommunicationMethodEntity[]): PreferredCommunicationMethodDto[];
  mapPreferredCommunicationMethodEntityToPreferredCommunicationMethodDto(preferredCommunicationMethodEntity: PreferredCommunicationMethodEntity): PreferredCommunicationMethodDto;
}

@injectable()
export class DefaultPreferredCommunicationMethodDtoMapper implements PreferredCommunicationMethodDtoMapper {
  constructor(@inject(TYPES.configs.ServerConfig) private readonly serverConfig: Pick<ServerConfig, 'ENGLISH_LANGUAGE_CODE' | 'FRENCH_LANGUAGE_CODE'>) {}

  mapPreferredCommunicationMethodDtoToPreferredCommunicationMethodLocalizedDto(preferredCommunicationMethodDto: PreferredCommunicationMethodDto, locale: AppLocale): PreferredCommunicationMethodLocalizedDto {
    const { nameEn, nameFr, ...rest } = preferredCommunicationMethodDto;
    return {
      ...rest,
      name: locale === 'fr' ? nameFr : nameEn,
    };
  }

  mapPreferredCommunicationMethodDtosToPreferredCommunicationMethodLocalizedDtos(preferredCommunicationMethodDtos: ReadonlyArray<PreferredCommunicationMethodDto>, locale: AppLocale): ReadonlyArray<PreferredCommunicationMethodLocalizedDto> {
    return preferredCommunicationMethodDtos.map((dto) => this.mapPreferredCommunicationMethodDtoToPreferredCommunicationMethodLocalizedDto(dto, locale));
  }

  mapPreferredCommunicationMethodEntityToPreferredCommunicationMethodDto(preferredCommunicationMethodEntity: PreferredCommunicationMethodEntity): PreferredCommunicationMethodDto {
    const { ENGLISH_LANGUAGE_CODE, FRENCH_LANGUAGE_CODE } = this.serverConfig;

    const id = preferredCommunicationMethodEntity.Value.toString();
    const nameEn = preferredCommunicationMethodEntity.Label.LocalizedLabels.find((label) => label.LanguageCode === ENGLISH_LANGUAGE_CODE)?.Label;
    const nameFr = preferredCommunicationMethodEntity.Label.LocalizedLabels.find((label) => label.LanguageCode === FRENCH_LANGUAGE_CODE)?.Label;

    if (nameEn === undefined || nameFr === undefined) {
      throw new Error(`Preferred communication method missing English or French name; id: [${id}]`);
    }

    return { id, nameEn, nameFr };
  }

  mapPreferredCommunicationMethodEntitiesToPreferredCommunicationMethodDtos(preferredCommunicationMethodEntities: PreferredCommunicationMethodEntity[]): PreferredCommunicationMethodDto[] {
    return preferredCommunicationMethodEntities.map((entity) => this.mapPreferredCommunicationMethodEntityToPreferredCommunicationMethodDto(entity));
  }
}
