import { LoaderFunctionArgs } from '@remix-run/node';

import { getApplyFlow } from '~/routes-flow/apply-flow';
import { redirectWithLocale } from '~/utils/locale-utils.server';

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ params, request, session });

  const sessionResponseInit = await applyFlow.saveState({ params, request, session, state });
  return redirectWithLocale(request, `/apply/${id}/type-of-application`, sessionResponseInit);
}
