import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type {
  DisabilityStatusDto,
  DisabilityStatusLocalizedDto,
  EthnicGroupDto,
  EthnicGroupLocalizedDto,
  FirstNationsDto,
  FirstNationsLocalizedDto,
  GenderStatusDto,
  GenderStatusLocalizedDto,
  IndigenousStatusDto,
  IndigenousStatusLocalizedDto,
  LocationBornStatusDto,
  LocationBornStatusLocalizedDto,
} from '~/.server/domain/dtos';
import type { DisabilityStatusEntity, EthnicGroupEntity, FirstNationsEntity, GenderStatusEntity, IndigenousStatusEntity, LocationBornStatusEntity } from '~/.server/domain/entities';

export interface DemographicSurveyDtoMapper {
  mapIndigenousStatusDtoToIndigenousStatusLocalizedDto(indigenousStatusDto: IndigenousStatusDto, locale: AppLocale): IndigenousStatusLocalizedDto;
  mapIndigenousStatusDtosToIndigenousStatusLocalizedDtos(indigenousStatusDtos: ReadonlyArray<IndigenousStatusDto>, locale: AppLocale): ReadonlyArray<IndigenousStatusLocalizedDto>;
  mapIndigenousStatusEntityToIndigenousStatusDto(indigenousStatusEntity: IndigenousStatusEntity): IndigenousStatusDto;
  mapIndigenousStatusEntitiesToIndigenousStatusDtos(indigenousStatusEntities: ReadonlyArray<IndigenousStatusEntity>): ReadonlyArray<IndigenousStatusDto>;

  mapFirstNationsDtoToFirstNationsLocalizedDto(firstNationsDto: FirstNationsDto, locale: AppLocale): FirstNationsLocalizedDto;
  mapFirstNationsDtosToFirstNationsLocalizedDtos(firstNationsDtos: ReadonlyArray<FirstNationsDto>, locale: AppLocale): ReadonlyArray<FirstNationsLocalizedDto>;
  mapFirstNationsEntityToFirstNationsDto(firstNationsEntity: FirstNationsEntity): FirstNationsDto;
  mapFirstNationsEntitiesToFirstNationsDtos(firstNationsEntities: ReadonlyArray<FirstNationsEntity>): ReadonlyArray<FirstNationsDto>;

  mapDisabilityStatusDtoToDisabilityStatusLocalizedDto(disabilityStatusDto: DisabilityStatusDto, locale: AppLocale): DisabilityStatusLocalizedDto;
  mapDisabilityStatusDtosToDisabilityStatusLocalizedDtos(disabilityStatusDtos: ReadonlyArray<DisabilityStatusDto>, locale: AppLocale): ReadonlyArray<DisabilityStatusLocalizedDto>;
  mapDisabilityStatusEntityToDisabilityStatusDto(disabilityStatusEntity: DisabilityStatusEntity): DisabilityStatusDto;
  mapDisabilityStatusEntitiesToDisabilityStatusDtos(disabilityStatusEntities: ReadonlyArray<DisabilityStatusEntity>): ReadonlyArray<DisabilityStatusDto>;

  mapEthnicGroupDtoToEthnicGroupLocalizedDto(ethnicGroupDto: EthnicGroupDto, locale: AppLocale): EthnicGroupLocalizedDto;
  mapEthnicGroupDtosToEthnicGroupLocalizedDtos(ethnicGroupDtos: ReadonlyArray<EthnicGroupDto>, locale: AppLocale): ReadonlyArray<EthnicGroupLocalizedDto>;
  mapEthnicGroupEntityToEthnicGroupDto(ethnicGroupEntity: EthnicGroupEntity): EthnicGroupDto;
  mapEthnicGroupEntitiesToEthnicGroupDtos(ethnicGroupEntities: ReadonlyArray<EthnicGroupEntity>): ReadonlyArray<EthnicGroupDto>;

  mapLocationBornStatusDtoToLocationBornStatusLocalizedDto(locationBornStatusDto: LocationBornStatusDto, locale: AppLocale): LocationBornStatusLocalizedDto;
  mapLocationBornStatusDtosToLocationBornStatusLocalizedDtos(locationBornStatusDtos: ReadonlyArray<LocationBornStatusDto>, locale: AppLocale): ReadonlyArray<LocationBornStatusLocalizedDto>;
  mapLocationBornStatusEntityToLocationBornStatusDto(locationBornStatusEntity: LocationBornStatusEntity): LocationBornStatusDto;
  mapLocationBornStatusEntitiesToLocationBornStatusDtos(locationBornStatusEntities: ReadonlyArray<LocationBornStatusEntity>): ReadonlyArray<LocationBornStatusDto>;

