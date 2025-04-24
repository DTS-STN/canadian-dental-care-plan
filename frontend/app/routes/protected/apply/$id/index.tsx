import { redirect } from 'react-router';

import type { Route } from './+types/index';

import { TYPES } from '~/.server/constants';
import { loadProtectedApplyState, saveProtectedApplyState } from '~/.server/routes/helpers/protected-apply-route-helpers';
import type { IdToken } from '~/.server/utils/raoidc.utils';
import { getPathById } from '~/utils/route-utils';

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  loadProtectedApplyState({ params, session });
  saveProtectedApplyState({ params, session, state: {} });

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.domain.services.AuditService).createAudit('page-view.apply.index', { userId: idToken.sub });

  return redirect(getPathById('protected/apply/$id/terms-and-conditions', params));
}
