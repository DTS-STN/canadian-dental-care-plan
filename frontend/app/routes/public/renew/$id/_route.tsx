import { useEffect } from 'react';

import { Outlet, useNavigate, useParams } from '@remix-run/react';

import { handle as layoutHandle } from '~/routes/public/renew/_route';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';

export const handle = {
  // ensure that the parent layout's i18n namespaces are loaded
  i18nNamespaces: [...layoutHandle.i18nNamespaces],
} as const satisfies RouteHandleData;

/**
 * The parent route of all /renew/{id}/* routes, used to
 * redirect to /apply if the flow has not yet been initialized.
 */
export default function Route() {
  const navigate = useNavigate();
  const params = useParams();

  const path = getPathById('public/renew/index', params);

  useEffect(() => {
    // redirect to start if the flow has not yet been initialized
    const flowState = sessionStorage.getItem('flow.state');

    if (flowState !== 'active') {
      navigate(path, { replace: true });
    }
  }, [navigate, path]);

  return <Outlet />;
}
