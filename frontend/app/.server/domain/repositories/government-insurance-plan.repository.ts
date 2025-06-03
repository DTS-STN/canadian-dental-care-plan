import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { GovernmentInsurancePlanEntity } from '~/.server/domain/entities';
import type { HttpClient } from '~/.server/http';
import { createLogger } from '~/.server/logging';
import type { Logger } from '~/.server/logging';
import governmentInsurancePlanJsonDataSource from '~/.server/resources/power-platform/government-insurance-plan.json';
import { HttpStatusCodes } from '~/constants/http-status-codes';

export interface GovernmentInsurancePlanRepository {
  /**
   * Fetch all federal government insurance plan entities.
   * @returns All federal government insurance plan entities.
   */
  listAllFederalGovernmentInsurancePlans(): Promise<GovernmentInsurancePlanEntity[]>;

  /**
   * Fetch a federal government insurance plan entity by its id.
   * @param id The id of the federal government insurance plan entity.
   * @returns The federal government insurance plan entity or null if not found.
   */
  findFederalGovernmentInsurancePlanById(id: string): Promise<GovernmentInsurancePlanEntity | null>;

  /**
   * Fetch all provincial government insurance plan entities.
   * @returns All provincial government insurance plan entities.
   */
  listAllProvincialGovernmentInsurancePlans(): Promise<GovernmentInsurancePlanEntity[]>;

  /**
   * Fetch a provincial government insurance plan entity by its id.
   * @param id The id of the provincial government insurance plan entity.
   * @returns The provincial government insurance plan entity or null if not found.
   */
  findProvincialGovernmentInsurancePlanById(id: string): Promise<GovernmentInsurancePlanEntity | null>;
}

export type DefaultGovernmentInsurancePlanRepositoryServerConfig = Pick<ServerConfig, 'HTTP_PROXY_URL' | 'INTEROP_API_BASE_URI' | 'INTEROP_API_SUBSCRIPTION_KEY' | 'INTEROP_API_MAX_RETRIES' | 'INTEROP_API_BACKOFF_MS'>;

@injectable()
export class DefaultGovernmentInsurancePlanRepository implements GovernmentInsurancePlanRepository {
  private readonly log: Logger;
  private readonly serverConfig: DefaultGovernmentInsurancePlanRepositoryServerConfig;
  private readonly httpClient: HttpClient;

  constructor(@inject(TYPES.configs.ServerConfig) serverConfig: DefaultGovernmentInsurancePlanRepositoryServerConfig, @inject(TYPES.http.HttpClient) httpClient: HttpClient) {
    this.log = createLogger('DefaultGovernmentInsurancePlanRepository');
    this.serverConfig = serverConfig;
    this.httpClient = httpClient;
  }

  async listAllFederalGovernmentInsurancePlans(): Promise<GovernmentInsurancePlanEntity[]> {
    this.log.trace('Fetching all federal government insurance plans');

    const url = new URL(`${this.serverConfig.INTEROP_API_BASE_URI}/dental-care/code-list/pp/v1/governmentinsuranceplans`);
    url.searchParams.set('$select', ' esdc_governmentinsuranceplanid,esdc_nameenglish,esdc_namefrench,_esdc_provinceterritorystateid_value');
    url.searchParams.set('$filter', 'statecode eq 0');
    const response = await this.httpClient.instrumentedFetch('http.client.interop-api.government-insurance-plans.gets', url, {
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
        message: 'Failed to fetch federal government insurance plans',
        status: response.status,
        statusText: response.statusText,
        url,
        responseBody: await response.text(),
      });
      throw new Error(`Failed to fetch federal government insurance plans. Status: ${response.status}, Status Text: ${response.statusText}`);
    }

    const federalGovernmentInsurancePlanEntities: GovernmentInsurancePlanEntity[] = await response.json();
    this.log.trace('Federal government insurance plans: [%j]', federalGovernmentInsurancePlanEntities);

