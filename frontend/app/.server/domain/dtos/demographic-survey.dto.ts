/**
 * Represents a Data Transfer Object (DTO) for a indigenous status.
 */
export type IndigenousStatusDto = Readonly<{
  /** Unique identifier for the indigenous status. */
  id: string;

  /** indigenous status name in English. */
  nameEn: string;

  /** indigenous status name in French. */
  nameFr: string;
}>;

/**
 * Represents a localized version of a indigenous status DTO.
 */
export type IndigenousStatusLocalizedDto = Omit<IndigenousStatusDto, 'nameEn' | 'nameFr'> &
  Readonly<{
    /** Localized name of the indigenous status. */
    name: string;
  }>;

/**
 * Represents a Data Transfer Object (DTO) for a disability status.
 */
export type DisabilityStatusDto = Readonly<{
  /** Unique identifier for the disability status. */
  id: string;

  /** disability status name in English. */
  nameEn: string;

  /** disability status name in French. */
  nameFr: string;
}>;

/**
 * Represents a localized version of a disability status DTO.
 */
export type DisabilityStatusLocalizedDto = Omit<DisabilityStatusDto, 'nameEn' | 'nameFr'> &
  Readonly<{
    /** Localized name of the disability status. */
    name: string;
  }>;

/**
 * Represents a Data Transfer Object (DTO) for a ethnic group.
 */
export type EthnicGroupDto = Readonly<{
  /** Unique identifier for the ethnic group. */
  id: string;

  /** ethnic group name in English. */
  nameEn: string;

  /** ethnic group name in French. */
  nameFr: string;
}>;

/**
 * Represents a localized version of a ethnic group DTO.
 */
export type EthnicGroupLocalizedDto = Omit<EthnicGroupDto, 'nameEn' | 'nameFr'> &
  Readonly<{
    /** Localized name of the ethnic group. */
    name: string;
  }>;

/**
 * Represents a Data Transfer Object (DTO) for a location born status.
 */
export type LocationBornStatusDto = Readonly<{
  /** Unique identifier for the location born status. */
  id: string;

  /** location born status name in English. */
  nameEn: string;

  /** location born status name in French. */
  nameFr: string;
}>;

/**
 * Represents a localized version of a location born status DTO.
 */
export type LocationBornStatusLocalizedDto = Omit<LocationBornStatusDto, 'nameEn' | 'nameFr'> &
  Readonly<{
    /** Localized name of the location born status. */
    name: string;
  }>;

/**
 * Represents a Data Transfer Object (DTO) for a gender status.
 */
export type GenderStatusDto = Readonly<{
  /** Unique identifier for the gender status. */
  id: string;

  /** gender status name in English. */
  nameEn: string;

  /** gender status name in French. */
  nameFr: string;
}>;

/**
 * Represents a localized version of a gender status DTO.
 */
export type GenderStatusLocalizedDto = Omit<GenderStatusDto, 'nameEn' | 'nameFr'> &
  Readonly<{
    /** Localized name of the gender status. */
    name: string;
  }>;
