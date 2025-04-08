import { redirect } from 'react-router';

import type { Route } from './+types/index';

import { TYPES } from '~/.server/constants';
import { loadProtectedApplyState, saveProtectedApplyState } from '~/.server/routes/helpers/protected-apply-route-helpers';
import { getPathById } from '~/utils/route-utils';

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const instrumentationService = appContainer.get(TYPES.observability.InstrumentationService);

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  loadProtectedApplyState({ params, session });
  saveProtectedApplyState({ params, session, state: {} });

  instrumentationService.countHttpStatus('protected.apply', 302);
  return redirect(getPathById('protected/apply/$id/terms-and-conditions', params));
}
