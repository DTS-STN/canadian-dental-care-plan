import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { ClientApplicationBasicInfoRequestEntity, ClientApplicationEntity, ClientApplicationSinRequestEntity } from '~/.server/domain/entities';
import type { HttpClient } from '~/.server/http';
import type { Logger } from '~/.server/logging';
import { createLogger } from '~/.server/logging';
import clientApplicationItaJsonDataSource from '~/.server/resources/power-platform/client-application-ita.json';
import clientApplicationJsonDataSource from '~/.server/resources/power-platform/client-application.json';
import { createInteropClient } from '~/.server/shared/api/interop-client';
import type { InteropClient } from '~/.server/shared/api/interop-client';
import { HttpStatusCodes } from '~/constants/http-status-codes';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

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
  private readonly serverConfig: Pick<ServerConfig, 'INTEROP_API_BASE_URI' | 'HTTP_PROXY_URL' | 'INTEROP_API_SUBSCRIPTION_KEY'>;
  private readonly httpClient: HttpClient;
  private readonly interopClient: InteropClient;

  constructor(@inject(TYPES.configs.ServerConfig) serverConfig: Pick<ServerConfig, 'INTEROP_API_BASE_URI' | 'HTTP_PROXY_URL' | 'INTEROP_API_SUBSCRIPTION_KEY'>, @inject(TYPES.http.HttpClient) httpClient: HttpClient) {
    this.log = createLogger('DefaultClientApplicationRepository');
    this.serverConfig = serverConfig;
    this.httpClient = httpClient;
    this.interopClient = createInteropClient({
      baseUrl: `${this.serverConfig.INTEROP_API_BASE_URI}/dental-care/applicant-information/dts/v1/`,
    });
  }

  async findClientApplicationByBasicInfo(clientApplicationBasicInfoRequestEntity: ClientApplicationBasicInfoRequestEntity): Promise<ClientApplicationEntity | null> {
    this.log.trace('Fetching client application for basic info [%j]', clientApplicationBasicInfoRequestEntity);

    const { response, data, error } = await this.interopClient.POST('/retrieve-benefit-application', {
      meta: {
        metricPrefix: 'http.client.interop-api.retrieve-benefit-application_by-basic-info.posts',
      },
      params: {
        header: {
          'Ocp-Apim-Subscription-Key': this.serverConfig.INTEROP_API_SUBSCRIPTION_KEY,
        },
      },
      body: clientApplicationBasicInfoRequestEntity,
    });

    if (error) {
      this.log.error('%j', {
        message: "Failed to 'POST' for client application data by basic info",
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        responseBody: error,
      });

      if (response.status === HttpStatusCodes.TOO_MANY_REQUESTS) {
        // TODO ::: GjB ::: this throw is to facilitate enabling the application kill switch -- it should be removed once the killswitch functionality is removed
        throw new AppError('Failed to POST for benefit application. Status: 429, Status Text: Too Many Requests', ErrorCodes.XAPI_TOO_MANY_REQUESTS);
      }

      throw new Error(`Failed to 'POST' for client application data by basic info. Status: ${response.status}, Status Text: ${response.statusText}`);
    }

    if (!data) {
      // 204 response
      this.log.trace('Client application not found for basic info [%j]', clientApplicationBasicInfoRequestEntity);
      return null;
    }

    // 200 response
    this.log.trace('Client application [%j]', data);
    return data;
  }

  async findClientApplicationBySin(clientApplicationSinRequestEntity: ClientApplicationSinRequestEntity): Promise<ClientApplicationEntity | null> {
    this.log.trace('Fetching client application for sin [%j]', clientApplicationSinRequestEntity);

    const { response, data, error } = await this.interopClient.POST('/retrieve-benefit-application', {
      meta: {
        metricPrefix: 'http.client.interop-api.retrieve-benefit-application_by-sin.posts',
      },
      params: {
        header: {
          'Ocp-Apim-Subscription-Key': this.serverConfig.INTEROP_API_SUBSCRIPTION_KEY,
        },
      },
      body: clientApplicationSinRequestEntity,
    });

    if (error) {
      this.log.error('%j', {
        message: "Failed to 'POST' for client application data by sin",
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        responseBody: error,
      });

      if (response.status === HttpStatusCodes.TOO_MANY_REQUESTS) {
        // TODO ::: GjB ::: this throw is to facilitate enabling the application kill switch -- it should be removed once the killswitch functionality is removed
        throw new AppError('Failed to POST to /retrieve-benefit-application. Status: 429, Status Text: Too Many Requests', ErrorCodes.XAPI_TOO_MANY_REQUESTS);
      }

      throw new Error(`Failed to 'POST' for client application data by sin. Status: ${response.status}, Status Text: ${response.statusText}`);
    }

    if (!data) {
      // 204 response
      this.log.trace('Client application not found for sin [%j]', clientApplicationSinRequestEntity);
      return null;
    }

    // 200 response
    this.log.trace('Client application [%j]', data);
    return data;
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

  constructor() {
    this.log = createLogger('MockClientApplicationRepository');
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

    const jsonDataSource = clientApplicationFlags.InvitationToApplyIndicator ? clientApplicationItaJsonDataSource : clientApplicationJsonDataSource;

    const clientApplicationEntity: ClientApplicationEntity = {
      ...jsonDataSource,
      BenefitApplication: {
        ...jsonDataSource.BenefitApplication,
        Applicant: {
          ...jsonDataSource.BenefitApplication.Applicant,
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
            ...jsonDataSource.BenefitApplication.Applicant.ApplicantDetail,
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

    const jsonDataSource = clientApplicationFlags.InvitationToApplyIndicator ? clientApplicationItaJsonDataSource : clientApplicationJsonDataSource;

    const clientApplicationEntity: ClientApplicationEntity = {
      ...jsonDataSource,
      BenefitApplication: {
        ...jsonDataSource.BenefitApplication,
        Applicant: {
          ...jsonDataSource.BenefitApplication.Applicant,
          PersonSINIdentification: {
            IdentificationID: personSINIdentification,
          },
          ApplicantDetail: {
            ...jsonDataSource.BenefitApplication.Applicant.ApplicantDetail,
            ...clientApplicationFlags,
          },
        },
      },
    };

    this.log.debug('Client application [%j]', clientApplicationEntity);
    return await Promise.resolve(clientApplicationEntity);
  }
}
