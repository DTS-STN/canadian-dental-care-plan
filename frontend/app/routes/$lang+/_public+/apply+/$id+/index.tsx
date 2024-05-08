import { LoaderFunctionArgs, redirect } from '@remix-run/node';

import { loadApplyAdultChildState, saveApplyAdultChildState } from '~/route-helpers/apply-adult-child-route-helpers.server';
import { loadApplyAdultState, saveApplyAdultState } from '~/route-helpers/apply-adult-route-helpers.server';
import { getPathById } from '~/utils/route-utils';

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  loadApplyAdultState({ params, request, session });
  saveApplyAdultState({ params, request, session, state: {} });
  loadApplyAdultChildState({ params, request, session });
  saveApplyAdultChildState({ params, request, session, state: {} });
  return redirect(getPathById('$lang+/_public+/apply+/$id+/type-application', params));
}
