/**
 * Represents a Data Transfer Object (DTO) for a preferred language.
 */
export type PreferredLanguageDto = Readonly<{
  /* The unique identifier for the preferred language. */
  id: string;

  /* The English name of the preferred language. */
  nameEn: string;

  /* The French name of the preferred language. */
  nameFr: string;
}>;

/**
 * Represents a localized version of a preferred language.
 */
export type PreferredLanguageLocalizedDto = OmitStrict<PreferredLanguageDto, 'nameEn' | 'nameFr'> &
  Readonly<{
    /* The localized name of the preferred language. */
    name: string;
  }>;
