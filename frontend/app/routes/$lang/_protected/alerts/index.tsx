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

  invariant(userInfoToken.sub, 'Expected userInfoToken.sub to be defined');

  //TODO: need to fix manager/index, subscribe/confirm, subscribe/index mock API
  //const subscriptionService = getSubscriptionService();
  //const user = await subscriptionService.getUserByRaoidcUserId(userInfoToken.sub);

  return redirect(getPathById('$lang/_protected/alerts/subscribe/index', params));

  //TODO: need to fix manager/index, subscribe/confirm, subscribe/index mock API
  /*
  if(!user.email) {
      return redirect(getPathById('$lang/_protected/alerts/subscribe/index', params)); 
  }
  
  return user.emailVerified
  ? redirect(getPathById('$lang/_protected/alerts/manage/index', params));
  : redirect(getPathById('$lang/_protected/alerts/subscribe/confirm', params));

  */
}
