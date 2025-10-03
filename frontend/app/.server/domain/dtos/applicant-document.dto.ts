import type { ReadonlyDeep } from 'type-fest';

/**
 * DTO representing an applicant document.
 */
export type ApplicantDocumentDto = ReadonlyDeep<{
  id: string;
  fileName: string;
  clientNumber: string;
  firstName: string;
  lastName: string;
  documentType: string;
  uploadedAt: string; // ISO 8601 date string
  receivedAt?: string; // ISO 8601 date string
}>;

/*
 * Request object for listing applicant documents.
 */
export type ListApplicantDocumentsRequest = Readonly<{
  /** The client number of the applicant. */
  clientNumber: string;

  /** A unique identifier for the applicant - used for auditing */
  userId: string;
}>;
