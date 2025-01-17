import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { ClientApplicationBasicInfoRequestEntity, ClientApplicationEntity, ClientApplicationSinRequestEntity } from '~/.server/domain/entities';
import type { LogFactory, Logger } from '~/.server/factories';
import type { HttpClient } from '~/.server/http';
import clientApplicationJsonDataSource from '~/.server/resources/power-platform/client-application.json';

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
export class DefaultClientApplicationRepository implements ClientApplicationRepository {
  private readonly log: Logger;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.configs.ServerConfig) private readonly serverConfig: Pick<ServerConfig, 'INTEROP_API_BASE_URI' | 'HTTP_PROXY_URL' | 'INTEROP_API_SUBSCRIPTION_KEY'>,
    @inject(TYPES.http.HttpClient) private readonly httpClient: HttpClient,
  ) {
    this.log = logFactory.createLogger('DefaultClientApplicationRepository');
  }

  async findClientApplicationByBasicInfo(clientApplicationBasicInfoRequestEntity: ClientApplicationBasicInfoRequestEntity): Promise<ClientApplicationEntity | null> {
    this.log.trace('Fetching client application for basic info [%j]', clientApplicationBasicInfoRequestEntity);

    const url = new URL(`${this.serverConfig.INTEROP_API_BASE_URI}/dental-care/applicant-information/dts/v1/retrieve-benefit-application`);
    const response = await this.httpClient.instrumentedFetch('http.client.interop-api.retrieve-benefit-application_by-basic-info.posts', url, {
      proxyUrl: this.serverConfig.HTTP_PROXY_URL,
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

    if (response.status === 204) {
      this.log.trace('Client application not found for basic info [%j]', clientApplicationBasicInfoRequestEntity);
      return null;
    }

    this.log.error('%j', {
      message: "Failed to 'POST' for client application data by basic info",
      status: response.status,
      statusText: response.statusText,
      url: url,
      responseBody: await response.text(),
    });
    throw new Error(`Failed to 'POST' for client application data by basic info. Status: ${response.status}, Status Text: ${response.statusText}`);
  }

  async findClientApplicationBySin(clientApplicationSinRequestEntity: ClientApplicationSinRequestEntity): Promise<ClientApplicationEntity | null> {
    this.log.trace('Fetching client application for sin [%j]', clientApplicationSinRequestEntity);

    const url = new URL(`${this.serverConfig.INTEROP_API_BASE_URI}/dental-care/applicant-information/dts/v1/retrieve-benefit-application`);
    const response = await this.httpClient.instrumentedFetch('http.client.interop-api.retrieve-benefit-application_by-sin.posts', url, {
      proxyUrl: this.serverConfig.HTTP_PROXY_URL,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': this.serverConfig.INTEROP_API_SUBSCRIPTION_KEY,
      },
      body: JSON.stringify(clientApplicationSinRequestEntity),
    });

    if (response.ok) {
      const data = await response.json();
      this.log.trace('Client application [%j]', data);
      return data;
    }

    if (response.status === 204) {
      this.log.trace('Client application not found for sin [%j]', clientApplicationSinRequestEntity);
      return null;
    }

    this.log.error('%j', {
      message: "Failed to 'POST' for client application data by sin",
      status: response.status,
      statusText: response.statusText,
      url: url,
      responseBody: await response.text(),
    });
    throw new Error(`Failed to 'POST' for client application data by sin. Status: ${response.status}, Status Text: ${response.statusText}`);
  }
}

@injectable()
export class MockClientApplicationRepository implements ClientApplicationRepository {
  private readonly mockApplicantFlags: ReadonlyMap<string, Readonly<{ InvitationToApplyIndicator: boolean; PreviousTaxesFiledIndicator: boolean }>> = new Map([
    // by basic info
    [
      '10000000001',
      {
        InvitationToApplyIndicator: true,
        PreviousTaxesFiledIndicator: false,
      },
    ],
    [
      '10000000002',
      {
        InvitationToApplyIndicator: false,
        PreviousTaxesFiledIndicator: true,
      },
    ],
    // by sin
    [
      '800000002',
      {
        InvitationToApplyIndicator: true,
        PreviousTaxesFiledIndicator: true,
      },
    ],
    [
      '700000003',
      {
        InvitationToApplyIndicator: false,
        PreviousTaxesFiledIndicator: true,
      },
    ],
  ]);

