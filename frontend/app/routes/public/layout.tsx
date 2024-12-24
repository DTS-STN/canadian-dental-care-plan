import type { LoaderFunctionArgs } from 'react-router';
import { Outlet, data, isRouteErrorResponse, useParams, useRouteError } from 'react-router';

import { TYPES } from '~/.server/constants';
import { BilingualNotFoundError, NotFoundError, ServerError } from '~/components/layouts/public-layout';
import { isAppLocale } from '~/utils/locale-utils';

export function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const logFactory = appContainer.get(TYPES.factories.LogFactory);
  const log = logFactory.createLogger('public/layout/loader');

  if (!isAppLocale(params.lang)) {
    log.warn('Invalid lang requested [%s]; responding with 404', params.lang);
    throw data(null, { status: 404 });
  }

  return { lang: params.lang };
}

export function ErrorBoundary() {
  const error = useRouteError();
  const params = useParams();
  const lang = params.lang;

  if (isRouteErrorResponse(error) && error.status === 404) {
    return isAppLocale(lang) ? <NotFoundError error={error} /> : <BilingualNotFoundError error={error} />;
  }

  // TODO :: GjB :: create bilingual 500 page
  return isAppLocale(lang) ? <ServerError error={error} /> : <ServerError error={error} />;
}

/**
 * Do-nothing parent route.
 * (placeholder for future code)
 */
export default function Route() {
  return <Outlet />;
}
