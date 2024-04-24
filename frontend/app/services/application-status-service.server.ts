import moize from 'moize';
import { z } from 'zod';

import { getAuditService } from '~/services/audit-service.server';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('application-status-service.server');

/**
 * Return a singleton instance (by means of memomization) of the application status service.
 */
export const getApplicationStatusService = moize(createApplicationStatusService, { onCacheAdd: () => log.info('Creating new application status service') });

function createApplicationStatusService() {
  // prettier-ignore
  const {
    INTEROP_API_BASE_URI,
    INTEROP_API_SUBSCRIPTION_KEY,
    INTEROP_STATUS_CHECK_API_BASE_URI,
    INTEROP_STATUS_CHECK_API_SUBSCRIPTION_KEY,
  } = getEnv();

  interface GetStatusIdArgs {
    sin: string;
    applicationCode: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
  }

  /**
   * @returns the status id of a dental application given the sin and application code
   */
  async function getStatusId({ sin, applicationCode, firstName, lastName, dateOfBirth }: GetStatusIdArgs) {
    const instrumentationService = getInstrumentationService();

    getAuditService().audit('application-status.post', { userId: 'anonymous' });

    const url = new URL(`${INTEROP_STATUS_CHECK_API_BASE_URI ?? INTEROP_API_BASE_URI}/dental-care/status-check/v1/status`);
    const statusRequest = {
      BenefitApplication: {
        Applicant: {
          PersonSINIdentification: {
            IdentificationID: sin,
          },
          ClientIdentification: [
            {
              IdentificationID: applicationCode,
              firstName: firstName,
              lastName: lastName,
              dateOfBirth: dateOfBirth,
            },
          ],
        },
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': INTEROP_STATUS_CHECK_API_SUBSCRIPTION_KEY ?? INTEROP_API_SUBSCRIPTION_KEY,
      },
      body: JSON.stringify(statusRequest),
    });

    if (!response.ok) {
      instrumentationService.countHttpStatus('http.client.interop-api.status.posts', response.status);
      log.error('%j', {
        message: "Failed to 'POST' for application status",
        status: response.status,
        statusText: response.statusText,
        url: url,
        responseBody: await response.text(),
      });

      throw new Error(`Failed to 'POST' for application status. Status: ${response.status}, Status Text: ${response.statusText}`);
    }

    instrumentationService.countHttpStatus('http.client.interop-api.status.posts', 200);
    const statusResponseSchema = z.object({
      BenefitApplication: z.object({
        BenefitApplicationStatus: z.array(
          z.object({
            ReferenceDataID: z.string().nullable(),
            ReferenceDataName: z.string(),
          }),
        ),
      }),
    });

    const data = await response.json();
    log.trace('Status id: [%j]', data);

    const statusResponse = statusResponseSchema.parse(data);
    return statusResponse.BenefitApplication.BenefitApplicationStatus[0].ReferenceDataID;
  }

  return { getStatusId };
}
