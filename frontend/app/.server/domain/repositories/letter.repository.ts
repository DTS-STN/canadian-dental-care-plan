import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { SERVICE_IDENTIFIER } from '~/.server/constants';
import { LetterEntity, PdfEntity } from '~/.server/domain/entities';
import type { LogFactory, Logger } from '~/.server/factories';
import { getFetchFn, instrumentedFetch } from '~/utils/fetch-utils.server';

/**
 * A repository that provides access to letters.
 */
export interface LetterRepository {
  /**
   * Find all letter entities for a given client id.
   *
   * @param clientId The client id to find all letter entities for.
   * @returns A Promise that resolves to all letter entities found for a client id.
   */
  findLettersByClientId(clientId: string): Promise<ReadonlyArray<LetterEntity>>;

  /**
   * Retrieve the PDF entity associated with a specific letter id.
   *
   * @param letterId The letter id of the PDF entity.
   * @returns A Promise that resolves to the PDF entity for a letter id.
   */
  getPdfByLetterId(letterId: string): Promise<PdfEntity>;
}

@injectable()
export class LetterRepositoryImpl implements LetterRepository {
  private readonly log: Logger;

  constructor(
    @inject(SERVICE_IDENTIFIER.LOG_FACTORY) logFactory: LogFactory,
    @inject(SERVICE_IDENTIFIER.SERVER_CONFIG)
    private readonly serverConfig: Pick<ServerConfig, 'HTTP_PROXY_URL' | 'INTEROP_API_BASE_URI' | 'INTEROP_API_SUBSCRIPTION_KEY' | 'INTEROP_CCT_API_BASE_URI' | 'INTEROP_CCT_API_SUBSCRIPTION_KEY' | 'INTEROP_CCT_API_COMMUNITY'>,
  ) {
    this.log = logFactory.createLogger('LetterRepositoryImpl');
  }

  async findLettersByClientId(clientId: string): Promise<ReadonlyArray<LetterEntity>> {
    this.log.trace('Fetching letters for clientId [%s]', clientId);

    const url = new URL(`${this.serverConfig.INTEROP_CCT_API_BASE_URI ?? this.serverConfig.INTEROP_API_BASE_URI}/dental-care/client-letters/cct/v1/GetDocInfoByClientId`);
    url.searchParams.set('clientid', clientId);

    const response = await instrumentedFetch(getFetchFn(this.serverConfig.HTTP_PROXY_URL), 'http.client.interop-api.get-doc-info-by-client-id.gets', url, {
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': this.serverConfig.INTEROP_CCT_API_SUBSCRIPTION_KEY ?? this.serverConfig.INTEROP_API_SUBSCRIPTION_KEY,
        'cct-community': this.serverConfig.INTEROP_CCT_API_COMMUNITY,
      },
    });

    if (!response.ok) {
      this.log.error('%j', {
        message: 'Failed to find letters',
        status: response.status,
        statusText: response.statusText,
        url: url,
        responseBody: await response.text(),
      });

      throw new Error(`Failed to find letters. Status: ${response.status}, Status Text: ${response.statusText}`);
    }

    const letterEntities: ReadonlyArray<LetterEntity> = await response.json();
    this.log.trace('Returning letters [%j]', letterEntities);
    return letterEntities;
  }

  async getPdfByLetterId(letterId: string): Promise<PdfEntity> {
    this.log.trace('Fetching PDF for letterId [%s]', letterId);

    const url = new URL(`${this.serverConfig.INTEROP_CCT_API_BASE_URI ?? this.serverConfig.INTEROP_API_BASE_URI}/dental-care/client-letters/cct/v1/GetPdfByLetterId`);
    url.searchParams.set('id', letterId);

    const response = await instrumentedFetch(getFetchFn(this.serverConfig.HTTP_PROXY_URL), 'http.client.interop-api.get-pdf-by-client-id.gets', url, {
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': this.serverConfig.INTEROP_CCT_API_SUBSCRIPTION_KEY ?? this.serverConfig.INTEROP_API_SUBSCRIPTION_KEY,
        'cct-community': this.serverConfig.INTEROP_CCT_API_COMMUNITY,
      },
    });

    if (!response.ok) {
      this.log.error('%j', {
        message: 'Failed to get PDF',
        status: response.status,
        statusText: response.statusText,
        url: url,
        responseBody: await response.text(),
      });

      throw new Error(`Failed to get PDF. Status: ${response.status}, Status Text: ${response.statusText}`);
    }

    const pdfEntity: PdfEntity = await response.json();
    this.log.trace('Returning PDF [%j]', pdfEntity);
    return pdfEntity;
  }
}