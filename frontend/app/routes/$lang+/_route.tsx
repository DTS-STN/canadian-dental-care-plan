import { LoaderFunctionArgs, json } from '@remix-run/node';
import { Outlet, isRouteErrorResponse, useRouteError } from '@remix-run/react';

import { NotFoundError, ServerError } from '~/components/layouts/public-layout';
import { getLogger } from '~/utils/logging.server';

export function loader({ request, params }: LoaderFunctionArgs) {
  const log = getLogger('$lang+/_route');

  if (!['en', 'fr'].includes(String(params.lang))) {
    log.warn('Invalid lang requested [%s]; responding with 404', params.lang);
    throw new Response(null, { status: 404 });
  }

  return json({ lang: params.lang });
}

/**
 * Do-nothing parent route.
 * (placeholder for future code)
 */
export default function Route() {
  return <Outlet />;
}

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
