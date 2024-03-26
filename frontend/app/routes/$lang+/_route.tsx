import { LoaderFunctionArgs, json } from '@remix-run/node';
import { Outlet, isRouteErrorResponse, useParams, useRouteError } from '@remix-run/react';

import { BilingualNotFoundError, NotFoundError, ServerError } from '~/components/layouts/public-layout';
import { getLogger } from '~/utils/logging.server';

export function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
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
  const { lang: langParam } = useParams();

  if (isRouteErrorResponse(error)) {
    switch (error.status) {
      case 404: {
        // prettier-ignore
        return isValidLang(langParam)
          ? <NotFoundError error={error} />
          : <BilingualNotFoundError error={error}/>;
      }
    }
  }

  //prettier-ignore
  return isValidLang(langParam)
    ? <ServerError error={error} />
    : <ServerError error={error} />; // TODO :: GjB :: create bilingual 500 page
}

function isValidLang(lang?: string) {
  return lang && ['en', 'fr'].includes(lang);
}
