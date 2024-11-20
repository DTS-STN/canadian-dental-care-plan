import type { LoaderFunctionArgs } from '@remix-run/node';
import { redirect } from '@remix-run/node';

import { loadApplyState, saveApplyState } from '~/.server/routes/helpers/apply-route-helpers';
import { getPathById } from '~/utils/route-utils';

// eslint-disable-next-line @typescript-eslint/require-await
export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  loadApplyState({ params, session });
  saveApplyState({ params, session, state: {} });
  return redirect(getPathById('public/apply/$id/type-application', params));
}
