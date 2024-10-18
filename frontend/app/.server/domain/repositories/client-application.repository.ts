import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { SERVICE_IDENTIFIER } from '~/.server/constants';
import type { ClientApplicationEntity } from '~/.server/domain/entities';
import type { LogFactory, Logger } from '~/.server/factories';
import { getFetchFn, instrumentedFetch } from '~/utils/fetch-utils.server';

export interface FindClientApplicationCriteria {
  /** The first name of the client. */
  firstName: string;
  /** The last name of the client. */
  lastName: string;
  /** The date of birth of the client in YYYY-MM-DD format. */
  dateOfBirth: string;
  /** The client number assigned to the client. */
  clientNumber: string;
}

/**
 * A repository that provides access to client application data.
 */
export interface ClientApplicationRepository {
  /**
   * Finds client application data by Social Insurance Number (SIN).
   *
   * @param sin The Social Insurance Number of the client.
   * @returns A Promise that resolves to the client application data if found, or `null` if not found.
   */
  findClientApplicationBySin(sin: string): Promise<ClientApplicationEntity | null>;

  /**
   * Finds client application data by first name, last name, date of birth, and client number.
   *
   * @param criteria An object containing the search criteria.
   * @returns A Promise that resolves to the client application data if found, or `null` if not found.
   */
  findClientApplicationByCriteria(criteria: FindClientApplicationCriteria): Promise<ClientApplicationEntity | null>;
}

@injectable()
export class ClientApplicationRepositoryImpl implements ClientApplicationRepository {
  private readonly log: Logger;

  constructor(
    @inject(SERVICE_IDENTIFIER.LOG_FACTORY) logFactory: LogFactory,
    @inject(SERVICE_IDENTIFIER.SERVER_CONFIG) private readonly serverConfig: Pick<ServerConfig, 'INTEROP_API_BASE_URI' | 'HTTP_PROXY_URL' | 'INTEROP_API_SUBSCRIPTION_KEY'>,
  ) {
    this.log = logFactory.createLogger('ClientApplicationRepositoryImpl');
  }

  async findClientApplicationBySin(sin: string): Promise<ClientApplicationEntity | null> {
    this.log.trace('Fetching client application for sin [%s]', sin);

    const url = new URL(`${this.serverConfig.INTEROP_API_BASE_URI}/dental-care/applicant-information/dts/v1/benefit-application?action=GET&scenario=RENEWAL`);
    const clientApplicationRequest = {
      Applicant: {
        PersonSINIdentification: {
          IdentificationID: sin,
        },
      },
    };

    const response = await instrumentedFetch(getFetchFn(this.serverConfig.HTTP_PROXY_URL), 'http.client.interop-api.client-application.posts', url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': this.serverConfig.INTEROP_API_SUBSCRIPTION_KEY,
      },
      body: JSON.stringify(clientApplicationRequest),
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
    this.log.trace('Client application: [%j]', data);

    return data;
  }

  async findClientApplicationByCriteria(criteria: FindClientApplicationCriteria): Promise<ClientApplicationEntity | null> {
    this.log.trace('Fetching client application for criteria [%j]', criteria);
    const { firstName, lastName, dateOfBirth, clientNumber } = criteria;

    const url = new URL(`${this.serverConfig.INTEROP_API_BASE_URI}/dental-care/applicant-information/dts/v1/benefit-applicaton?action=GET&scenario=RENEWAL`);
    const clientApplicationRequest = {
      Applicant: {
        PersonName: [
          {
            PersonGivenName: [firstName],
            PersonSurName: lastName,
          },
        ],
        PersonBirthDate: {
          date: dateOfBirth,
        },
        ClientIdentification: [
          {
            IdentificationID: clientNumber,
          },
        ],
      },
    };

    const response = await instrumentedFetch(getFetchFn(this.serverConfig.HTTP_PROXY_URL), 'http.client.interop-api.client-application_fnlndob.posts', url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': this.serverConfig.INTEROP_API_SUBSCRIPTION_KEY,
      },
      body: JSON.stringify(clientApplicationRequest),
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
