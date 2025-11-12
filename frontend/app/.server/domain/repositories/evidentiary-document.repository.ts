import { inject, injectable } from 'inversify';
import { URL } from 'node:url';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { EvidentiaryDocumentEntity, EvidentiaryDocumentResponseEntity, FindEvidentiaryDocumentsRequest } from '~/.server/domain/entities';
import type { HttpClient } from '~/.server/http';
import { createLogger } from '~/.server/logging';
import type { Logger } from '~/.server/logging';
import { HttpStatusCodes } from '~/constants/http-status-codes';

/**
 * A repository that provides access to evidentiary document data.
 */
export interface EvidentiaryDocumentRepository {
  /**
   * Finds evidentiary documents based on the provided request object.
   *
   * @param findEvidentiaryDocumentsRequest The request object containing the client ID and userId for auditing.
   * @returns A promise that resolves to an array of evidentiary document entities.
   */
  findEvidentiaryDocuments(findEvidentiaryDocumentsRequest: FindEvidentiaryDocumentsRequest): Promise<ReadonlyArray<EvidentiaryDocumentEntity>>;

  /**
   * Retrieves metadata associated with the evidentiary documents repository.
   *
   * @returns A record where the keys and values are strings representing metadata information.
   */
  getMetadata(): Record<string, string>;

  /**
   * Performs a health check to ensure that the evidentiary documents repository is operational.
   *
   * @throws An error if the health check fails or the repository is unavailable.
   * @returns A promise that resolves when the health check completes successfully.
   */
  checkHealth(): Promise<void>;
}

export type DefaultEvidentiaryDocumentRepositoryServerConfig = Pick<ServerConfig, 'HTTP_PROXY_URL' | 'INTEROP_API_BASE_URI' | 'INTEROP_API_SUBSCRIPTION_KEY' | 'INTEROP_API_MAX_RETRIES' | 'INTEROP_API_BACKOFF_MS'>;

@injectable()
export class DefaultEvidentiaryDocumentRepository implements EvidentiaryDocumentRepository {
  private readonly log: Logger;
  private readonly serverConfig: DefaultEvidentiaryDocumentRepositoryServerConfig;
  private readonly httpClient: HttpClient;
  private readonly baseUrl: string;

  constructor(
    @inject(TYPES.ServerConfig) serverConfig: DefaultEvidentiaryDocumentRepositoryServerConfig, //
    @inject(TYPES.HttpClient) httpClient: HttpClient,
  ) {
    this.log = createLogger('DefaultEvidentiaryDocumentRepository');
    this.serverConfig = serverConfig;
    this.httpClient = httpClient;
    this.baseUrl = `${this.serverConfig.INTEROP_API_BASE_URI}/dental-care/doc-metadata/pp/v1`;
  }

  async findEvidentiaryDocuments(findEvidentiaryDocumentsRequest: FindEvidentiaryDocumentsRequest): Promise<ReadonlyArray<EvidentiaryDocumentEntity>> {
    this.log.debug('Fetching evidentiary documents for client: [%s]', findEvidentiaryDocumentsRequest.clientID);
    this.log.trace('Fetching evidentiary documents for request [%j]', findEvidentiaryDocumentsRequest);

    const url = new URL(`${this.baseUrl}/esdc_evidentiarydocuments`);

    // Build query parameters as per spec
    url.searchParams.set('$select', 'esdc_filename,_esdc_documenttypeid_value,esdc_uploaddate');
    url.searchParams.set('$expand', 'esdc_Clientid($select=esdc_firstname,esdc_lastname),esdc_DocumentTypeid($select=esdc_nameenglish,esdc_namefrench)');
    url.searchParams.set('$filter', `statuscode eq 1 and _esdc_clientid_value eq '${findEvidentiaryDocumentsRequest.clientID}'`);

    const response = await this.httpClient.instrumentedFetch('http.client.interop-api.evidentiary-documents.gets', url, {
      method: 'GET',
      headers: {
        'Ocp-Apim-Subscription-Key': this.serverConfig.INTEROP_API_SUBSCRIPTION_KEY,
      },
      retryOptions: {
        retries: this.serverConfig.INTEROP_API_MAX_RETRIES,
        backoffMs: this.serverConfig.INTEROP_API_BACKOFF_MS,
        retryConditions: {
          [HttpStatusCodes.BAD_GATEWAY]: [],
        },
      },
    });

    if (!response.ok) {
      this.log.error('%j', {
        message: 'Failed to fetch evidentiary documents',
        status: response.status,
        statusText: response.statusText,
        url: url.toString(),
        clientID: findEvidentiaryDocumentsRequest.clientID,
        responseBody: await response.text(),
      });
      throw new Error(`Failed to fetch evidentiary documents. Status: ${response.status}, Status Text: ${response.statusText}`);
    }

    const documentResponseEntity = (await response.json()) as EvidentiaryDocumentResponseEntity;
    const documentEntities = this.mapResponseToEntities(documentResponseEntity);

    this.log.trace('Returning evidentiary documents [%j]', documentEntities);
    return documentEntities;
  }

