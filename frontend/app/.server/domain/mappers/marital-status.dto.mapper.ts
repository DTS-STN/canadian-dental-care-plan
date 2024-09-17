import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs/server.config';
import { SERVICE_IDENTIFIER } from '~/.server/constants/service-identifier.contant';
import type { MaritalStatusDto } from '~/.server/domain/dtos/marital-status.dto';
import type { MaritalStatusEntity } from '~/.server/domain/entities/marital-status.entity';

export interface MaritalStatusDtoMapper {
  mapMaritalStatusEntityToMaritalStatusDto(maritalStatusEntity: MaritalStatusEntity): MaritalStatusDto;
  mapMaritalStatusEntitiesToMaritalStatusDtos(maritalStatusEntities: MaritalStatusEntity[]): MaritalStatusDto[];
}

@injectable()
export class MaritalStatusDtoMapperImpl implements MaritalStatusDtoMapper {
  constructor(@inject(SERVICE_IDENTIFIER.SERVER_CONFIG) private readonly serverConfig: Pick<ServerConfig, 'ENGLISH_LANGUAGE_CODE' | 'FRENCH_LANGUAGE_CODE'>) {}

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

  mapMaritalStatusEntitiesToMaritalStatusDtos(maritalStatusEntities: MaritalStatusEntity[]): MaritalStatusDto[] {
    return maritalStatusEntities.map((entity) => this.mapMaritalStatusEntityToMaritalStatusDto(entity));
  }
}