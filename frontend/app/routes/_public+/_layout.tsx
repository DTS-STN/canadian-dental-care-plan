import { Outlet, isRouteErrorResponse, useRouteError } from '@remix-run/react';

import ApplicationLayout, { NotFoundError, ServerError, i18nNamespaces as layoutI18nNamespaces } from '~/components/layouts/application-layout';
import type { RouteHandleData } from '~/utils/route-utils';

export const handle = {
  i18nNamespaces: [...layoutI18nNamespaces],
} as const satisfies RouteHandleData;

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    switch (error.status) {
      case 404: {
        return <NotFoundError error={error} />;
      }
    }
  }

  return <ServerError error={error} />;
}

export default function Layout() {
  return (
    <ApplicationLayout>
      <Outlet />
    </ApplicationLayout>
  );
}