    return federalGovernmentInsurancePlanEntities.filter((plan) => plan._esdc_provinceterritorystateid_value === null);
  }

  async findFederalGovernmentInsurancePlanById(id: string): Promise<GovernmentInsurancePlanEntity | null> {
    this.log.debug('Fetching federal government insurance plan with id: [%s]', id);

    const federalGovernmentInsurancePlanEntities = await this.listAllFederalGovernmentInsurancePlans();
    const federalGovernmentInsurancePlanEntity = federalGovernmentInsurancePlanEntities.find((plan) => plan.esdc_governmentinsuranceplanid === id);

    if (!federalGovernmentInsurancePlanEntity) {
      this.log.warn('Federal government insurance plan not found; id: [%s]', id);
      return null;
    }

    this.log.trace('Returning federal government insurance plan: [%j]', federalGovernmentInsurancePlanEntity);
    return federalGovernmentInsurancePlanEntity;
  }

  async listAllProvincialGovernmentInsurancePlans(): Promise<GovernmentInsurancePlanEntity[]> {
    this.log.trace('Fetching all provincial government insurance plans');

    const url = new URL(`${this.serverConfig.INTEROP_API_BASE_URI}/dental-care/code-list/pp/v1/governmentinsuranceplans`);
    url.searchParams.set('$select', ' esdc_governmentinsuranceplanid,esdc_nameenglish,esdc_namefrench,_esdc_provinceterritorystateid_value');
    url.searchParams.set('$filter', 'statecode eq 0');
    const response = await this.httpClient.instrumentedFetch('http.client.interop-api.government-insurance-plans.gets', url, {
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
        message: 'Failed to fetch provincial government insurance plans',
        status: response.status,
        statusText: response.statusText,
        url,
        responseBody: await response.text(),
      });
      throw new Error(`Failed to fetch provincial government insurance plans. Status: ${response.status}, Status Text: ${response.statusText}`);
    }

    const provincialGovernmentInsurancePlanEntities: GovernmentInsurancePlanEntity[] = await response.json();
    this.log.trace('Provincial government insurance plans: [%j]', provincialGovernmentInsurancePlanEntities);

    return provincialGovernmentInsurancePlanEntities.filter((plan) => plan._esdc_provinceterritorystateid_value !== null);
  }

  async findProvincialGovernmentInsurancePlanById(id: string): Promise<GovernmentInsurancePlanEntity | null> {
    this.log.debug('Fetching provincial government insurance plan with id: [%s]', id);

    const provincialGovernmentInsurancePlanEntities = await this.listAllProvincialGovernmentInsurancePlans();
    const provincialGovernmentInsurancePlanEntity = provincialGovernmentInsurancePlanEntities.find((plan) => plan.esdc_governmentinsuranceplanid === id);

    if (!provincialGovernmentInsurancePlanEntity) {
      this.log.warn('Provincial government insurance plan not found; id: [%s]', id);
      return null;
    }

    this.log.trace('Returning provincial government insurance plan: [%j]', provincialGovernmentInsurancePlanEntity);
    return provincialGovernmentInsurancePlanEntity;
  }
}

@injectable()
export class MockGovernmentInsurancePlanRepository implements GovernmentInsurancePlanRepository {
  private readonly log: Logger;

  constructor() {
    this.log = createLogger('MockGovernmentInsurancePlanRepository');
  }

  async listAllFederalGovernmentInsurancePlans(): Promise<GovernmentInsurancePlanEntity[]> {
    this.log.debug('Fetching all federal government insurance plans');
    const federalGovernmentInsurancePlanEntities = governmentInsurancePlanJsonDataSource.value.filter(({ _esdc_provinceterritorystateid_value }) => _esdc_provinceterritorystateid_value === null);

    if (federalGovernmentInsurancePlanEntities.length === 0) {
      this.log.warn('No federal government insurance plans found');
      return [];
    }

    this.log.trace('Returning federal government insurance plans: [%j]', federalGovernmentInsurancePlanEntities);
    return await Promise.resolve(federalGovernmentInsurancePlanEntities);
  }

  async findFederalGovernmentInsurancePlanById(id: string): Promise<GovernmentInsurancePlanEntity | null> {
    this.log.debug('Fetching federal government insurance plan with id: [%s]', id);

    const federalGovernmentInsurancePlanEntities = governmentInsurancePlanJsonDataSource.value.filter(({ _esdc_provinceterritorystateid_value }) => _esdc_provinceterritorystateid_value === null);
    const federalGovernmentInsurancePlanEntity = federalGovernmentInsurancePlanEntities.find(({ esdc_governmentinsuranceplanid }) => esdc_governmentinsuranceplanid === id);

    if (!federalGovernmentInsurancePlanEntity) {
      this.log.info('Federal government insurance plan not found; id: [%s]', id);
      return null;
    }

    return await Promise.resolve(federalGovernmentInsurancePlanEntity);
  }

  async listAllProvincialGovernmentInsurancePlans(): Promise<GovernmentInsurancePlanEntity[]> {
    this.log.debug('Fetching all provincial government insurance plans');
    const provincialGovernmentInsurancePlanEntities = governmentInsurancePlanJsonDataSource.value.filter(({ _esdc_provinceterritorystateid_value }) => _esdc_provinceterritorystateid_value !== null);

    if (provincialGovernmentInsurancePlanEntities.length === 0) {
      this.log.warn('No provincial government insurance plans found');
      return [];
    }

    this.log.trace('Returning provincial government insurance plans: [%j]', provincialGovernmentInsurancePlanEntities);
    return await Promise.resolve(provincialGovernmentInsurancePlanEntities);
  }

  async findProvincialGovernmentInsurancePlanById(id: string): Promise<GovernmentInsurancePlanEntity | null> {
    this.log.debug('Fetching provincial government insurance plan with id: [%s]', id);

    const provincialGovernmentInsurancePlanEntities = governmentInsurancePlanJsonDataSource.value.filter(({ _esdc_provinceterritorystateid_value }) => _esdc_provinceterritorystateid_value !== null);
    const provincialGovernmentInsurancePlanEntity = provincialGovernmentInsurancePlanEntities.find(({ esdc_governmentinsuranceplanid }) => esdc_governmentinsuranceplanid === id);

    if (!provincialGovernmentInsurancePlanEntity) {
      this.log.info('Provincial government insurance plan not found; id: [%s]', id);
      return null;
    }

    return await Promise.resolve(provincialGovernmentInsurancePlanEntity);
  }
}
