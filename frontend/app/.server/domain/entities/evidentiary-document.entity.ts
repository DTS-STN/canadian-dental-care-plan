import type { ReadonlyDeep } from 'type-fest';

/**
 * Entity representing an evidentiary document.
 */
export type EvidentiaryDocumentEntity = ReadonlyDeep<{
  id: string;
  /** The name of the applicant. */
  name: string;
  fileName: string;
  clientID: string;
  documentTypeId: string;
  mscaUploadDate: string; // ISO 8601 date string
  healthCanadaTransferDate?: string; // ISO 8601 date string
}>;

export type FindEvidentiaryDocumentsRequest = Readonly<{
  /** The client ID of the applicant. */
  clientID: string;

  /** A unique identifier for the applicant - used for auditing */
  userId: string;
}>;
