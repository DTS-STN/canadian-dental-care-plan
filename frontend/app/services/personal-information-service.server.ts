import moize from 'moize';

import { getAuditService } from './audit-service.server';
import { toGetApplicantRequest, toPersonalInformation } from '~/mappers/personal-information-service-mappers.server';
import { getApplicantResponseSchema } from '~/schemas/personal-informaton-service-schemas.server';
import { getEnv } from '~/utils/env-utils.server';
import { getFetchFn, instrumentedFetch } from '~/utils/fetch-utils.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('personal-information-service.server');

/**
 * Return a singleton instance (by means of memomization) of the personal-information service.
 */

export const getPersonalInformationService = moize(createPersonalInformationService, { onCacheAdd: () => log.info('Creating new user service') });

function createPersonalInformationService() {
  // prettier-ignore
  const {
    HTTP_PROXY_URL,
    INTEROP_API_BASE_URI,
    INTEROP_API_SUBSCRIPTION_KEY,
    INTEROP_APPLICANT_API_BASE_URI,
    INTEROP_APPLICANT_API_SUBSCRIPTION_KEY,
  } = getEnv();

  const fetchFn = getFetchFn(HTTP_PROXY_URL);

  async function getPersonalInformation(sin: string, userId: string) {
    log.debug('Fetching personal information for user id [%s]', userId);
    log.trace('Fetching personal information for sin [%s] and user id [%s]', sin, userId);

    const applicantRequest = toGetApplicantRequest(sin);
    const url = `${INTEROP_APPLICANT_API_BASE_URI ?? INTEROP_API_BASE_URI}/dental-care/applicant-information/dts/v1/applicant`;

    const auditService = getAuditService();
    auditService.audit('personal-information.get', { userId });

    const response = await instrumentedFetch(fetchFn, 'http.client.interop-api.applicant.posts', url, {
      method: 'POST', // Interop uses POST to avoid logging SIN in the API path
      body: JSON.stringify(applicantRequest),
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': INTEROP_APPLICANT_API_SUBSCRIPTION_KEY ?? INTEROP_API_SUBSCRIPTION_KEY,
      },
    });

    if (response.status === 200) {
      const data = await response.json();
      log.trace('Personal information for sin [%s] and user id [%s]: [%j]', sin, userId, data);
      return toPersonalInformation(getApplicantResponseSchema.parse(data));
    }
    if (response.status === 204) {
      return null;
    }

    log.error('%j', {
      message: "'Failed to 'POST' for applicant.",
      status: response.status,
      statusText: response.statusText,
      url: url,
      responseBody: await response.text(),
    });

    throw new Error(`Failed to 'POST' for applicant. Status:  ${response.status}, Status Text: ${response.statusText}`);
  }

  return { getPersonalInformation };
}
