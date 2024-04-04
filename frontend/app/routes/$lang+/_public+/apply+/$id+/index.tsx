import { LoaderFunctionArgs } from '@remix-run/node';

import { getApplyRouteHelpers } from '~/route-helpers/apply-route-helpers.server';
import { redirectWithLocale } from '~/utils/locale-utils.server';

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const applyRouteHelpers = getApplyRouteHelpers();
  const state = await applyRouteHelpers.loadState({ params, request, session });

  await applyRouteHelpers.saveState({ params, request, session, state });
  return redirectWithLocale(request, `/apply/${state.id}/type-application`);
}
