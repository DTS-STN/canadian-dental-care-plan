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
