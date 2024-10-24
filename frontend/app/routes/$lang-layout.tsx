import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Outlet, isRouteErrorResponse, useParams, useRouteError } from '@remix-run/react';

import { BilingualNotFoundError, NotFoundError, ServerError } from '~/components/layouts/public-layout';
import { isAppLocale } from '~/utils/locale-utils';
import { getLogger } from '~/utils/logging.server';

export function loader({ context: { configProvider, serviceProvider, session }, params, request }: LoaderFunctionArgs) {
  const log = getLogger('$lang/_route');
  const lang = params.lang;

  if (!isAppLocale(lang)) {
    log.warn('Invalid lang requested [%s]; responding with 404', lang);
    throw new Response(null, { status: 404 });
  }

  return json({ lang });
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
  const params = useParams();
  const lang = params.lang;

  if (isRouteErrorResponse(error)) {
    switch (error.status) {
      case 404: {
        // prettier-ignore
        return isAppLocale(lang)
          ? <NotFoundError error={error} />
          : <BilingualNotFoundError error={error}/>;
      }
    }
  }

  //prettier-ignore
  return isAppLocale(lang)
    ? <ServerError error={error} />
    : <ServerError error={error} />; // TODO :: GjB :: create bilingual 500 page
}
