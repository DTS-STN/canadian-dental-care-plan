export type DocumentUploadResponseEntity = Readonly<{
  Error: DocumentUploadErrorEntity | null;
  DocumentFileName: string | null;
}>;

export type DocumentUploadErrorEntity = Readonly<{
  ErrorCode: string;
  ErrorMessage: string;
}>;

export type DocumentScanResponseEntity = Readonly<{
  Error: DocumentUploadErrorEntity | null;
  Percent: string | null;
}>;

export type DocumentUploadRequestEntity = Readonly<{
  filename: string;
  binary: string;
  subjectPersonIdentificationID: string;
  documentCategoryText: string;
  originalDocumentCreationDate: string;
}>;

export type DocumentScanRequestEntity = Readonly<{
  filename: string;
  binary: string;
}>;
