import { LoaderFunctionArgs, redirect } from '@remix-run/node';

import { loadApplyAdultState, saveApplyAdultState } from '~/route-helpers/apply-adult-route-helpers.server';
import { getPathById } from '~/utils/route-utils';

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  loadApplyAdultState({ params, request, session });
  saveApplyAdultState({ params, request, session, state: {} });
  return redirect(getPathById('$lang+/_public+/apply+/$id+/type-application', params));
}
