import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { CountriesWithProvinceTerritoryStates, ProvinceTerritoryStateEntity } from '~/.server/domain/entities';
import type { HttpClient } from '~/.server/http';
import { createLogger } from '~/.server/logging';
import type { Logger } from '~/.server/logging';
import provinceTerritoryStateJsonDataSource from '~/.server/resources/power-platform/province-territory-state.json';
import { HttpStatusCodes } from '~/constants/http-status-codes';

export interface ProvinceTerritoryStateRepository {
  /**
   * Fetch all province territory state entities.
   * @returns All province territory state entities.
   */
  listAllProvinceTerritoryStates(): Promise<ProvinceTerritoryStateEntity[]>;

  /**
   * Fetch a province territory state entity by its id.
   * @param id The id of the province territory state entity.
   * @returns The province territory state entity or null if not found.
   */
  findProvinceTerritoryStateById(id: string): Promise<ProvinceTerritoryStateEntity | null>;

  /**
   * Fetch a province territory state entity by its id.
   * @param id The id of the province territory state entity.
   * @returns The province territory state entity or null if not found.
   */
  findProvinceTerritoryStateByCode(code: string): Promise<ProvinceTerritoryStateEntity | null>;
}

export type DefaultProvinceTerritoryStateRepositoryServerConfig = Pick<ServerConfig, 'HTTP_PROXY_URL' | 'INTEROP_API_BASE_URI' | 'INTEROP_API_SUBSCRIPTION_KEY' | 'INTEROP_API_MAX_RETRIES' | 'INTEROP_API_BACKOFF_MS'>;

@injectable()
export class DefaultProvinceTerritoryStateRepository implements ProvinceTerritoryStateRepository {
  private readonly log: Logger;
  private readonly serverConfig: DefaultProvinceTerritoryStateRepositoryServerConfig;
  private readonly httpClient: HttpClient;

  constructor(@inject(TYPES.configs.ServerConfig) serverConfig: DefaultProvinceTerritoryStateRepositoryServerConfig, @inject(TYPES.http.HttpClient) httpClient: HttpClient) {
    this.log = createLogger('DefaultProvinceTerritoryStateRepository');
    this.serverConfig = serverConfig;
    this.httpClient = httpClient;
  }

  async listAllProvinceTerritoryStates(): Promise<ProvinceTerritoryStateEntity[]> {
    this.log.trace('Fetching all province territory states');

    const url = new URL(`${this.serverConfig.INTEROP_API_BASE_URI}/dental-care/code-list/pp/v1/esdc_countries`);
    url.searchParams.set('$select', 'esdc_groupkey');
    url.searchParams.set('$filter', 'statecode eq 0 and esdc_groupkey ne null');
    url.searchParams.set('$expand', 'esdc_ProvinceTerritoryState_Countryid_esd($select=esdc_provinceterritorystateid,esdc_nameenglish,esdc_namefrench,esdc_internationalalphacode;$filter=statecode eq 0 and esdc_enabledentalapplicationportal eq true)');
    const response = await this.httpClient.instrumentedFetch('http.client.interop-api.province-territory-states.gets', url, {
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
        message: 'Failed to fetch provinces, territories, and states',
        status: response.status,
        statusText: response.statusText,
        url,
        responseBody: await response.text(),
      });
      throw new Error(`Failed to fetch provinces, territories, and states. Status: ${response.status}, Status Text: ${response.statusText}`);
    }

    const countriesWithprovinceTerritoryStates: CountriesWithProvinceTerritoryStates = await response.json();
    const provinceTerritoryStateEntities: ProvinceTerritoryStateEntity[] = countriesWithprovinceTerritoryStates.value.flatMap((e) => e.esdc_ProvinceTerritoryState_Countryid_esd);
    this.log.trace('Provinces, territories, and states: [%j]', provinceTerritoryStateEntities);

    return provinceTerritoryStateEntities;
  }

  async findProvinceTerritoryStateById(id: string): Promise<ProvinceTerritoryStateEntity | null> {
    this.log.debug('Fetching provinces, territories, and states with id: [%s]', id);

    const provinceTerritoryStateEntities = await this.listAllProvinceTerritoryStates();
    const provinceTerritoryEntity = provinceTerritoryStateEntities.find((status) => status.esdc_provinceterritorystateid === id);

    if (!provinceTerritoryEntity) {
      this.log.warn('ProvinceTerritoryState not found; id: [%s]', id);
      return null;
    }

    this.log.trace('Returning province, territory, and state : [%j]', provinceTerritoryEntity);
    return provinceTerritoryEntity;
  }

  async findProvinceTerritoryStateByCode(code: string): Promise<ProvinceTerritoryStateEntity | null> {
    this.log.debug('Fetching provinces, territories, and states with id: [%s]', code);

    const provinceTerritoryStateEntities = await this.listAllProvinceTerritoryStates();
    const provinceTerritoryEntity = provinceTerritoryStateEntities.find((status) => status.esdc_internationalalphacode === code);

    if (!provinceTerritoryEntity) {
      this.log.warn('ProvinceTerritoryState not found; code: [%s]', code);
      return null;
    }

    this.log.trace('Returning province, territory, and state : [%j]', provinceTerritoryEntity);
    return provinceTerritoryEntity;
  }
}

@injectable()
export class MockProvinceTerritoryStateRepository implements ProvinceTerritoryStateRepository {
  private readonly log: Logger;

  constructor() {
    this.log = createLogger('MockProvinceTerritoryStateRepository');
  }

  async listAllProvinceTerritoryStates(): Promise<ProvinceTerritoryStateEntity[]> {
    this.log.debug('Fetching all province territory states');
    const provinceTerritoryStateEntities = provinceTerritoryStateJsonDataSource.value.flatMap((e) => e.esdc_ProvinceTerritoryState_Countryid_esd);

    if (provinceTerritoryStateEntities.length === 0) {
      this.log.warn('No province territory states found');
      return [];
    }

    this.log.trace('Returning province territory states: [%j]', provinceTerritoryStateEntities);
    return await Promise.resolve(provinceTerritoryStateEntities);
  }

  async findProvinceTerritoryStateById(id: string): Promise<ProvinceTerritoryStateEntity | null> {
    this.log.debug('Fetching province territory state with id: [%s]', id);

    const provinceTerritoryStateEntities = provinceTerritoryStateJsonDataSource.value.flatMap((e) => e.esdc_ProvinceTerritoryState_Countryid_esd);
    const provinceTerritoryStateEntity = provinceTerritoryStateEntities.find(({ esdc_provinceterritorystateid }) => esdc_provinceterritorystateid === id);

    if (!provinceTerritoryStateEntity) {
      this.log.warn('ProvinceTerritoryState not found; id: [%s]', id);
      return null;
    }

    return await Promise.resolve(provinceTerritoryStateEntity);
  }

  async findProvinceTerritoryStateByCode(code: string): Promise<ProvinceTerritoryStateEntity | null> {
    this.log.debug('Fetching province territory state with code: [%s]', code);

    const provinceTerritoryStateEntities = provinceTerritoryStateJsonDataSource.value.flatMap((e) => e.esdc_ProvinceTerritoryState_Countryid_esd);
    const provinceTerritoryStateEntity = provinceTerritoryStateEntities.find(({ esdc_internationalalphacode }) => esdc_internationalalphacode === code);

    if (!provinceTerritoryStateEntity) {
      this.log.warn('ProvinceTerritoryState not found; code: [%s]', code);
      return null;
    }

    return await Promise.resolve(provinceTerritoryStateEntity);
  }
}
