import moize from 'moize';

import { getAuditService } from './audit-service.server';
import { getInstrumentationService } from './instrumentation-service.server';
import { toGetApplicantRequest, toPersonalInformation, toUpdateApplicantRequest } from '~/mappers/personal-information-service-mappers.server';
import { PersonalInformation, getApplicantResponseSchema, updateApplicantRequestSchema } from '~/schemas/personal-informaton-service-schemas.server';
import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('personal-information-service.server');

/**
 * Return a singleton instance (by means of memomization) of the personal-information service.
 */

export const getPersonalInformationService = moize(createPersonalInformationService, { onCacheAdd: () => log.info('Creating new user service') });

function createPersonalInformationService() {
  // prettier-ignore
  const { 
    INTEROP_API_BASE_URI,
    INTEROP_API_SUBSCRIPTION_KEY,
    INTEROP_APPLICANT_API_BASE_URI,
    INTEROP_APPLICANT_API_SUBSCRIPTION_KEY,
  } = getEnv();

  async function getPersonalInformation(sin: string, userId: string) {
    log.debug('Fetching personal information for user id [%s]', userId);
    log.trace('Fetching personal information for sin [%s] and user id [%s]', sin, userId);

    const applicantRequest = toGetApplicantRequest(sin);
    const url = `${INTEROP_APPLICANT_API_BASE_URI ?? INTEROP_API_BASE_URI}/dental-care/applicant-information/dts/v1/applicant`;

    const auditService = getAuditService();
    const instrumentationService = getInstrumentationService();

    auditService.audit('personal-information.get', { userId });

    const response = await fetch(url, {
      method: 'POST', // Interop uses POST to avoid logging SIN in the API path
      body: JSON.stringify(applicantRequest),
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': INTEROP_APPLICANT_API_SUBSCRIPTION_KEY ?? INTEROP_API_SUBSCRIPTION_KEY,
      },
    });

    instrumentationService.countHttpStatus('http.client.interop-api.applicant.posts', response.status);

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

  async function updatePersonalInformation(sin: string, newPersonalInformation: PersonalInformation) {
    log.debug('Updating personal information for with new information [%j]', newPersonalInformation);
    log.trace('Updating personal information for sin [%s] and new information [%j]', sin, newPersonalInformation);

    const updateApplicantRequest = toUpdateApplicantRequest(newPersonalInformation);
    const parsedUpdateApplicantRequest = await updateApplicantRequestSchema.safeParseAsync(updateApplicantRequest);

    if (!parsedUpdateApplicantRequest.success) {
      throw new Error(`Invalid persional information update request: ${parsedUpdateApplicantRequest.error}`);
    }

    // TODO: The Interop API for updating dental applicant information is not yet available.
    const url = `${INTEROP_APPLICANT_API_BASE_URI ?? INTEROP_API_BASE_URI}/dental-care/applicant-information/dts/v1/applicant/${sin}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': INTEROP_APPLICANT_API_SUBSCRIPTION_KEY ?? INTEROP_API_SUBSCRIPTION_KEY,
      },
      body: JSON.stringify(parsedUpdateApplicantRequest.data),
    });

    if (!response.ok) {
      log.error('%j', {
        message: 'Failed to update data',
        status: response.status,
        statusText: response.statusText,
        url: url,
        responseBody: await response.text(),
      });

      throw new Error(`Failed to fetch data. Status: ${response.status}, Status Text: ${response.statusText}`);
    }
    log.trace('Updated personal information: [%j]', await response.text());
  }

  return { getPersonalInformation, updatePersonalInformation };
}
