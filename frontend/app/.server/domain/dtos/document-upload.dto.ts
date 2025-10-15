/**
 * Represents a Data Transfer Object (DTO) for Document Upload request.
 */
export type DocumentUploadRequestDto = Readonly<{
  /** Encapsulation username given by EWDU */
  username: string;

  /** Encapsulation password given by EWDU */
  password: string;

  /** Original file name provided by user */
  fileName: string;

  /** Base64 encoded bytes from the file being uploaded */
  binary: string;

  /** Code to designate desired library in repository */
  ProgramActivityIdentificationID: string;

  /** Name of the application uploading */
  ApplicationProfileName?: string;

  /** Category of document being uploaded to the repository */
  DocumentCategoryText?: string;

  /** The identification of the case associated with the document */
  CaseNumberText?: string;

  /** The identification of the person who is the main subject of/in the uploaded document */
  SubjectPersonIdentificationID?: string;

  /** The original document creation date as provided by the partner system. Format UTC ISO 8601 */
  OriginalDocumentCreationDate?: string;

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
  /** Encapsulation username given by EWDU */
  username: string;

  /** Encapsulation password given by EWDU */
  password: string;

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
