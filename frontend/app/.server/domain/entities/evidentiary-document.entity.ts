import type { ReadonlyDeep } from 'type-fest';

/**
 * Entity representing an evidentiary document.
 */
export type EvidentiaryDocumentEntity = ReadonlyDeep<{
  id: string;
  fileName: string;
  clientID: string;
  documentTypeId: string;
  mscaUploadDate: string; // ISO 8601 date string
  healthCanadaTransferDate?: string; // ISO 8601 date string
  client: {
    id: string;
    firstName: string;
    lastName: string;
  };
  documentType: {
    id: string;
    nameEnglish: string;
    nameFrench: string;
  };
}>;

export type FindEvidentiaryDocumentsRequest = Readonly<{
  /** The client ID of the applicant. */
  clientID: string;

  /** A unique identifier for the applicant - used for auditing */
  userId: string;
}>;

/**
 * Response entity from the Power Platform API
 */
export type EvidentiaryDocumentResponseEntity = ReadonlyDeep<{
  value: ReadonlyArray<{
    esdc_filename: string;
    _esdc_documenttypeid_value: string;
    esdc_evidentiarydocumentid: string;
    esdc_uploaddate: string;
    esdc_Clientid: {
      esdc_clientid: string;
      esdc_lastname: string;
      esdc_firstname: string;
    };
    esdc_DocumentTypeid: {
      esdc_namefrench: string;
      esdc_evidentiarydocumenttypeid: string;
      esdc_nameenglish: string;
    };
  }>;
}>;
