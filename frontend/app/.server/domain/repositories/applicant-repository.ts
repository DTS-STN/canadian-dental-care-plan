import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { ApplicantRequestEntity, ApplicantResponseEntity } from '~/.server/domain/entities';
import type { LogFactory, Logger } from '~/.server/factories';
import type { HttpClient } from '~/.server/http';

/**
 * A repository that provides access to applicant data.
 */
export interface ApplicantRepository {
  /**
   * Finds an applicant by SIN.
   *
   * @param applicantRequestEntity The SIN request entity.
   * @returns A Promise that resolves to the applicant entity if found, or `null` otherwise.
   */
  findApplicantBySin(applicantRequestEntity: ApplicantRequestEntity): Promise<ApplicantResponseEntity | null>;

  /**
   * Retrieves metadata associated with the applicant repository.
   *
   * @returns A record where the keys and values are strings representing metadata information.
   */
  getMetadata(): Record<string, string>;

  /**
   * Performs a health check to ensure that the applicant repository is operational.
   *
   * @throws An error if the health check fails or the repository is unavailable.
   * @returns A promise that resolves when the health check completes successfully.
   */
  checkHealth(): Promise<void>;
}

@injectable()
export class DefaultApplicantRepository implements ApplicantRepository {
  private readonly log: Logger;
  private readonly baseUrl: string;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.configs.ServerConfig)
    private readonly serverConfig: Pick<ServerConfig, 'HEALTH_PLACEHOLDER_REQUEST_VALUE' | 'HTTP_PROXY_URL' | 'INTEROP_API_BASE_URI' | 'INTEROP_API_SUBSCRIPTION_KEY' | 'INTEROP_APPLICANT_API_BASE_URI' | 'INTEROP_APPLICANT_API_SUBSCRIPTION_KEY'>,
    @inject(TYPES.http.HttpClient) private readonly httpClient: HttpClient,
  ) {
    this.log = logFactory.createLogger('DefaultApplicantRepository');
    this.baseUrl = `${this.serverConfig.INTEROP_APPLICANT_API_BASE_URI ?? this.serverConfig.INTEROP_API_BASE_URI}/dental-care/applicant-information/dts/v1`;
  }

  async findApplicantBySin(applicantRequestEntity: ApplicantRequestEntity): Promise<ApplicantResponseEntity | null> {
    this.log.trace('Fetching applicant for sin [%j]', applicantRequestEntity);

    const url = `${this.baseUrl}/applicant`;
    const response = await this.httpClient.instrumentedFetch('http.client.interop-api.client-application_by-sin.posts', url, {
      proxyUrl: this.serverConfig.HTTP_PROXY_URL,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': this.serverConfig.INTEROP_APPLICANT_API_SUBSCRIPTION_KEY ?? this.serverConfig.INTEROP_API_SUBSCRIPTION_KEY,
      },
      body: JSON.stringify(applicantRequestEntity),
    });

    if (response.status === 200) {
      const applicantResponseEntity: ApplicantResponseEntity = await response.json();
      this.log.trace('Returning applicant [%j]', applicantResponseEntity);
      return applicantResponseEntity;
    }

    if (response.status === 204) {
      this.log.trace('No applicant found; Returning null');
      return null;
    }

    this.log.error('%j', {
      message: "'Failed to 'POST' for applicant.",
      status: response.status,
      statusText: response.statusText,
      url: url,
      responseBody: await response.text(),
    });

    throw new Error(`Failed to 'POST' for applicant. Status:  ${response.status}, Status Text: ${response.statusText}`);
  }

  getMetadata(): Record<string, string> {
    return {
      baseUrl: this.baseUrl,
    };
  }

  async checkHealth(): Promise<void> {
    await this.findApplicantBySin({
      Applicant: {
        PersonSINIdentification: {
          IdentificationID: this.serverConfig.HEALTH_PLACEHOLDER_REQUEST_VALUE,
        },
      },
    });
  }
}

@injectable()
export class MockApplicantRepository implements ApplicantRepository {
  private readonly log: Logger;

