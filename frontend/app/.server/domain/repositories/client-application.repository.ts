import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { ClientApplicationBasicInfoRequestEntity, ClientApplicationEntity, ClientApplicationSinRequestEntity } from '~/.server/domain/entities';
import type { LogFactory, Logger } from '~/.server/factories';
import { getFetchFn, instrumentedFetch } from '~/utils/fetch-utils.server';

/**
 * A repository that provides access to client application data.
 */
export interface ClientApplicationRepository {
  /**
   * Finds a client application by basic info.
   *
   * @param clientApplicationBasicInfoRequestEntity The basic info request entity.
   * @returns A Promise that resolves to the client application entity if found, or `null` otherwise.
   */
  findClientApplicationByBasicInfo(clientApplicationBasicInfoRequestEntity: ClientApplicationBasicInfoRequestEntity): Promise<ClientApplicationEntity | null>;

  /**
   * Finds a client application by SIN.
   *
   * @param clientApplicationSinRequestEntity The SIN request entity.
   * @returns A Promise that resolves to the client application entity if found, or `null` otherwise.
   */
  findClientApplicationBySin(clientApplicationSinRequestEntity: ClientApplicationSinRequestEntity): Promise<ClientApplicationEntity | null>;
}

@injectable()
export class ClientApplicationRepositoryImpl implements ClientApplicationRepository {
  private readonly log: Logger;

  constructor(
    @inject(TYPES.LogFactory) logFactory: LogFactory,
    @inject(TYPES.ServerConfig) private readonly serverConfig: Pick<ServerConfig, 'INTEROP_API_BASE_URI' | 'HTTP_PROXY_URL' | 'INTEROP_API_SUBSCRIPTION_KEY'>,
  ) {
    this.log = logFactory.createLogger('ClientApplicationRepositoryImpl');
  }

  async findClientApplicationByBasicInfo(clientApplicationBasicInfoRequestEntity: ClientApplicationBasicInfoRequestEntity): Promise<ClientApplicationEntity | null> {
    this.log.trace('Fetching client application for basic info [%j]', clientApplicationBasicInfoRequestEntity);

    const url = new URL(`${this.serverConfig.INTEROP_API_BASE_URI}/dental-care/applicant-information/dts/v1/benefit-application?action=GET`);
    const response = await instrumentedFetch(getFetchFn(this.serverConfig.HTTP_PROXY_URL), 'http.client.interop-api.client-application_by-basic-info.posts', url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': this.serverConfig.INTEROP_API_SUBSCRIPTION_KEY,
      },
      body: JSON.stringify(clientApplicationBasicInfoRequestEntity),
    });

    if (response.ok) {
      const data = await response.json();
      this.log.trace('Client application [%j]', data);
      return data;
    }

    if (response.status === 404) {
      this.log.trace('Client application not found for basic info [%j]', clientApplicationBasicInfoRequestEntity);
      return null;
    }

    this.log.error('%j', {
      message: "Failed to 'POST' for client application data",
      status: response.status,
      statusText: response.statusText,
      url: url,
      responseBody: await response.text(),
    });
    throw new Error(`Failed to 'POST' for client application data. Status: ${response.status}, Status Text: ${response.statusText}`);
  }

  async findClientApplicationBySin(clientApplicationSinRequestEntity: ClientApplicationSinRequestEntity): Promise<ClientApplicationEntity | null> {
    this.log.trace('Fetching client application for sin [%j]', clientApplicationSinRequestEntity);

    const url = new URL(`${this.serverConfig.INTEROP_API_BASE_URI}/dental-care/applicant-information/dts/v1/benefit-application?action=GET`);
    const response = await instrumentedFetch(getFetchFn(this.serverConfig.HTTP_PROXY_URL), 'http.client.interop-api.client-application_by-sin.posts', url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': this.serverConfig.INTEROP_API_SUBSCRIPTION_KEY,
      },
      body: JSON.stringify(clientApplicationSinRequestEntity),
    });

    if (!response.ok) {
      this.log.error('%j', {
        message: "Failed to 'POST' for client application data",
        status: response.status,
        statusText: response.statusText,
        url: url,
        responseBody: await response.text(),
      });

      throw new Error(`Failed to 'POST' for client application data. Status: ${response.status}, Status Text: ${response.statusText}`);
    }

    const data = await response.json();
    this.log.trace('Client application [%j]', data);

    return data;
  }
}
