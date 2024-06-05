import { sort } from 'moderndash';
import moize from 'moize';
import { z } from 'zod';

import { BenefitApplicationRequest, benefitApplicationRequestSchema, benefitApplicationResponseSchema } from '~/schemas/benefit-application-service-schemas.server';
import { getAuditService } from '~/services/audit-service.server';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getEnv } from '~/utils/env.server';
import { getFetchFn } from '~/utils/fetch-utils';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('benefit-application-service.server');

function createBenefitApplicationService() {
  // prettier-ignore
  const {
    HTTP_PROXY_URL,
    INTEROP_API_BASE_URI,
    INTEROP_API_SUBSCRIPTION_KEY,
    INTEROP_BENEFIT_APPLICATION_API_BASE_URI,
    INTEROP_BENEFIT_APPLICATION_API_SUBSCRIPTION_KEY,
  } = getEnv();

  const fetchFn = getFetchFn(HTTP_PROXY_URL);

  /**
   * Application submission to Power Platform
   * @returns the status id of a dental application given the sin and application code
   */
  async function submitApplication(benefitApplicationRequest: BenefitApplicationRequest) {
    log.debug('Submitting CDCP application');
    log.trace('CDCP application data: [%j]', benefitApplicationRequest);

    const parsedBenefitApplicationRequest = await benefitApplicationRequestSchema.safeParseAsync(benefitApplicationRequest);

    if (!parsedBenefitApplicationRequest.success) {
      log.error('Unexpected benefit application request validation error: [%s]', parsedBenefitApplicationRequest.error);
      throw new Error(`Invalid benefit application request: ${parsedBenefitApplicationRequest.error}`);
    }

    const auditService = getAuditService();
    const instrumentationService = getInstrumentationService();

    auditService.audit('application-submit.post', { userId: 'anonymous' });

    const url = new URL(`${INTEROP_BENEFIT_APPLICATION_API_BASE_URI ?? INTEROP_API_BASE_URI}/dental-care/applicant-information/dts/v1/benefit-application`);

    const response = await fetchFn(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': INTEROP_BENEFIT_APPLICATION_API_SUBSCRIPTION_KEY ?? INTEROP_API_SUBSCRIPTION_KEY,
      },
      body: JSON.stringify(parsedBenefitApplicationRequest.data),
    });

    if (!response.ok) {
      instrumentationService.countHttpStatus('http.client.interop-api.benefit-application.posts', response.status);

      log.error('%j', {
        message: "Failed to 'POST' for benefit application",
        status: response.status,
        statusText: response.statusText,
        url: url,
        responseBody: await response.text(),
      });

      throw new Error(`Failed to 'POST' for benefit application. Status: ${response.status}, Status Text: ${response.statusText}`);
    }

    instrumentationService.countHttpStatus('http.client.interop-api.benefit-application.posts', 200);

    const json = await response.json();
    const parsedBenefitApplicationResponse = await benefitApplicationResponseSchema.safeParseAsync(json);

    if (!parsedBenefitApplicationResponse.success) {
      log.error('Unexpected benefit application response error: [%s]', parsedBenefitApplicationResponse.error);
      throw new Error(`Invalid benefit application request: ${parsedBenefitApplicationResponse.error}`);
    }

    log.trace('Returning benefit application ID: [%s]', parsedBenefitApplicationResponse.data.BenefitApplication.BenefitApplicationIdentification[0].IdentificationID);
    return parsedBenefitApplicationResponse.data.BenefitApplication.BenefitApplicationIdentification[0].IdentificationID;
  }

  /**
   * @returns array of applications
   */
  async function getApplications(userId: string, sortOrder: 'asc' | 'desc' = 'desc') {
    log.debug('Fetching applications for user id [%s]', userId);

    const auditService = getAuditService();
    const instrumentationService = getInstrumentationService();
    auditService.audit('applications.get', { userId });

    const url = new URL(`${INTEROP_BENEFIT_APPLICATION_API_BASE_URI ?? INTEROP_API_BASE_URI}/v1/users/${userId}/applications`);

    const response = await fetchFn(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    instrumentationService.countHttpStatus('http.client.application-history-api.applications.gets', response.status);

    const applicationsSchema = z.array(
      z.object({
        AppicationId: z.string().optional(),
        SubmittedDate: z.string().optional(),
        ApplicationStatus: z.string().optional(),
        ConfirmationCode: z.string().optional(),
      }),
    );

    const data = await response.json();
    log.trace('Applications for user id [%s]: [%j]', userId, data);
    const applications = applicationsSchema.parse(data).map((application) => ({
      id: application.AppicationId,
      submittedOn: application.SubmittedDate,
      status: application.ApplicationStatus,
      confirmationCode: application.ConfirmationCode,
    }));

    return sort(applications, {
      order: sortOrder,
      by: (item) => item.submittedOn ?? 'undefined',
    });
  }

  return { submitApplication, getApplications };
}

/**
 * Return a singleton instance (by means of memomization) of the benefit application service.
 */
export const getBenefitApplicationService = moize(createBenefitApplicationService, { onCacheAdd: () => log.info('Creating new benefit application service') });