  private mapResponseToEntities(response: EvidentiaryDocumentResponseEntity): ReadonlyArray<EvidentiaryDocumentEntity> {
    return response.value.map((doc) => ({
      id: doc.esdc_evidentiarydocumentid,
      fileName: doc.esdc_filename,
      clientID: doc.esdc_Clientid.esdc_clientid,
      documentTypeId: doc._esdc_documenttypeid_value,
      mscaUploadDate: doc.esdc_uploaddate,
      client: {
        id: doc.esdc_Clientid.esdc_clientid,
        firstName: doc.esdc_Clientid.esdc_firstname,
        lastName: doc.esdc_Clientid.esdc_lastname,
      },
      documentType: {
        id: doc.esdc_DocumentTypeid.esdc_evidentiarydocumenttypeid,
        nameEnglish: doc.esdc_DocumentTypeid.esdc_nameenglish,
        nameFrench: doc.esdc_DocumentTypeid.esdc_namefrench,
      },
    }));
  }

  getMetadata(): Record<string, string> {
    return {
      baseUrl: this.baseUrl,
    };
  }

  async checkHealth(): Promise<void> {
    await this.findEvidentiaryDocuments({
      clientID: '00000000-0000-0000-0000-000000000000',
      userId: 'health-check',
    });
  }
}

@injectable()
export class MockEvidentiaryDocumentRepository implements EvidentiaryDocumentRepository {
  private readonly log: Logger;

  constructor() {
    this.log = createLogger('MockEvidentiaryDocumentRepository');
  }

  async findEvidentiaryDocuments(findEvidentiaryDocumentsRequest: FindEvidentiaryDocumentsRequest): Promise<ReadonlyArray<EvidentiaryDocumentEntity>> {
    this.log.debug('Fetch evidentiary documents for client: [%s]', findEvidentiaryDocumentsRequest.clientID);
    this.log.trace('Fetch evidentiary documents for request [%j]', findEvidentiaryDocumentsRequest);

    // Updated mock data to match the new structure
    const mockEvidentiaryDocumentEntities: ReadonlyArray<EvidentiaryDocumentEntity> = [
      {
        id: 'aff431b7-9bae-f011-bbd3-7c1e520630db',
        fileName: 'Benefit Provider Letter.pdf',
        clientID: findEvidentiaryDocumentsRequest.clientID,
        documentTypeId: '70a54c5a-9f9f-f011-bbd2-7ced8d05477c',
        mscaUploadDate: '2025-10-21T16:33:31Z',
        client: {
          id: findEvidentiaryDocumentsRequest.clientID,
          firstName: 'Liam',
          lastName: 'Anderson',
        },
        documentType: {
          id: '70a54c5a-9f9f-f011-bbd2-7ced8d05477c',
          nameEnglish: 'Benefit Provider Letter',
          nameFrench: 'Benefit Provider Letter [FR]',
        },
      },
      {
        id: '01968123-96ae-f011-bbd3-7c1e52408057',
        fileName: 'Employer Letter.pdf',
        clientID: findEvidentiaryDocumentsRequest.clientID,
        documentTypeId: 'de3c6d3c-9f9f-f011-bbd2-7ced8d05477c',
        mscaUploadDate: '2025-10-21T15:53:11Z',
        client: {
          id: findEvidentiaryDocumentsRequest.clientID,
          firstName: 'Liam',
          lastName: 'Anderson',
        },
        documentType: {
          id: 'de3c6d3c-9f9f-f011-bbd2-7ced8d05477c',
          nameEnglish: 'Employer Letter',
          nameFrench: 'Employer Letter [FR]',
        },
      },
    ];

    this.log.trace('Returning evidentiary documents [%j]', mockEvidentiaryDocumentEntities);
    return await Promise.resolve(mockEvidentiaryDocumentEntities);
  }

  getMetadata(): Record<string, string> {
    return {
      mockEnabled: 'true',
    };
  }

  async checkHealth(): Promise<void> {
    return await Promise.resolve();
  }
}
