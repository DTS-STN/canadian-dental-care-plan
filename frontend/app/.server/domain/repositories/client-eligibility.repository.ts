import { inject, injectable } from 'inversify';
import { None, Option, Some } from 'oxide.ts';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { ClientEligibilityEntity, ClientEligibilityRequestEntity } from '~/.server/domain/entities/client-eligibility.entity';
import type { HttpClient } from '~/.server/http';
import type { Logger } from '~/.server/logging';
import { createLogger } from '~/.server/logging';
import clientEligibilityJsonDataSource from '~/.server/resources/power-platform/client-eligibility.json';

export interface ClientEligibilityRepository {
  /**
   * Finds client eligibility by client number.
   * @param clientEligibilityRequestEntity The request object containing the client number.
   * @returns A Promise that resolves to the client eligibility entity if found, or None otherwise.
   */
  findClientEligibilityByClientNumber(clientEligibilityRequestEntity: ClientEligibilityRequestEntity): Promise<Option<ClientEligibilityEntity>>;
}

@injectable()
export class DefaultClientEligibilityRepository implements ClientEligibilityRepository {
  private readonly log: Logger;
  private readonly serverConfig: Pick<ServerConfig, 'INTEROP_API_BASE_URI' | 'HTTP_PROXY_URL' | 'INTEROP_API_SUBSCRIPTION_KEY'>;
  private readonly httpClient: HttpClient;

  constructor(
    @inject(TYPES.ServerConfig)
    serverConfig: Pick<ServerConfig, 'INTEROP_API_BASE_URI' | 'HTTP_PROXY_URL' | 'INTEROP_API_SUBSCRIPTION_KEY'>,
    @inject(TYPES.HttpClient)
    httpClient: HttpClient,
  ) {
    this.log = createLogger('DefaultClientEligibilityRepository');
    this.serverConfig = serverConfig;
    this.httpClient = httpClient;
  }

  async findClientEligibilityByClientNumber(clientEligibilityRequestEntity: ClientEligibilityRequestEntity): Promise<Option<ClientEligibilityEntity>> {
    this.log.trace('Fetching client eligibility for client number [%j]', clientEligibilityRequestEntity);

    const url = new URL(`${this.serverConfig.INTEROP_API_BASE_URI}/dts/applicant-eligibility`);
    const response = await this.httpClient.instrumentedFetch('http.client.interop-api.applicant-eligibility_by-client-number.posts', url, {
      proxyUrl: this.serverConfig.HTTP_PROXY_URL,
    });

    if (response.status === 200) {
      const data = (await response.json()) as ClientEligibilityEntity;
      this.log.trace('Client eligibility [%j]', data);
      return Some(data);
    }

    if (response.status === 204) {
      this.log.trace('Client eligibility not found for client number [%j]', clientEligibilityRequestEntity);
      return None;
    }

    this.log.error('%j', {
      message: "Failed to 'POST' for client eligibility by client number",
      status: response.status,
      statusText: response.statusText,
      url: url,
      responseBody: await response.text(),
    });

    throw new Error(`Failed to 'POST' for client eligibility by client number. Status: ${response.status}, Status Text: ${response.statusText}`);
  }
}

@injectable()
export class MockClientEligibilityRepository implements ClientEligibilityRepository {
  private readonly log: Logger;

  constructor() {
    this.log = createLogger('MockClientEligibilityRepository');
  }
  async findClientEligibilityByClientNumber(clientEligibilityRequestEntity: ClientEligibilityRequestEntity): Promise<Option<ClientEligibilityEntity>> {
    this.log.debug('Fetching client eligibility for client number [%j]', clientEligibilityRequestEntity);

    const personClientNumberIdentification = clientEligibilityRequestEntity.Applicant.PersonClientNumberIdentification.IdentificationID;
    const jsonDataSource = clientEligibilityJsonDataSource[0];

    const clientEligibilityEntity: ClientEligibilityEntity = {
      ...jsonDataSource,
      Applicant: {
        ...jsonDataSource.Applicant,
        ClientIdentification: [{ IdentificationID: personClientNumberIdentification, IdentificationCategoryText: 'Client Number' }],
      },
    };

    this.log.debug('Client eligibility [%j]', clientEligibilityEntity);
    return await Promise.resolve(Some(clientEligibilityEntity));
  }
}
