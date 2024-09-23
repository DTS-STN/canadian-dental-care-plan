import { sort } from 'moderndash';
import moize from 'moize';

import type { FederalGovernmentInsurancePlanService, ProvincialGovernmentInsurancePlanService } from '~/.server/domain/services';
import { getApplicationHistoryMapper } from '~/mappers/application-history-mapper.server';
import { applicationListSchema } from '~/schemas/application-history-service-schemas.server';
import type { BenefitApplicationRequest } from '~/schemas/benefit-application-service-schemas.server';
import { benefitApplicationRequestSchema, benefitApplicationResponseSchema } from '~/schemas/benefit-application-service-schemas.server';
import { getAuditService } from '~/services/audit-service.server';
import { getEnv } from '~/utils/env-utils.server';
import { getFetchFn, instrumentedFetch } from '~/utils/fetch-utils.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('benefit-application-service.server');

export interface CreateBenefitApplicationServiceArgs {
  federalGovernmentInsurancePlanService: FederalGovernmentInsurancePlanService;
  provincialGovernmentInsurancePlanService: ProvincialGovernmentInsurancePlanService;
}

function createBenefitApplicationService({ federalGovernmentInsurancePlanService, provincialGovernmentInsurancePlanService }: CreateBenefitApplicationServiceArgs) {
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
    auditService.audit('application-submit.post', { userId: 'anonymous' });

    const url = new URL(`${INTEROP_BENEFIT_APPLICATION_API_BASE_URI ?? INTEROP_API_BASE_URI}/dental-care/applicant-information/dts/v1/benefit-application`);

    const response = await instrumentedFetch(fetchFn, 'http.client.interop-api.benefit-application.posts', url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': INTEROP_BENEFIT_APPLICATION_API_SUBSCRIPTION_KEY ?? INTEROP_API_SUBSCRIPTION_KEY,
      },
      body: JSON.stringify(parsedBenefitApplicationRequest.data),
    });

    if (!response.ok) {
      log.error('%j', {
        message: "Failed to 'POST' for benefit application",
        status: response.status,
        statusText: response.statusText,
        url: url,
        responseBody: await response.text(),
      });

      throw new Error(`Failed to 'POST' for benefit application. Status: ${response.status}, Status Text: ${response.statusText}`);
    }

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
    auditService.audit('applications.get', { userId });

    const url = new URL(`${INTEROP_BENEFIT_APPLICATION_API_BASE_URI ?? INTEROP_API_BASE_URI}/v1/users/${userId}/applications`);

    const response = await instrumentedFetch(fetchFn, 'http.client.application-history-api.applications.gets', url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    log.trace('Applications for user id [%s]: [%j]', userId, data);
    const applications = getApplicationHistoryMapper({ federalGovernmentInsurancePlanService, provincialGovernmentInsurancePlanService }).toBenefitApplication(applicationListSchema.parse(data)); // TODO: Update schema once application-history service becomes avaliable
    return sort(applications, {
      order: sortOrder,
      by: (item) => item.submittedOn,
    });
  }

  return { submitApplication, getApplications };
}

/**
 * Return a singleton instance (by means of memomization) of the benefit application service.
 */
export const getBenefitApplicationService = moize(createBenefitApplicationService, { onCacheAdd: () => log.info('Creating new benefit application service') });
