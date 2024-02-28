import { Outlet, isRouteErrorResponse, useRouteError } from '@remix-run/react';

import ApplicationLayout, { ServerError, i18nNamespaces as layoutI18nNamespaces } from '~/components/layouts/application-layout';
import type { RouteHandleData } from '~/utils/route-utils';

export const handle: RouteHandleData = {
  i18nNamespaces: [...layoutI18nNamespaces],
} as const;

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    switch (error.status) {
      // TODO :: GjB :: handle other status codes
      default:
        return <ServerError error={error} />;
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