  mapGenderStatusDtoToGenderStatusLocalizedDto(genderStatusDto: GenderStatusDto, locale: AppLocale): GenderStatusLocalizedDto;
  mapGenderStatusDtosToGenderStatusLocalizedDtos(genderStatusDtos: ReadonlyArray<GenderStatusDto>, locale: AppLocale): ReadonlyArray<GenderStatusLocalizedDto>;
  mapGenderStatusEntityToGenderStatusDto(genderStatusEntity: GenderStatusEntity): GenderStatusDto;
  mapGenderStatusEntitiesToGenderStatusDtos(genderStatusEntities: ReadonlyArray<GenderStatusEntity>): ReadonlyArray<GenderStatusDto>;
}

export type DemographicSurveyDtoMapperImpl_ServerConfig = Pick<ServerConfig, 'ENGLISH_LANGUAGE_CODE' | 'FRENCH_LANGUAGE_CODE'>;

@injectable()
export class DefaultDemographicSurveyDtoMapper implements DemographicSurveyDtoMapper {
  constructor(@inject(TYPES.configs.ServerConfig) private readonly serverConfig: DemographicSurveyDtoMapperImpl_ServerConfig) {}

  // Indigenous status
  mapIndigenousStatusDtoToIndigenousStatusLocalizedDto(indigenousStatusDto: IndigenousStatusDto, locale: AppLocale): IndigenousStatusLocalizedDto {
    const { nameEn, nameFr, ...rest } = indigenousStatusDto;
    return {
      ...rest,
      name: locale === 'fr' ? nameFr : nameEn,
    };
  }

  mapIndigenousStatusDtosToIndigenousStatusLocalizedDtos(indigenousStatusDtos: ReadonlyArray<IndigenousStatusDto>, locale: AppLocale): ReadonlyArray<IndigenousStatusLocalizedDto> {
    return indigenousStatusDtos.map((dto) => this.mapIndigenousStatusDtoToIndigenousStatusLocalizedDto(dto, locale));
  }

  mapIndigenousStatusEntityToIndigenousStatusDto(indigenousStatusEntity: IndigenousStatusEntity): IndigenousStatusDto {
    const { ENGLISH_LANGUAGE_CODE, FRENCH_LANGUAGE_CODE } = this.serverConfig;

    const id = indigenousStatusEntity.Value.toString();
    const nameEn = indigenousStatusEntity.Label.LocalizedLabels.find((label) => label.LanguageCode === ENGLISH_LANGUAGE_CODE)?.Label;
    const nameFr = indigenousStatusEntity.Label.LocalizedLabels.find((label) => label.LanguageCode === FRENCH_LANGUAGE_CODE)?.Label;

    if (nameEn === undefined || nameFr === undefined) {
      throw new Error(`Indigenous status missing English or French name; id: [${id}]`);
    }

    return { id, nameEn, nameFr };
  }

  mapIndigenousStatusEntitiesToIndigenousStatusDtos(indigenousStatusEntities: ReadonlyArray<IndigenousStatusEntity>): ReadonlyArray<IndigenousStatusDto> {
    return indigenousStatusEntities.map((entity) => this.mapIndigenousStatusEntityToIndigenousStatusDto(entity));
  }

  // First Nations
  mapFirstNationsDtoToFirstNationsLocalizedDto(firstNationsDto: FirstNationsDto, locale: AppLocale): FirstNationsLocalizedDto {
    const { nameEn, nameFr, ...rest } = firstNationsDto;
    return {
      ...rest,
      name: locale === 'fr' ? nameFr : nameEn,
    };
  }

  mapFirstNationsDtosToFirstNationsLocalizedDtos(firstNationsDtos: ReadonlyArray<FirstNationsDto>, locale: AppLocale): ReadonlyArray<FirstNationsLocalizedDto> {
    return firstNationsDtos.map((dto) => this.mapFirstNationsDtoToFirstNationsLocalizedDto(dto, locale));
  }

