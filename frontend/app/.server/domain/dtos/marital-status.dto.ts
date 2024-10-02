/**
 * Represents a Data Transfer Object (DTO) for a marital status.
 */
export type MaritalStatusDto = Readonly<{
  /** Unique identifier for the marital status. */
  id: string;

  /** Marital status name in English. */
  nameEn: string;

  /** Marital status name in French. */
  nameFr: string;
}>;

/**
 * Represents a localized version of a marital status DTO.
 */
export type MaritalStatusLocalizedDto = Omit<MaritalStatusDto, 'nameEn' | 'nameFr'> &
  Readonly<{
    /** Localized name of the marital status. */
    name: string;
  }>;
