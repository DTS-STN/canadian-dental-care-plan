import moize from 'moize';
import { z } from 'zod';

import { getAuditService } from '~/services/audit-service.server';
import { getEnv } from '~/utils/env-utils.server';
import { getFetchFn, instrumentedFetch } from '~/utils/fetch-utils.server';
import { getLogger } from '~/utils/logging.server';

/**
 * Return a singleton instance (by means of memomization) of the application status service.
 */
export const getApplicationStatusService = moize(createApplicationStatusService, {
  onCacheAdd: () => {
    const log = getLogger('application-status-service.server/getApplicationStatusService');
    log.info('Creating new application status service');
  },
});

function createApplicationStatusService() {
  // prettier-ignore
  const {
    HTTP_PROXY_URL,
    INTEROP_API_BASE_URI,
    INTEROP_API_SUBSCRIPTION_KEY,
    INTEROP_STATUS_CHECK_API_BASE_URI,
    INTEROP_STATUS_CHECK_API_SUBSCRIPTION_KEY,
  } = getEnv();

  const fetchFn = getFetchFn(HTTP_PROXY_URL);

  interface GetStatusIdWithSinArgs {
    sin: string;
    applicationCode: string;
  }

  interface GetStatusIdWithoutSinArgs {
    applicationCode: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
  }

  /**
   * @returns the status id of a dental application given the sin and application code
   */
  async function getStatusIdWithSin({ sin, applicationCode }: GetStatusIdWithSinArgs) {
    const log = getLogger('application-status-service.server/getStatusIdWithSin');
    log.debug('Fetching status id of dental application for application code [%s]', applicationCode);
    log.trace('Fetching status id of dental application for sin [%s], application code [%s]', sin, applicationCode);

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
            },
          ],
        },
      },
    };

    const response = await instrumentedFetch(fetchFn, 'http.client.interop-api.status.posts', url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': INTEROP_STATUS_CHECK_API_SUBSCRIPTION_KEY ?? INTEROP_API_SUBSCRIPTION_KEY,
      },
      body: JSON.stringify(statusRequest),
    });

    if (!response.ok) {
      log.error('%j', {
        message: "Failed to 'POST' for application status",
        status: response.status,
        statusText: response.statusText,
        url: url,
        responseBody: await response.text(),
      });

      throw new Error(`Failed to 'POST' for application status. Status: ${response.status}, Status Text: ${response.statusText}`);
    }

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

  /**
   * @returns the status id of a dental application given the application code and client information without the SIN
   */
  async function getStatusIdWithoutSin({ applicationCode, firstName, lastName, dateOfBirth }: GetStatusIdWithoutSinArgs) {
    const log = getLogger('application-status-service.server/getStatusIdWithoutSin');
    log.debug('Fetching status id of dental application for application code [%s]', applicationCode);
    log.trace('Fetching status id of dental application for application code [%s], first name [%s], lastname [%s], date of birth [%s]', applicationCode, firstName, lastName, dateOfBirth);

    getAuditService().audit('application-status.post', { userId: 'anonymous' });

    const url = new URL(`${INTEROP_STATUS_CHECK_API_BASE_URI ?? INTEROP_API_BASE_URI}/dental-care/status-check/v1/status_fnlndob`);
    const statusRequest = {
      BenefitApplication: {
        Applicant: {
          PersonName: [
            {
              PersonGivenName: [firstName],
              PersonSurName: lastName,
            },
          ],
          PersonBirthDate: {
            date: dateOfBirth,
          },
          ClientIdentification: [
            {
              IdentificationID: applicationCode,
            },
          ],
        },
      },
    };

    const response = await instrumentedFetch(fetchFn, 'http.client.interop-api.status-fnlndob.posts', url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': INTEROP_STATUS_CHECK_API_SUBSCRIPTION_KEY ?? INTEROP_API_SUBSCRIPTION_KEY,
      },
      body: JSON.stringify(statusRequest),
    });

    if (!response.ok) {
      log.error('%j', {
        message: "Failed to 'POST' for application status",
        status: response.status,
        statusText: response.statusText,
        url: url,
        responseBody: await response.text(),
      });
      throw new Error(`Failed to 'POST' for application status. Status: ${response.status}, Status Text: ${response.statusText}`);
    }

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

  return { getStatusIdWithSin, getStatusIdWithoutSin };
}
