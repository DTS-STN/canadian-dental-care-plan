/**
 * Represents a Data Transfer Object (DTO) for Document Upload request.
 */
export type DocumentUploadRequestDto = Readonly<{
  /** Client identifier */
  clientId: string;

  /** Original file name provided by user */
  fileName: string;

  /** Base64 encoded bytes from the file being uploaded */
  binary: string;

  /** Evidentiary document type identifier */
  evidentiaryDocumentTypeId: string;

  /** Upload date */
  uploadDate: Date;

  /** A unique identifier for the user making the request - used for auditing */
  userId: string;
}>;

/**
 * Represents a Data Transfer Object (DTO) for Document Upload response.
 */
export type DocumentUploadResponseDto = Readonly<{
  /** Error information if the operation failed */
  Error: DocumentUploadErrorDto | null;

  /** The generated document file name if successful */
  DocumentFileName: string | null;
}>;

/**
 * Represents a Data Transfer Object (DTO) for Document Upload error.
 */
export type DocumentUploadErrorDto = Readonly<{
  /** Error code */
  ErrorCode: string;

  /** Error message */
  ErrorMessage: string;
}>;

/**
 * Represents a Data Transfer Object (DTO) for Document Scan request.
 */
export type DocumentScanRequestDto = Readonly<{
  /** Original file name provided by user */
  fileName: string;

  /** Base64 encoded bytes from the file being uploaded */
  binary: string;

  /** A unique identifier for the user making the request - used for auditing */
  userId: string;
}>;

/**
 * Represents a Data Transfer Object (DTO) for Document Scan response.
 */
export type DocumentScanResponseDto = Readonly<{
  /** Error information if the operation failed */
  Error: DocumentUploadErrorDto | null;

  /** Scan completion percentage (100 = completed) */
  Percent: string | null;
}>;
