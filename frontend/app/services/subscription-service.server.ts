import moize from 'moize';
import { z } from 'zod';

import { getAuditService } from '~/services/audit-service.server';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('subscription-service.server');

const subscriptionInfoSchema = z.object({
  id: z.string(),
  userId: z.string(),
  msLanguageCode: z.string(),
  alertTypeCode: z.string(),
  email: z.string(),
  emailVerifed: z.boolean(),
});

type SubscriptionInfo = z.infer<typeof subscriptionInfoSchema>;

const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  userAttributes: z.array(
    z.object({
      name: z.string(),
      value: z.string(),
    }),
  ),
  _links: z.object({
    self: z.object({
      href: z.string(),
    }),
    subscriptions: z.object({
      href: z.string(),
    }),
    emailValidations: z.object({
      href: z.string(),
    }),
    confirmationCodes: z.object({
      href: z.string(),
    }),
  }),
});

const subscriptionsSchema = z.object({
  _embedded: z.object({
    subscriptions: z.array(
      z.object({
        id: z.string(),
        msLanguageCode: z.string(),
        alertTypeCode: z.string(),
        _links: z.object({
          self: z.object({
            href: z.string(),
          }),
        }),
      }),
    ),
  }),
  _links: z.object({
    self: z.object({
      href: z.string(),
    }),
  }),
});

/**
 * Return a singleton instance (by means of memomization) of the subscription service.
 */
export const getSubscriptionService = moize(createSubscriptionService, { onCacheAdd: () => log.info('Creating new subscription service') });

