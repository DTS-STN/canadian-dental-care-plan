import { type LinksFunction } from '@remix-run/node';
import { Outlet, isRouteErrorResponse, useRouteError } from '@remix-run/react';

import { ApplicationLayout } from './application-layout';
import { ServerError } from './server-error';
import { type RouteHandle } from '~/types';

export const handle: RouteHandle = { i18nNamespaces: ['gcweb'] };

export const links: LinksFunction = () => [{ rel: 'stylesheet', href: '/theme/gcweb/css/theme.min.css' }];

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    switch (error.status) {
      // TODO :: GjB :: handle other status codes
      default:
        console.error(error);
        return <ServerError error={error} />;
    }
  }

  console.error(error);
  return <ServerError error={error} />;
}

export default function () {
  return (
    <ApplicationLayout>
      <Outlet />
    </ApplicationLayout>
  );
}
