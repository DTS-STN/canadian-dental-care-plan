import { LoaderFunctionArgs } from '@remix-run/node';

import { getApplyRouteHelpers } from '~/route-helpers/apply-route-helpers';
import { redirectWithLocale } from '~/utils/locale-utils.server';

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const applyRouteHelpers = getApplyRouteHelpers();
  const { id, state } = await applyRouteHelpers.loadState({ params, request, session });

  const sessionResponseInit = await applyRouteHelpers.saveState({ params, request, session, state });
  return redirectWithLocale(request, `/apply/${id}/type-of-application`, sessionResponseInit);
}