  mapFirstNationsEntityToFirstNationsDto(firstNationsEntity: FirstNationsEntity): FirstNationsDto {
    const { ENGLISH_LANGUAGE_CODE, FRENCH_LANGUAGE_CODE } = this.serverConfig;

    const id = firstNationsEntity.Value.toString();
    const nameEn = firstNationsEntity.Label.LocalizedLabels.find((label) => label.LanguageCode === ENGLISH_LANGUAGE_CODE)?.Label;
    const nameFr = firstNationsEntity.Label.LocalizedLabels.find((label) => label.LanguageCode === FRENCH_LANGUAGE_CODE)?.Label;

    if (nameEn === undefined || nameFr === undefined) {
      throw new Error(`First Nations missing English or French name; id: [${id}]`);
    }

    return { id, nameEn, nameFr };
  }

  mapFirstNationsEntitiesToFirstNationsDtos(firstNationsEntities: ReadonlyArray<FirstNationsEntity>): ReadonlyArray<FirstNationsDto> {
    return firstNationsEntities.map((entity) => this.mapFirstNationsEntityToFirstNationsDto(entity));
  }

  // Disability status
  mapDisabilityStatusDtoToDisabilityStatusLocalizedDto(disabilityStatusDto: DisabilityStatusDto, locale: AppLocale): DisabilityStatusLocalizedDto {
    const { nameEn, nameFr, ...rest } = disabilityStatusDto;
    return {
      ...rest,
      name: locale === 'fr' ? nameFr : nameEn,
    };
  }

  mapDisabilityStatusDtosToDisabilityStatusLocalizedDtos(disabilityStatusDtos: ReadonlyArray<DisabilityStatusDto>, locale: AppLocale): ReadonlyArray<DisabilityStatusLocalizedDto> {
    return disabilityStatusDtos.map((dto) => this.mapDisabilityStatusDtoToDisabilityStatusLocalizedDto(dto, locale));
  }

  mapDisabilityStatusEntityToDisabilityStatusDto(disabilityStatusEntity: DisabilityStatusEntity): DisabilityStatusDto {
    const { ENGLISH_LANGUAGE_CODE, FRENCH_LANGUAGE_CODE } = this.serverConfig;

    const id = disabilityStatusEntity.Value.toString();
    const nameEn = disabilityStatusEntity.Label.LocalizedLabels.find((label) => label.LanguageCode === ENGLISH_LANGUAGE_CODE)?.Label;
    const nameFr = disabilityStatusEntity.Label.LocalizedLabels.find((label) => label.LanguageCode === FRENCH_LANGUAGE_CODE)?.Label;

    if (nameEn === undefined || nameFr === undefined) {
      throw new Error(`Disability status missing English or French name; id: [${id}]`);
    }

    return { id, nameEn, nameFr };
  }

  mapDisabilityStatusEntitiesToDisabilityStatusDtos(disabilityStatusEntities: ReadonlyArray<DisabilityStatusEntity>): ReadonlyArray<DisabilityStatusDto> {
    return disabilityStatusEntities.map((entity) => this.mapDisabilityStatusEntityToDisabilityStatusDto(entity));
  }

  //Ethnic groups
  mapEthnicGroupDtoToEthnicGroupLocalizedDto(ethnicGroupDto: EthnicGroupDto, locale: AppLocale): EthnicGroupLocalizedDto {
    const { nameEn, nameFr, ...rest } = ethnicGroupDto;
    return {
      ...rest,
      name: locale === 'fr' ? nameFr : nameEn,
    };
  }

  mapEthnicGroupDtosToEthnicGroupLocalizedDtos(ethnicGroupDtos: ReadonlyArray<EthnicGroupDto>, locale: AppLocale): ReadonlyArray<EthnicGroupLocalizedDto> {
    return ethnicGroupDtos.map((dto) => this.mapEthnicGroupDtoToEthnicGroupLocalizedDto(dto, locale));
  }

  mapEthnicGroupEntityToEthnicGroupDto(ethnicGroupEntity: EthnicGroupEntity): EthnicGroupDto {
    const { ENGLISH_LANGUAGE_CODE, FRENCH_LANGUAGE_CODE } = this.serverConfig;

    const id = ethnicGroupEntity.Value.toString();
    const nameEn = ethnicGroupEntity.Label.LocalizedLabels.find((label) => label.LanguageCode === ENGLISH_LANGUAGE_CODE)?.Label;
    const nameFr = ethnicGroupEntity.Label.LocalizedLabels.find((label) => label.LanguageCode === FRENCH_LANGUAGE_CODE)?.Label;

    if (nameEn === undefined || nameFr === undefined) {
      throw new Error(`Ethnic group missing English or French name; id: [${id}]`);
    }

    return { id, nameEn, nameFr };
  }

