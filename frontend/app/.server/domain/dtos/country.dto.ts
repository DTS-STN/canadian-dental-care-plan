/**
 * Represents a Data Transfer Object (DTO) for a country.
 */
export interface CountryDto {
  /** Unique identifier for the country. */
  readonly id: string;

  /** Country name in English. */
  readonly nameEn: string;

  /** Country name in French. */
  readonly nameFr: string;
}

/**
 * Represents a localized version of the Country DTO.
 * Inherits the country ID and provides a single localized name.
 */
export interface CountryLocalizedDto extends OmitStrict<Readonly<CountryDto>, 'nameEn' | 'nameFr'> {
  /** Localized name for the country. */
  readonly name: string;
}