  private readonly mockPersonalInformationDb = [
    {
      mailingAddressStreet: '2219 Waste Lane',
      mailingAddressSecondaryUnitText: 'Apt. No. 21',
      mailingAddressCityName: 'HALIFAX',
      mailingAddressProvince: 'fc2243c9-36b3-eb11-8236-0022486d8d5f',
      mailingAddressCountryReferenceId: '0cf5389e-97ae-eb11-8236-000d3af4bfc3',
      mailingAddressPostalCode: 'B0C 0A1',
      homeAddressStreet: '1191 Windy Street',
      homeAddressSecondaryUnitText: 'Apt. No. 50',
      homeAddressCityName: 'OTTAWA',
      homeAddressProvince: '9c440baa-35b3-eb11-8236-0022486d8d5f',
      homeAddressCountryReferenceId: '0cf5389e-97ae-eb11-8236-000d3af4bfc3',
      homeAddressPostalCode: 'L9B 1A2',
      sameHomeAndMailingAddress: false,
      clientNumber: '81657965177',
      clientId: '17cdea07-2f83-ee11-8179-000d3a09d7c5',
      applicantId: '4635f70b-2f83-ee11-8179-000d3a09d136',
      applicantCategoryCode: '775170000',
      birthdate: '1997-09-01',
      lastName: 'Eliot',
      firstName: 'Thomas Stearns',
      emailAddressId: 'rhapsody@domain.ca',
      primaryTelephoneNumber: '807-555-5555',
      alternateTelephoneNumber: '416-555-6666',
      preferredMethodCommunicationCode: '1033',
      federalDentalPlanId: 'e174250d-26c5-ee11-9079-000d3a09d640',
      provincialTerritorialDentalPlanId: 'b5f25fea-a7a9-ee11-a569-000d3af4f898',
      privateDentalPlanId: '333333',
      sinIdentification: '800011819',
    },

    {
      mailingAddressStreet: '1915 Verwandlung Street',
      mailingAddressSecondaryUnitText: 'Apt. No. 21',
      mailingAddressCityName: 'Victoria',
      mailingAddressProvince: '9c440baa-35b3-eb11-8236-0022486d8d5f',
      mailingAddressCountryReferenceId: '0cf5389e-97ae-eb11-8236-000d3af4bfc3',
      mailingAddressPostalCode: 'V1M 1M1',
      homeAddressStreet: '1915 Verwandlung Lane',
      homeAddressSecondaryUnitText: 'Apt. No. 21',
      homeAddressCityName: 'Victoria',
      homeAddressProvince: '9c440baa-35b3-eb11-8236-0022486d8d5f',
      homeAddressCountryReferenceId: '0cf5389e-97ae-eb11-8236-000d3af4bfc3',
      homeAddressPostalCode: 'V1M 1M1',
      sameHomeAndMailingAddress: true,
      clientNumber: '81400774242',
      clientId: '17cdea07-2f83-ee11-8179-000d3a09d7c4',
      applicantId: '4635f70b-2f83-ee11-8179-000d3a09d131',
      applicantCategoryCode: '775170000',
      birthdate: '1924-07-03',
      lastName: 'Kafka',
      firstName: 'Franz',
      emailAddressId: 'metamorphosis0@domain.ca',
      primaryTelephoneNumber: '555-555-5555',
      alternateTelephoneNumber: '789-555-6666',
      preferredMethodCommunicationCode: '775170002',
      federalDentalPlanId: '5a5c5294-26c5-ee11-9079-000d3a09d640',
      provincialTerritorialDentalPlanId: '39449f70-37b3-eb11-8236-0022486d8d5f',
      privateDentalPlanId: '1111111',
      sinIdentification: '800000002',
    },
  ];

  constructor(@inject(TYPES.factories.LogFactory) logFactory: LogFactory) {
    this.log = logFactory.createLogger('MockApplicantRepository');
  }

  async findApplicantBySin(applicantRequestEntity: ApplicantRequestEntity): Promise<ApplicantResponseEntity | null> {
    this.log.debug('Fetching applicant for sin [%j]', applicantRequestEntity);

    const personSinIdentification = applicantRequestEntity.Applicant.PersonSINIdentification.IdentificationID;
    const peronalInformationEntity = this.mockPersonalInformationDb.find(({ sinIdentification }) => sinIdentification === personSinIdentification);

    if (!peronalInformationEntity) {
      this.log.debug('No applicant found; Returning null');
      return await Promise.resolve(null);
    }

    const clientIdentification: { IdentificationID?: string; IdentificationCategoryText?: string }[] = [];

    if (peronalInformationEntity.applicantId) {
      clientIdentification.push({ IdentificationID: peronalInformationEntity.applicantId, IdentificationCategoryText: 'Applicant ID' });
    }
    if (peronalInformationEntity.clientNumber) {
      clientIdentification.push({ IdentificationID: peronalInformationEntity.clientNumber, IdentificationCategoryText: 'Client Number' });
    }
    if (peronalInformationEntity.clientId) {
      clientIdentification.push({ IdentificationID: peronalInformationEntity.clientId, IdentificationCategoryText: 'Client ID' });
    }

    const applicantResponseEntity: ApplicantResponseEntity = {
      BenefitApplication: {
        Applicant: {
          ClientIdentification: clientIdentification,
        },
      },
    };

    this.log.debug('Returning applicant [%j]', applicantResponseEntity);
    return await Promise.resolve(applicantResponseEntity);
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
