import moize from 'moize';

import { BenefitApplicationRequest, benefitApplicationRequestSchema, benefitApplicationResponseSchema } from '~/schemas/benefit-application-service-schemas.server';
import { getAuditService } from '~/services/audit-service.server';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('benefit-application-service.server');

function createBenefitApplicationService() {
  const { INTEROP_POWERPLATFORM_API_BASE_URI, INTEROP_POWERPLATFORM_API_SUBSCRIPTION_KEY } = getEnv();

  /**
   * Application submission to Power Platform
   * @returns the status id of a dental application given the sin and application code
   */
  async function submitApplication(benefitApplicationRequest: BenefitApplicationRequest) {
    const parsedBenefitApplicationRequest = await benefitApplicationRequestSchema.safeParseAsync(benefitApplicationRequest);

    if (!parsedBenefitApplicationRequest.success) {
      throw new Error(`Invalid benefit application request: ${parsedBenefitApplicationRequest.error}`);
    }

    const auditService = getAuditService();
    const instrumentationService = getInstrumentationService();

    auditService.audit('application-status.post', { userId: 'anonymous' });

    const url = new URL(`${INTEROP_POWERPLATFORM_API_BASE_URI}/dental-care/applicant-information/dts/v1/benefit-application`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': INTEROP_POWERPLATFORM_API_SUBSCRIPTION_KEY,
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
      throw new Error(`Invalid benefit application request: ${parsedBenefitApplicationResponse.error}`);
    }

    return parsedBenefitApplicationResponse.data.BenefitApplication.BenefitApplicationIdentification[0].IdentificationID;
  }

  return { submitApplication };
}

/**
 * Return a singleton instance (by means of memomization) of the benefit application service.
 */
export const getBenefitApplicationService = moize(createBenefitApplicationService, { onCacheAdd: () => log.info('Creating new benefit application service') });
