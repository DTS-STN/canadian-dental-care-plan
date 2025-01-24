import { redirect } from 'react-router';

import type { Route } from './+types/index';

import { loadApplyState, saveApplyState } from '~/.server/routes/helpers/apply-route-helpers';
import { getPathById } from '~/utils/route-utils';

// eslint-disable-next-line @typescript-eslint/require-await
export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  loadApplyState({ params, session });
  saveApplyState({ params, session, state: {} });
  return redirect(getPathById('public/apply/$id/terms-and-conditions', params));
}
