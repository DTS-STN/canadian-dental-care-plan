import moize from 'moize';
import { z } from 'zod';

import { getAuditService } from '~/services/audit-service.server';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('subscription-service.server');

const subscriptionInfoSchema = z.object({
  id: z.string(),
  sin: z.string(),
  email: z.string(),
  subscribed: z.boolean(),
  preferredLanguage: z.string(),
});

type SubscriptionInfo = z.infer<typeof subscriptionInfoSchema>;

/**
 * Return a singleton instance (by means of memomization) of the subscription service.
 */
export const getSubscriptionService = moize(createSubscriptionService, { onCacheAdd: () => log.info('Creating new subscription service') });

function createSubscriptionService() {
  async function getSubscription(sin: string) {
    const auditService = getAuditService();
    const instrumentationService = getInstrumentationService();
    auditService.audit('alert-subscription.get', { sin });

    // TODO: "IT-Security won't like SIN being passed as identifier"
    // TODO: add CDCP_API_BASE_URI
    const userId = sin;
    const url = new URL(`https://api.example.com/v1/users/${userId}/subscriptions`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    instrumentationService.countHttpStatus('http.client.cdcp-api.alert-subscription.gets', response.status);

    const subscriptionsSchema = z.array(
      z.object({
        id: z.string(),
        sin: z.string(),
        email: z.string(),
        subscribed: z.boolean(),
        preferredLanguage: z.string(),
        alertType: z.string(),
      }),
    );

    const subscriptions = subscriptionsSchema.parse(await response.json()).map((subscription) => ({
      id: subscription.id,
      email: subscription.email,
      subscribed: subscription.subscribed,
      preferredLanguage: subscription.preferredLanguage,
      alertType: subscription.alertType,
    }));

    //TODO: alertType 'cdcp' is configuarable
    return subscriptions.filter((subscription) => subscription.alertType === 'cdcp').at(0);
  }

  async function updateSubscription(sin: string, subscription: SubscriptionInfo) {
    const auditService = getAuditService();
    const instrumentationService = getInstrumentationService();
    auditService.audit('alert-subscription.update', { sin });

    // TODO: "IT-Security won't like SIN being passed as identifier"
    // TODO: add CDCP_API_BASE_URI
    const userId = sin;
    const url = new URL(`https://api.example.com/v1/users/${userId}/subscriptions`);

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });

    instrumentationService.countHttpStatus('http.client.cdcp-api.alert-subscription.posts', response.status);

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

  return { getSubscription, updateSubscription };
}
