import type { LoaderFunctionArgs } from '@remix-run/node';
import { redirect } from '@remix-run/node';

import invariant from 'tiny-invariant';

import { getRaoidcService } from '~/services/raoidc-service.server';
import { featureEnabled } from '~/utils/env.server';
import { UserinfoToken } from '~/utils/raoidc-utils.server';
import { getPathById } from '~/utils/route-utils';

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  featureEnabled('email-alerts');

  const raoidcService = await getRaoidcService();

  await raoidcService.handleSessionValidation(request, session);

  const userInfoToken: UserinfoToken = session.get('userInfoToken');

  invariant(userInfoToken.sin, 'Expected userInfoToken.sin to be defined');

  //const alertSubscription = await getSubscriptionService().getSubscription(userInfoToken.sin);
  return redirect(getPathById('$lang+/_protected+/alerts+/subscribe+/index', params));

  //TODO fix the redirection once we can retrieve the status of the subscription

  /*if (!alertSubscription || alertSubscription.registered === false) {
    return redirect(getPathById('$lang+/_protected+/alerts+/subscribe+/index', params));
  }
  if (alertSubscription.subscribed === true) {
    return redirect(getPathById('$lang+/_protected+/alerts+/manage+/index', params));
  }
  return redirect(getPathById('$lang+/_protected+/alerts+/subscribe+/confirm', params));*/
}
