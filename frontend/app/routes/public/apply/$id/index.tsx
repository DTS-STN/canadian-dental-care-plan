import { redirect } from 'react-router';

import type { Route } from './+types/index';

import { TYPES } from '~/.server/constants';
import { getPathById } from '~/utils/route-utils';

// eslint-disable-next-line @typescript-eslint/require-await
export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const instrumentationService = appContainer.get(TYPES.observability.InstrumentationService);

  instrumentationService.countHttpStatus('public.apply', 302);
  return redirect(getPathById('public/apply/$id/terms-and-conditions', params));
}
