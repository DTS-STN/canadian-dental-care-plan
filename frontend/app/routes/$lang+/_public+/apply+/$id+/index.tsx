import { LoaderFunctionArgs } from '@remix-run/node';

import { getApplyFlow } from '~/routes-flow/apply-flow';
import { redirectWithLocale } from '~/utils/locale-utils.server';

export async function loader({ request, params }: LoaderFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ request, params });

  const sessionResponseInit = await applyFlow.saveState({ request, params, state });
  return redirectWithLocale(request, `/apply/${id}/type-of-application`, sessionResponseInit);
}
