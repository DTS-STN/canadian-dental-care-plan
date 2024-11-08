import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { ApplicantRequestEntity, ApplicantResponseEntity } from '~/.server/domain/entities';
import type { LogFactory, Logger } from '~/.server/factories';
import { getFetchFn, instrumentedFetch } from '~/utils/fetch-utils.server';

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
}

@injectable()
export class ApplicantRepositoryImpl implements ApplicantRepository {
  private readonly log: Logger;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.configs.ServerConfig) private readonly serverConfig: Pick<ServerConfig, 'HTTP_PROXY_URL' | 'INTEROP_API_BASE_URI' | 'INTEROP_API_SUBSCRIPTION_KEY' | 'INTEROP_APPLICANT_API_BASE_URI' | 'INTEROP_APPLICANT_API_SUBSCRIPTION_KEY'>,
  ) {
    this.log = logFactory.createLogger('ApplicantRepositoryImpl');
  }

  async findApplicantBySin(applicantRequestEntity: ApplicantRequestEntity): Promise<ApplicantResponseEntity | null> {
    this.log.trace('Fetching applicant for sin [%j]', applicantRequestEntity);

    const url = `${this.serverConfig.INTEROP_APPLICANT_API_BASE_URI ?? this.serverConfig.INTEROP_API_BASE_URI}/dental-care/applicant-information/dts/v1/applicant`;
    const response = await instrumentedFetch(getFetchFn(this.serverConfig.HTTP_PROXY_URL), 'http.client.interop-api.client-application_by-sin.posts', url, {
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
}
