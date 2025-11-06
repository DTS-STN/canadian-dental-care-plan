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
  fileName: string;
  binary: string;
  ApplicationProfileName?: string;
  DocumentCategoryText?: string;
  CaseNumberText?: string;
  SubjectPersonIdentificationID?: string;
  OriginalDocumentCreationDate?: string;
  userId: string;
}>;

export type DocumentScanRequestEntity = Readonly<{
  fileName: string;
  binary: string;
  userId: string;
}>;
