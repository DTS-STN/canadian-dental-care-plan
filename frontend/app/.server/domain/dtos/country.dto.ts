export interface CountryDto {
  id: string;
  nameEn: string;
  nameFr: string;
}

export interface CountryLocalizedDto extends OmitStrict<CountryDto, 'nameEn' | 'nameFr'> {
  id: string;
  name: string;
}
