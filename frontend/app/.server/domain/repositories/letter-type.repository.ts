import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { LetterTypeEntity } from '~/.server/domain/entities';
import type { HttpClient } from '~/.server/http';
import { createLogger } from '~/.server/logging';
import type { Logger } from '~/.server/logging';
import letterTypeJsonDataSource from '~/.server/resources/power-platform/letter-type.json';
import { HttpStatusCodes } from '~/constants/http-status-codes';

export interface LetterTypeRepository {
  /**
   * Fetch all letter type entities.
   * @returns All letter type entities.
   */
  listAllLetterTypes(): Promise<ReadonlyArray<LetterTypeEntity>>;

  /**
   * Fetch a letter type entity by its id.
   * @param id The id of the letter type entity.
   * @returns The letter type entity or null if not found.
   */
  findLetterTypeById(id: string): Promise<LetterTypeEntity | null>;
}

export type DefaultLetterTypeRepositoryServerConfig = Pick<ServerConfig, 'HTTP_PROXY_URL' | 'INTEROP_API_BASE_URI' | 'INTEROP_API_SUBSCRIPTION_KEY' | 'INTEROP_API_MAX_RETRIES' | 'INTEROP_API_BACKOFF_MS'>;

@injectable()
export class DefaultLetterTypeRepository implements LetterTypeRepository {
  private readonly log: Logger;
  private readonly serverConfig: DefaultLetterTypeRepositoryServerConfig;
  private readonly httpClient: HttpClient;

  constructor(@inject(TYPES.configs.ServerConfig) serverConfig: DefaultLetterTypeRepositoryServerConfig, @inject(TYPES.http.HttpClient) httpClient: HttpClient) {
    this.log = createLogger('DefaultLetterTypeRepository');
    this.serverConfig = serverConfig;
    this.httpClient = httpClient;
  }

  async listAllLetterTypes(): Promise<ReadonlyArray<LetterTypeEntity>> {
    this.log.trace('Fetching all letter types');

    const url = new URL(`${this.serverConfig.INTEROP_API_BASE_URI}/dental-care/code-list/pp/v1/esdc_cctlettertypes`);
    url.searchParams.set('$select', 'esdc_portalnameenglish,esdc_portalnamefrench,_esdc_parentid_value,esdc_value');
    url.searchParams.set('$filter', 'esdc_displayonportal eq 1 and statecode eq 0');
    url.searchParams.set('$expand', 'esdc_ParentId($select=esdc_portalnameenglish,esdc_portalnamefrench');
    const response = await this.httpClient.instrumentedFetch('http.client.interop-api.letter-types.gets', url, {
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
        message: 'Failed to fetch letter types',
        status: response.status,
        statusText: response.statusText,
        url,
        responseBody: await response.text(),
      });
      throw new Error(`Failed to fetch letter types. Status: ${response.status}, Status Text: ${response.statusText}`);
    }

    const letterTypeEntities: LetterTypeEntity[] = await response.json();
    this.log.trace('Letter types: [%j]', letterTypeEntities);

    return letterTypeEntities;
  }

  async findLetterTypeById(id: string): Promise<LetterTypeEntity | null> {
    this.log.debug('Fetching letter type with id: [%s]', id);

    const letterTypeEntities = await this.listAllLetterTypes();
    const letterTypeEntity = letterTypeEntities.find((letter) => letter.esdc_value === id);

    if (!letterTypeEntity) {
      this.log.warn('Letter type not found; id: [%s]', id);
      return null;
    }

    this.log.trace('Returning letter type: [%j]', letterTypeEntity);
    return letterTypeEntity;
  }
}

@injectable()
export class MockLetterTypeRepository implements LetterTypeRepository {
  private readonly log: Logger;

  constructor() {
    this.log = createLogger('MockLetterTypeRepository');
  }

  async listAllLetterTypes(): Promise<ReadonlyArray<LetterTypeEntity>> {
    this.log.debug('Fetching all letter types');
    const letterTypeEntities = letterTypeJsonDataSource.value;

    this.log.trace('Returning letter types: [%j]', letterTypeEntities);
    return await Promise.resolve(letterTypeEntities);
  }

  async findLetterTypeById(id: string): Promise<LetterTypeEntity | null> {
    this.log.debug('Fetching letter type with id: [%s]', id);

    const letterTypeEntities = letterTypeJsonDataSource.value;
    const letterTypeEntity = letterTypeEntities.find(({ esdc_value }) => esdc_value === id);

    if (!letterTypeEntity) {
      this.log.warn('Letter type not found; id: [%s]', id);
      return null;
    }

    return await Promise.resolve(letterTypeEntity);
  }
}