  mapEthnicGroupEntitiesToEthnicGroupDtos(ethnicGroupEntities: ReadonlyArray<EthnicGroupEntity>): ReadonlyArray<EthnicGroupDto> {
    return ethnicGroupEntities.map((entity) => this.mapEthnicGroupEntityToEthnicGroupDto(entity));
  }

  // Location born status
  mapLocationBornStatusDtoToLocationBornStatusLocalizedDto(locationBornStatusDto: LocationBornStatusDto, locale: AppLocale): LocationBornStatusLocalizedDto {
    const { nameEn, nameFr, ...rest } = locationBornStatusDto;
    return {
      ...rest,
      name: locale === 'fr' ? nameFr : nameEn,
    };
  }

  mapLocationBornStatusDtosToLocationBornStatusLocalizedDtos(locationBornStatusDtos: ReadonlyArray<LocationBornStatusDto>, locale: AppLocale): ReadonlyArray<LocationBornStatusLocalizedDto> {
    return locationBornStatusDtos.map((dto) => this.mapLocationBornStatusDtoToLocationBornStatusLocalizedDto(dto, locale));
  }

  mapLocationBornStatusEntityToLocationBornStatusDto(locationBornStatusEntity: LocationBornStatusEntity): LocationBornStatusDto {
    const { ENGLISH_LANGUAGE_CODE, FRENCH_LANGUAGE_CODE } = this.serverConfig;

    const id = locationBornStatusEntity.Value.toString();
    const nameEn = locationBornStatusEntity.Label.LocalizedLabels.find((label) => label.LanguageCode === ENGLISH_LANGUAGE_CODE)?.Label;
    const nameFr = locationBornStatusEntity.Label.LocalizedLabels.find((label) => label.LanguageCode === FRENCH_LANGUAGE_CODE)?.Label;

    if (nameEn === undefined || nameFr === undefined) {
      throw new Error(`Location born status missing English or French name; id: [${id}]`);
    }

    return { id, nameEn, nameFr };
  }

  mapLocationBornStatusEntitiesToLocationBornStatusDtos(locationBornStatusEntities: ReadonlyArray<LocationBornStatusEntity>): ReadonlyArray<LocationBornStatusDto> {
    return locationBornStatusEntities.map((entity) => this.mapLocationBornStatusEntityToLocationBornStatusDto(entity));
  }

  // Gender status
  mapGenderStatusDtoToGenderStatusLocalizedDto(genderStatusDto: GenderStatusDto, locale: AppLocale): GenderStatusLocalizedDto {
    const { nameEn, nameFr, ...rest } = genderStatusDto;
    return {
      ...rest,
      name: locale === 'fr' ? nameFr : nameEn,
    };
  }

  mapGenderStatusDtosToGenderStatusLocalizedDtos(genderStatusDtos: ReadonlyArray<GenderStatusDto>, locale: AppLocale): ReadonlyArray<GenderStatusLocalizedDto> {
    return genderStatusDtos.map((dto) => this.mapGenderStatusDtoToGenderStatusLocalizedDto(dto, locale));
  }

  mapGenderStatusEntityToGenderStatusDto(genderStatusEntity: GenderStatusEntity): GenderStatusDto {
    const { ENGLISH_LANGUAGE_CODE, FRENCH_LANGUAGE_CODE } = this.serverConfig;

    const id = genderStatusEntity.Value.toString();
    const nameEn = genderStatusEntity.Label.LocalizedLabels.find((label) => label.LanguageCode === ENGLISH_LANGUAGE_CODE)?.Label;
    const nameFr = genderStatusEntity.Label.LocalizedLabels.find((label) => label.LanguageCode === FRENCH_LANGUAGE_CODE)?.Label;

    if (nameEn === undefined || nameFr === undefined) {
      throw new Error(`Gender status missing English or French name; id: [${id}]`);
    }

    return { id, nameEn, nameFr };
  }

  mapGenderStatusEntitiesToGenderStatusDtos(genderStatusEntities: ReadonlyArray<GenderStatusEntity>): ReadonlyArray<GenderStatusDto> {
    return genderStatusEntities.map((entity) => this.mapGenderStatusEntityToGenderStatusDto(entity));
  }
}