function createSubscriptionService() {
  const { CDCP_API_BASE_URI } = getEnv();

  /**
   *
   * @param userId
   * @returns the subscription details for the user or null if no user is found or the user has no CDCP subscriptions.
   */
  async function getSubscription(userId: string) {
    const auditService = getAuditService();
    const instrumentationService = getInstrumentationService();
    auditService.audit('alert-subscription.get', { userId });
    const url = new URL(`${CDCP_API_BASE_URI}/api/v1/users?raoidcUserId=${userId}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    instrumentationService.countHttpStatus('http.client.cdcp-api.users.gets', response.status);

    if (!response.ok) {
      log.error('%j', {
        message: 'Failed find data',
        status: response.status,
        statusText: response.statusText,
        url: url,
        responseBody: await response.text(),
      });

      throw new Error(`Failed to find data. Status: ${response.status}, Status Text: ${response.statusText}`);
    }

    const users = await response.json();
    if (users._embedded.users.length === 0) {
      return null;
    }
    const userParsed = userSchema.parse(users._embedded.users[0]);

    const userSubscriptionsURL = userParsed._links.subscriptions.href;
    const subscriptionsResponse = await fetch(userSubscriptionsURL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    instrumentationService.countHttpStatus('http.client.cdcp-api.subscriptions.gets', subscriptionsResponse.status);

    const subscriptions = subscriptionsSchema.parse(await subscriptionsResponse.json())._embedded.subscriptions.map((subscription) => ({
      id: subscription.id,
      preferredLanguageId: subscription.msLanguageCode,
      alertType: subscription.alertTypeCode,
      userId: userParsed.id,
      email: userParsed.email,
      emailVerified: userParsed.emailVerified,
    }));

    const cdcpSubscriptions = subscriptions.filter((subscription) => subscription.alertType === 'CDCP');
    if (cdcpSubscriptions.length === 0) {
      return null;
    }
    return cdcpSubscriptions.at(0);
  }

  /**
   *
   * @param userId
   *
   */
  async function deleteSubscription(userId: string) {
    const auditService = getAuditService();
    const instrumentationService = getInstrumentationService();
    auditService.audit('alert-subscription.delete', { userId });
    const url = new URL(`${CDCP_API_BASE_URI}/api/v1/users?raoidcUserId=${userId}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    instrumentationService.countHttpStatus('http.client.cdcp-api.users.gets', response.status);

    if (!response.ok) {
      log.error('%j', {
        message: 'Failed find data',
        status: response.status,
        statusText: response.statusText,
        url: url,
        responseBody: await response.text(),
      });

      throw new Error(`Failed to find data. Status: ${response.status}, Status Text: ${response.statusText}`);
    }

    const users = await response.json();
    if (users._embedded.users.length === 0) {
      throw new Error(`Failed to find the user: ${userId}.`);
    }
    const userParsed = userSchema.parse(users._embedded.users[0]);

    const userSubscriptionsURL = userParsed._links.subscriptions.href;
    const subscriptionsResponse = await fetch(userSubscriptionsURL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    instrumentationService.countHttpStatus('http.client.cdcp-api.subscriptions.deletes', subscriptionsResponse.status);

    const subscriptions = subscriptionsSchema.parse(await subscriptionsResponse.json())._embedded.subscriptions;

    const cdcpSubscriptions = subscriptions.filter((subscription) => subscription.alertTypeCode === 'CDCP');

    const deleteSubscriptionUrl = cdcpSubscriptions.at(0)?._links.self.href ?? '';
    const deleteResponse = await fetch(deleteSubscriptionUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    instrumentationService.countHttpStatus('http.client.cdcp-api.subscriptions.deletes', deleteResponse.status);

    if (!deleteResponse.ok) {
      log.error('%j', {
        message: 'Failed to delete data',
        status: deleteResponse.status,
        statusText: deleteResponse.statusText,
        url: url,
        responseBody: await deleteResponse.text(),
      });

      throw new Error(`Failed to delete data. Status: ${deleteResponse.status}, Status Text: ${deleteResponse.statusText}`);
    }
  }

  async function updateSubscription(sin: string, subscription: SubscriptionInfo) {
    const auditService = getAuditService();
    const instrumentationService = getInstrumentationService();
    auditService.audit('alert-subscription.update', { sin });

    // TODO: "IT-Security won't like SIN being passed as identifier"
    // TODO: add CDCP_API_BASE_URI
    const userId = sin;
    const url = new URL(`https://api.cdcp.example.com/v1/users/${userId}/subscriptions`);

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });

    instrumentationService.countHttpStatus('http.client.cdcp-api.subscriptions.posts', response.status);

    if (response.status === 204) {
      return null;
    }

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
  }

  async function validateConfirmationCode(enteredConfirmationCode: string, userId: string) {
    const auditService = getAuditService();
    const instrumentationService = getInstrumentationService();

    auditService.audit('alert-subscription.validate', { userId });
    const url = new URL(`${CDCP_API_BASE_URI}/api/v1/users?raoidcUserId=${userId}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    instrumentationService.countHttpStatus('http.client.cdcp-api.users.gets', response.status);

    if (!response.ok) {
      log.error('%j', {
        message: 'Failed find data',
        status: response.status,
        statusText: response.statusText,
        url: url,
        responseBody: await response.text(),
      });

      throw new Error(`Failed to find data. Status: ${response.status}, Status Text: ${response.statusText}`);
    }

    const users = await response.json();
    if (users._embedded.users.length === 0) {
      throw new Error(`Failed to find the user: ${userId}.`);
    }
    const userParsed = userSchema.parse(users._embedded.users[0]);

    const emailValidationsUrl = userParsed._links.emailValidations.href;
    const emailValidationResponse = await fetch(emailValidationsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ confirmationCode: enteredConfirmationCode }),
    });

    instrumentationService.countHttpStatus('http.client.cdcp-api.email-validations.posts', emailValidationResponse.status);
    if (!emailValidationResponse.ok) {
      log.error('%j', {
        message: 'Failed to verify data',
        status: emailValidationResponse.status,
        statusText: emailValidationResponse.statusText,
        url: url,
        responseBody: await emailValidationResponse.text(),
      });

      throw new Error(`Failed to verify data. Status: ${emailValidationResponse.status}, Status Text: ${emailValidationResponse.statusText}`);
    }

    const verifyStatus = await emailValidationResponse.json();
    if (verifyStatus.status === 202) {
      return true;
    }

    return false;
  }

  async function requestNewConfirmationCode(userId: string) {
    const auditService = getAuditService();
    const instrumentationService = getInstrumentationService();

    auditService.audit('alert-subscription.request-confirmation-code', { userId });

    const url = new URL(`${CDCP_API_BASE_URI}/api/v1/users?raoidcUserId=${userId}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    instrumentationService.countHttpStatus('http.client.cdcp-api.users.gets', response.status);

    if (!response.ok) {
      log.error('%j', {
        message: 'Failed find data',
        status: response.status,
        statusText: response.statusText,
        url: url,
        responseBody: await response.text(),
      });

      throw new Error(`Failed to find data. Status: ${response.status}, Status Text: ${response.statusText}`);
    }

    const users = await response.json();
    if (users._embedded.users.length === 0) {
      throw new Error(`Failed to find the user: ${userId}.`);
    }
    const userParsed = userSchema.parse(users._embedded.users[0]);

    const confirmationCodesUrl = userParsed._links.confirmationCodes.href;
    const confirmationCodeResponse = await fetch(confirmationCodesUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    instrumentationService.countHttpStatus('http.client.cdcp-api.confirmation-codes.posts', confirmationCodeResponse.status);
    if (!confirmationCodeResponse.ok) {
      log.error('%j', {
        message: 'Failed to request data',
        status: confirmationCodeResponse.status,
        statusText: confirmationCodeResponse.statusText,
        url: url,
        responseBody: await response.text(),
      });

      throw new Error(`Failed to request data. Status: ${confirmationCodeResponse.status}, Status Text: ${confirmationCodeResponse.statusText}`);
    }
  }

  return { getSubscription, deleteSubscription, updateSubscription, validateConfirmationCode, requestNewConfirmationCode };
}
