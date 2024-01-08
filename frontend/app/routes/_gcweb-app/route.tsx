import { type LinksFunction, type LoaderFunctionArgs, json } from '@remix-run/node';
import { Outlet, isRouteErrorResponse, useRouteError } from '@remix-run/react';

import { ApplicationLayout } from './application-layout';
import { ServerError } from './server-error';
import { getEnv } from '~/utils/environment.server';

export const handle = {
  i18nNamespaces: ['gcweb'],
};

export const loader = ({ request }: LoaderFunctionArgs) => {
  return json({ langQueryParam: getEnv('LANG_QUERY_PARAM') ?? 'lang' });
};

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
