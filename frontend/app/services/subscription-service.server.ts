import moize from 'moize';
import { z } from 'zod';

import { getAuditService } from '~/services/audit-service.server';
import { getEnv } from '~/utils/env-utils.server';
import { getFetchFn, instrumentedFetch } from '~/utils/fetch-utils.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('subscription-service.server');

const subscriptionInfoSchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  msLanguageCode: z.string(),
  alertTypeCode: z.string(),
  email: z.string().optional(),
  emailVerifed: z.boolean().optional(),
});

type SubscriptionInfo = z.infer<typeof subscriptionInfoSchema>;

const userUpateInfoSchema = z.object({
  email: z.string(),
});

type UserUpdateInfo = z.infer<typeof userUpateInfoSchema>;

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
  const { CDCP_API_BASE_URI, HTTP_PROXY_URL } = getEnv();
  const fetchFn = getFetchFn(HTTP_PROXY_URL);

  //TODO: move this function to user service after it is available
  async function getUserByRaoidcUserId(userId: string) {
    const auditService = getAuditService();
    auditService.audit('alert-subscription.get', { userId });

    const url = new URL(`${CDCP_API_BASE_URI}/api/v1/users?raoidcUserId=${userId}`);
    const response = await instrumentedFetch(fetchFn, 'http.client.cdcp-api.users.gets', url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

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
      //TODO: insert createUser api call here when it is ready
      return null;
    }
    const userParsed = userSchema.parse(users._embedded.users[0]);

    return userParsed;
  }

  async function updateUser(userId: string, userInfo: UserUpdateInfo) {
    const auditService = getAuditService();
    auditService.audit('alert-subscription.get', { userId });

    const url = new URL(`${CDCP_API_BASE_URI}/api/v1/users/${userId}`);
    const response = await instrumentedFetch(fetchFn, 'http.client.cdcp-api.users.patches', url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{ op: 'replace', path: '/email', value: userInfo.email }]),
    });

    if (!response.ok) {
      log.error('%j', {
        message: 'Failed to update data',
        status: response.status,
        statusText: response.statusText,
        url: url,
        responseBody: await response.text(),
      });

      throw new Error(`Failed to update data. Status: ${response.status}, Status Text: ${response.statusText}`);
    }
  }

  /**
   *
   * @param userId
   * @returns the subscription details for the user or null if no user is found or the user has no CDCP subscriptions.
   */
  async function getSubscription(userId: string) {
    const auditService = getAuditService();
    auditService.audit('alert-subscription.get', { userId });

    const url = new URL(`${CDCP_API_BASE_URI}/api/v1/users/${userId}`);
    const response = await instrumentedFetch(fetchFn, 'http.client.cdcp-api.users.gets', url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

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

    const user = await response.json();
    const userParsed = userSchema.parse(user);

    const userSubscriptionsURL = userParsed._links.subscriptions.href;
    const subscriptionsResponse = await instrumentedFetch(fetchFn, 'http.client.cdcp-api.subscriptions.gets', userSubscriptionsURL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

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
    auditService.audit('alert-subscription.delete', { userId });

    const url = new URL(`${CDCP_API_BASE_URI}/api/v1/users/${userId}`);
    const response = await instrumentedFetch(fetchFn, 'http.client.cdcp-api.users.gets', url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

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

    const user = await response.json();
    const userParsed = userSchema.parse(user);

    const userSubscriptionsURL = userParsed._links.subscriptions.href;
    const subscriptionsResponse = await instrumentedFetch(fetchFn, 'http.client.cdcp-api.subscriptions.gets', userSubscriptionsURL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const subscriptions = subscriptionsSchema.parse(await subscriptionsResponse.json())._embedded.subscriptions;

    const cdcpSubscriptions = subscriptions.filter((subscription) => subscription.alertTypeCode === 'CDCP');

    const deleteSubscriptionUrl = cdcpSubscriptions.at(0)?._links.self.href ?? '';
    const deleteResponse = await instrumentedFetch(fetchFn, 'http.client.cdcp-api.subscriptions.deletes', deleteSubscriptionUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

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

  async function createSubscription(userId: string, subscription: SubscriptionInfo) {
    const auditService = getAuditService();
    auditService.audit('alert-subscription.update', { userId });

    const url = new URL(`${CDCP_API_BASE_URI}/api/v1/users/${userId}`);
    const response = await instrumentedFetch(fetchFn, 'http.client.cdcp-api.users.gets', url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

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

    const user = await response.json();
    const userParsed = userSchema.parse(user);

    const userSubscriptionsURL = userParsed._links.subscriptions.href;
    const subscriptionsResponse = await instrumentedFetch(fetchFn, 'http.client.cdcp-api.subscriptions.posts', userSubscriptionsURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });

    if (!subscriptionsResponse.ok) {
      log.error('%j', {
        message: 'Failed to create data',
        status: subscriptionsResponse.status,
        statusText: subscriptionsResponse.statusText,
        url: url,
        responseBody: await subscriptionsResponse.text(),
      });

      throw new Error(`Failed to create data. Status: ${subscriptionsResponse.status}, Status Text: ${subscriptionsResponse.statusText}`);
    }
  }

  async function updateSubscription(userId: string, subscription: SubscriptionInfo) {
    const auditService = getAuditService();
    auditService.audit('alert-subscription.update', { userId });

    const url = new URL(`https://api.cdcp.example.com/api/v1/users/${userId}`);
    const response = await instrumentedFetch(fetchFn, 'http.client.cdcp-api.users.gets', url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

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

    const user = await response.json();
    const userParsed = userSchema.parse(user);

    const subscriptionsUrl = userParsed._links.subscriptions.href;
    const updateSubscriptionUrl = `${subscriptionsUrl}/${subscription.id}`;
    const updateSubscriptionResponse = await instrumentedFetch(fetchFn, 'http.client.cdcp-api.subscriptions.patches', updateSubscriptionUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{ op: 'replace', path: '/msLanguageCode', value: subscription.msLanguageCode }]),
    });

    if (!updateSubscriptionResponse.ok) {
      log.error('%j', {
        message: 'Failed to update data',
        status: updateSubscriptionResponse.status,
        statusText: updateSubscriptionResponse.statusText,
        url: url,
        responseBody: await updateSubscriptionResponse.text(),
      });

      throw new Error(`Failed to update data. Status: ${updateSubscriptionResponse.status}, Status Text: ${updateSubscriptionResponse.statusText}`);
    }
  }

  async function validateConfirmationCode(enteredConfirmationCode: string, userId: string) {
    const auditService = getAuditService();
    auditService.audit('alert-subscription.validate', { userId });

    const url = new URL(`${CDCP_API_BASE_URI}/api/v1/users/${userId}`);
    const response = await instrumentedFetch(fetchFn, 'http.client.cdcp-api.users.gets', url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

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

    const user = await response.json();
    const userParsed = userSchema.parse(user);

    const emailValidationsUrl = userParsed._links.emailValidations.href;
    const emailValidationResponse = await instrumentedFetch(fetchFn, 'http.client.cdcp-api.email-validations.posts', emailValidationsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ confirmationCode: enteredConfirmationCode }),
    });

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
    auditService.audit('alert-subscription.request-confirmation-code', { userId });

    const url = new URL(`${CDCP_API_BASE_URI}/api/v1/users/${userId}`);
    const response = await instrumentedFetch(fetchFn, 'http.client.cdcp-api.users.gets', url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

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

    const user = await response.json();
    const userParsed = userSchema.parse(user);

    const confirmationCodesUrl = userParsed._links.confirmationCodes.href;
    const confirmationCodeResponse = await instrumentedFetch(fetchFn, 'http.client.cdcp-api.confirmation-codes.posts', confirmationCodesUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

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

  return { getUserByRaoidcUserId, updateUser, getSubscription, deleteSubscription, createSubscription, updateSubscription, validateConfirmationCode, requestNewConfirmationCode };
}
