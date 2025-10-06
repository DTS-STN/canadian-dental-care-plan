import type { ReadonlyDeep } from 'type-fest';

/**
 * DTO representing an evidentiary document.
 */
export type EvidentiaryDocumentDto = ReadonlyDeep<{
  id: string;
  /** The name of the applicant. */
  name: string;
  fileName: string;
  clientID: string;
  documentTypeId: string;
  mscaUploadDate: string; // ISO 8601 date string
  healthCanadaTransferDate?: string; // ISO 8601 date string
}>;

/*
 * Request object for listing evidentiary documents.
 */
export type ListEvidentiaryDocumentsRequest = Readonly<{
  /** The client ID of the applicant. */
  clientID: string;

  /** A unique identifier for the applicant - used for auditing */
  userId: string;
}>;
