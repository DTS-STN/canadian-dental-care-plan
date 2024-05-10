import { LoaderFunctionArgs, redirect } from '@remix-run/node';

import { loadApplyState, saveApplyState } from '~/route-helpers/apply-route-helpers.server';
import { getPathById } from '~/utils/route-utils';

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  loadApplyState({ params, session });
  saveApplyState({ params, session, state: {} });
  return redirect(getPathById('$lang+/_public+/apply+/$id+/type-application', params));
}
