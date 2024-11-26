import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { LetterTypeDto, LetterTypeLocalizedDto } from '~/.server/domain/dtos';
import type { LetterTypeEntity } from '~/.server/domain/entities';

export interface LetterTypeDtoMapper {
  mapLetterTypeDtoToLetterTypeLocalizedDto(LetterTypeDto: LetterTypeDto, locale: AppLocale): LetterTypeLocalizedDto;
  mapLetterTypeDtosToLetterTypeLocalizedDtos(LetterTypeDtos: ReadonlyArray<LetterTypeDto>, locale: AppLocale): ReadonlyArray<LetterTypeLocalizedDto>;
  mapLetterTypeEntityToLetterTypeDto(LetterTypeEntity: LetterTypeEntity): LetterTypeDto;
  mapLetterTypeEntitiesToLetterTypeDtos(LetterTypeEntities: ReadonlyArray<LetterTypeEntity>): ReadonlyArray<LetterTypeDto>;
}

export type LetterTypeDtoMapperImpl_ServerConfig = Pick<ServerConfig, 'ENGLISH_LANGUAGE_CODE' | 'FRENCH_LANGUAGE_CODE'>;

@injectable()
export class DefaultLetterTypeDtoMapper implements LetterTypeDtoMapper {
  constructor(@inject(TYPES.configs.ServerConfig) private readonly serverConfig: LetterTypeDtoMapperImpl_ServerConfig) {}

  mapLetterTypeDtoToLetterTypeLocalizedDto(LetterTypeDto: LetterTypeDto, locale: AppLocale): LetterTypeLocalizedDto {
    const { nameEn, nameFr, ...rest } = LetterTypeDto;
    return {
      ...rest,
      name: locale === 'fr' ? nameFr : nameEn,
    };
  }

  mapLetterTypeDtosToLetterTypeLocalizedDtos(LetterTypeDtos: ReadonlyArray<LetterTypeDto>, locale: AppLocale): ReadonlyArray<LetterTypeLocalizedDto> {
    return LetterTypeDtos.map((dto) => this.mapLetterTypeDtoToLetterTypeLocalizedDto(dto, locale));
  }

  mapLetterTypeEntityToLetterTypeDto(LetterTypeEntity: LetterTypeEntity): LetterTypeDto {
    const { ENGLISH_LANGUAGE_CODE, FRENCH_LANGUAGE_CODE } = this.serverConfig;

    const id = LetterTypeEntity.Value.toString();
    const nameEn = LetterTypeEntity.Label.LocalizedLabels.find((label) => label.LanguageCode === ENGLISH_LANGUAGE_CODE)?.Label;
    const nameFr = LetterTypeEntity.Label.LocalizedLabels.find((label) => label.LanguageCode === FRENCH_LANGUAGE_CODE)?.Label;

    if (nameEn === undefined || nameFr === undefined) {
      throw new Error(`Letter type missing English or French name; id: [${id}]`);
    }

    return { id, nameEn, nameFr };
  }

  mapLetterTypeEntitiesToLetterTypeDtos(LetterTypeEntities: ReadonlyArray<LetterTypeEntity>): ReadonlyArray<LetterTypeDto> {
    return LetterTypeEntities.map((entity) => this.mapLetterTypeEntityToLetterTypeDto(entity));
  }
}
