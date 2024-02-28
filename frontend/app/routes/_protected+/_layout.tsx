import { Outlet, isRouteErrorResponse, useRouteError } from '@remix-run/react';

import ApplicationLayout, { ServerError, i18nNamespaces as layoutI18nNamespaces } from '~/components/layouts/application-layout';
import type { RouteHandleData } from '~/utils/route-utils';

export const handle = {
  i18nNamespaces: [...layoutI18nNamespaces],
} as const satisfies RouteHandleData;

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    switch (error.status) {
      // TODO :: GjB :: handle other status codes
      default:
        return <ServerError error={error} showAccountMenu />;
    }
  }

  return <ServerError error={error} showAccountMenu />;
}

export default function Layout() {
  return (
    <ApplicationLayout showAccountMenu>
      <Outlet />
    </ApplicationLayout>
  );
}
