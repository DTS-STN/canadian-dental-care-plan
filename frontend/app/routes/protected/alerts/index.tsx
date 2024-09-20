import type { LoaderFunctionArgs } from '@remix-run/node';
import { redirect } from '@remix-run/node';

import invariant from 'tiny-invariant';

import { getRaoidcService } from '~/services/raoidc-service.server';
import { getSubscriptionService } from '~/services/subscription-service.server';
import { featureEnabled } from '~/utils/env-utils.server';
import type { UserinfoToken } from '~/utils/raoidc-utils.server';
import { getPathById } from '~/utils/route-utils';

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  featureEnabled('email-alerts');

  const raoidcService = await getRaoidcService();

  await raoidcService.handleSessionValidation(request, session);

  const userInfoToken: UserinfoToken = session.get('userInfoToken');

  invariant(userInfoToken.sub, 'Expected userInfoToken.sub to be defined');

  const subscriptionService = getSubscriptionService();
  const subscription = await subscriptionService.getSubscription(session.get('userId'));

  if (!subscription) {
    return redirect(getPathById('protected/alerts/subscribe/index', params));
  }

  return subscription.emailVerified ? redirect(getPathById('protected/alerts/manage/index', params)) : redirect(getPathById('protected/alerts/subscribe/confirm', params));
}
