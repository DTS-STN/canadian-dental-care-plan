import { injectable } from 'inversify';

import type { CountryDto } from '~/.server/domain/dtos';
import type { CountryEntity } from '~/.server/domain/entities';

export interface CountryDtoMapper {
  mapCountryEntityToCountryDto(countryEntity: CountryEntity): CountryDto;
  mapCountryEntitiesToCountryDtos(countryEntities: CountryEntity[]): CountryDto[];
}

@injectable()
export class CountryDtoMapperImpl implements CountryDtoMapper {
  mapCountryEntityToCountryDto(countryEntity: CountryEntity): CountryDto {
    const id = countryEntity.esdc_countryid.toString();
    const nameEn = countryEntity.esdc_nameenglish;
    const nameFr = countryEntity.esdc_namefrench;
    return { id, nameEn, nameFr };
  }

  mapCountryEntitiesToCountryDtos(countryEntities: CountryEntity[]): CountryDto[] {
    return countryEntities.map((entity) => this.mapCountryEntityToCountryDto(entity));
  }
}