  private readonly log: Logger;

  constructor(@inject(TYPES.factories.LogFactory) logFactory: LogFactory) {
    this.log = logFactory.createLogger('MockClientApplicationRepository');
  }

  async findClientApplicationByBasicInfo(clientApplicationBasicInfoRequestEntity: ClientApplicationBasicInfoRequestEntity): Promise<ClientApplicationEntity | null> {
    this.log.debug('Fetching client application for basic info [%j]', clientApplicationBasicInfoRequestEntity);

    const identificationId = clientApplicationBasicInfoRequestEntity.Applicant.ClientIdentification[0].IdentificationID;
    const personGivenName = clientApplicationBasicInfoRequestEntity.Applicant.PersonName.PersonGivenName[0];
    const personSurName = clientApplicationBasicInfoRequestEntity.Applicant.PersonName.PersonSurName;
    const personBirthDate = clientApplicationBasicInfoRequestEntity.Applicant.PersonBirthDate.date;

    // If the ID is '10000000000', return a 404 error
    if (identificationId === '10000000000') {
      this.log.debug('Client application not found for basic info [%j]', clientApplicationBasicInfoRequestEntity);
      return await Promise.resolve(null);
    }

    // Otherwise, return specific flags or the default
    const clientApplicationFlags = this.mockApplicantFlags.get(identificationId) ?? {
      InvitationToApplyIndicator: clientApplicationJsonDataSource.BenefitApplication.Applicant.ApplicantDetail.InvitationToApplyIndicator,
      PreviousTaxesFiledIndicator: clientApplicationJsonDataSource.BenefitApplication.Applicant.ApplicantDetail.PreviousTaxesFiledIndicator,
    };

    const clientApplicationEntity: ClientApplicationEntity = {
      ...clientApplicationJsonDataSource,
      BenefitApplication: {
        ...clientApplicationJsonDataSource.BenefitApplication,
        Applicant: {
          ...clientApplicationJsonDataSource.BenefitApplication.Applicant,
          PersonName: [
            {
              PersonGivenName: [personGivenName],
              PersonSurName: personSurName,
            },
          ],
          PersonBirthDate: {
            date: personBirthDate,
          },
          ApplicantDetail: {
            ...clientApplicationJsonDataSource.BenefitApplication.Applicant.ApplicantDetail,
            ...clientApplicationFlags,
          },
        },
      },
    };

    this.log.debug('Client application [%j]', clientApplicationEntity);
    return await Promise.resolve(clientApplicationEntity);
  }

  async findClientApplicationBySin(clientApplicationSinRequestEntity: ClientApplicationSinRequestEntity): Promise<ClientApplicationEntity | null> {
    this.log.debug('Fetching client application for sin [%j]', clientApplicationSinRequestEntity);

    const personSINIdentification = clientApplicationSinRequestEntity.Applicant.PersonSINIdentification.IdentificationID;

    // If the ID is '900000001', return a 404 error
    if (personSINIdentification === '900000001') {
      this.log.debug('Client application not found for sin [%j]', clientApplicationSinRequestEntity);
      return await Promise.resolve(null);
    }

    // Otherwise, return specific flags or the default
    const clientApplicationFlags = this.mockApplicantFlags.get(personSINIdentification) ?? {
      InvitationToApplyIndicator: clientApplicationJsonDataSource.BenefitApplication.Applicant.ApplicantDetail.InvitationToApplyIndicator,
      PreviousTaxesFiledIndicator: clientApplicationJsonDataSource.BenefitApplication.Applicant.ApplicantDetail.PreviousTaxesFiledIndicator,
    };

    const clientApplicationEntity: ClientApplicationEntity = {
      ...clientApplicationJsonDataSource,
      BenefitApplication: {
        ...clientApplicationJsonDataSource.BenefitApplication,
        Applicant: {
          ...clientApplicationJsonDataSource.BenefitApplication.Applicant,
          PersonSINIdentification: {
            IdentificationID: personSINIdentification,
          },
          ApplicantDetail: {
            ...clientApplicationJsonDataSource.BenefitApplication.Applicant.ApplicantDetail,
            ...clientApplicationFlags,
          },
        },
      },
    };

    this.log.debug('Client application [%j]', clientApplicationEntity);
    return await Promise.resolve(clientApplicationEntity);
  }
}
