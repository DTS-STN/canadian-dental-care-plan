import { redirect } from 'react-router';

import type { Route } from './+types/index';

import { TYPES } from '~/.server/constants';
import { loadApplyState, saveApplyState } from '~/.server/routes/helpers/apply-route-helpers';
import { getPathById } from '~/utils/route-utils';

// eslint-disable-next-line @typescript-eslint/require-await
export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const instrumentationService = appContainer.get(TYPES.observability.InstrumentationService);

  loadApplyState({ params, session });
  saveApplyState({ params, session, state: {} });

  instrumentationService.countHttpStatus('public.apply', 302);
  return redirect(getPathById('public/apply/$id/terms-and-conditions', params));
}
