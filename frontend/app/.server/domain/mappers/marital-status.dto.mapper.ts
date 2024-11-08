import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { MaritalStatusDto, MaritalStatusLocalizedDto } from '~/.server/domain/dtos';
import type { MaritalStatusEntity } from '~/.server/domain/entities';

export interface MaritalStatusDtoMapper {
  mapMaritalStatusDtoToMaritalStatusLocalizedDto(maritalStatusDto: MaritalStatusDto, locale: AppLocale): MaritalStatusLocalizedDto;
  mapMaritalStatusDtosToMaritalStatusLocalizedDtos(maritalStatusDtos: ReadonlyArray<MaritalStatusDto>, locale: AppLocale): ReadonlyArray<MaritalStatusLocalizedDto>;
  mapMaritalStatusEntityToMaritalStatusDto(maritalStatusEntity: MaritalStatusEntity): MaritalStatusDto;
  mapMaritalStatusEntitiesToMaritalStatusDtos(maritalStatusEntities: ReadonlyArray<MaritalStatusEntity>): ReadonlyArray<MaritalStatusDto>;
}

export type MaritalStatusDtoMapperImpl_ServerConfig = Pick<ServerConfig, 'ENGLISH_LANGUAGE_CODE' | 'FRENCH_LANGUAGE_CODE'>;

@injectable()
export class MaritalStatusDtoMapperImpl implements MaritalStatusDtoMapper {
  constructor(@inject(TYPES.configs.ServerConfig) private readonly serverConfig: MaritalStatusDtoMapperImpl_ServerConfig) {}

  mapMaritalStatusDtoToMaritalStatusLocalizedDto(maritalStatusDto: MaritalStatusDto, locale: AppLocale): MaritalStatusLocalizedDto {
    const { nameEn, nameFr, ...rest } = maritalStatusDto;
    return {
      ...rest,
      name: locale === 'fr' ? nameFr : nameEn,
    };
  }

  mapMaritalStatusDtosToMaritalStatusLocalizedDtos(maritalStatusDtos: ReadonlyArray<MaritalStatusDto>, locale: AppLocale): ReadonlyArray<MaritalStatusLocalizedDto> {
    return maritalStatusDtos.map((dto) => this.mapMaritalStatusDtoToMaritalStatusLocalizedDto(dto, locale));
  }

  mapMaritalStatusEntityToMaritalStatusDto(maritalStatusEntity: MaritalStatusEntity): MaritalStatusDto {
    const { ENGLISH_LANGUAGE_CODE, FRENCH_LANGUAGE_CODE } = this.serverConfig;

    const id = maritalStatusEntity.Value.toString();
    const nameEn = maritalStatusEntity.Label.LocalizedLabels.find((label) => label.LanguageCode === ENGLISH_LANGUAGE_CODE)?.Label;
    const nameFr = maritalStatusEntity.Label.LocalizedLabels.find((label) => label.LanguageCode === FRENCH_LANGUAGE_CODE)?.Label;

    if (nameEn === undefined || nameFr === undefined) {
      throw new Error(`Marital status missing English or French name; id: [${id}]`);
    }

    return { id, nameEn, nameFr };
  }

  mapMaritalStatusEntitiesToMaritalStatusDtos(maritalStatusEntities: ReadonlyArray<MaritalStatusEntity>): ReadonlyArray<MaritalStatusDto> {
    return maritalStatusEntities.map((entity) => this.mapMaritalStatusEntityToMaritalStatusDto(entity));
  }
}
