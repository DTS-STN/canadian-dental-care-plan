/**
 * Represents a Data Transfer Object (DTO) for a evidentiary document type.
 */
export type EvidentiaryDocumentTypeDto = Readonly<{
  /** Unique identifier for the evidentiary document type. */
  id: string;

  /** EvidentiaryDocument type in English. */
  nameEn: string;

  /** EvidentiaryDocument type in French. */
  nameFr: string;
}>;

/**
 * Represents a localized version of a evidentiary document type DTO.
 */
export type EvidentiaryDocumentTypeLocalizedDto = Omit<EvidentiaryDocumentTypeDto, 'nameEn' | 'nameFr'> &
  Readonly<{
    /** Localized name of the evidentiary document type. */
    name: string;
  }>;
