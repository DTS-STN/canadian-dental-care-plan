import type { LoaderFunctionArgs } from '@remix-run/node';
import { redirect } from '@remix-run/node';

import invariant from 'tiny-invariant';

import { getRaoidcService } from '~/services/raoidc-service.server';
import { getSubscriptionService } from '~/services/subscription-service.server';
import { getUserService } from '~/services/user-service.server';
import { featureEnabled } from '~/utils/env.server';
import { UserinfoToken } from '~/utils/raoidc-utils.server';
import { getPathById } from '~/utils/route-utils';

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  featureEnabled('email-alerts');

  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request, session);
  const userInfoToken: UserinfoToken = session.get('userInfoToken');

  const userService = getUserService();
  const subscriptionService = getSubscriptionService();
  invariant(userInfoToken.sin, 'Expected userInfoToken.sin to be defined');

  const userInfo = userService.getUser(userInfoToken.sub);
  const subscriptions = await subscriptionService.getSubscription(userInfoToken.sub);
  const emailVerified = (await userInfo).emailVerified;

  if (emailVerified === false && !subscriptions) {
    return redirect(getPathById('$lang/_protected/alerts+/subscribe+/index', params));
  }

  if (emailVerified) {
    return redirect(getPathById('$lang/_protected/alerts+/manage+/index', params));
  }

  return redirect(getPathById('$lang/_protected/alerts+/subscribe+/confirm', params));
}
