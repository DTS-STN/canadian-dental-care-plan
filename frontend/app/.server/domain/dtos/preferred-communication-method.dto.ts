/**
 * DTO for a preferred communication method.
 */
export type PreferredCommunicationMethodDto = Readonly<{
  /**
   * The ID of the preferred communication method.
   */
  id: string;
  /**
   * The English name of the preferred communication method.
   */
  nameEn: string;
  /**
   * The French name of the preferred communication method.
   */
  nameFr: string;
}>;

/** DTO for a preferred communication method with localized name. */
export type PreferredCommunicationMethodLocalizedDto = OmitStrict<PreferredCommunicationMethodDto, 'nameEn' | 'nameFr'> &
  Readonly<{
    /** Localized name of the preferred communication method. */
    name: string;
  }>;
