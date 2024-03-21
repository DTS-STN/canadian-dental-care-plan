import { useEffect } from 'react';

import { LoaderFunctionArgs, json } from '@remix-run/node';
import { Outlet, useLoaderData, useNavigate } from '@remix-run/react';

import { handle as layoutHandle } from '~/routes/$lang+/_public+/apply+/_route';
import { getLocale } from '~/utils/locale-utils.server';
import { RouteHandleData } from '~/utils/route-utils';

export const handle = {
  // ensure that the parent layout's i18n namespaces are loaded
  i18nNamespaces: [...layoutHandle.i18nNamespaces],
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  const locale = getLocale(request);
  return json({ locale });
}

/**
 * The parent route of all /apply/{id}/* routes, used to
 * redirect to /apply if the flow has not yet been initialized.
 */
export default function Route() {
  const { locale } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  useEffect(() => {
    // redirect to start if the flow has not yet been initialized
    const flowState = sessionStorage.getItem('flow.state');
    if (flowState !== 'active') navigate(`/${locale}/apply`, { replace: true });
  }, [locale, navigate]);

  return <Outlet />;
}
