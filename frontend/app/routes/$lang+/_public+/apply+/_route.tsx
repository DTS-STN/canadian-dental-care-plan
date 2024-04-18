import { LoaderFunctionArgs } from '@remix-run/node';
import { Outlet, isRouteErrorResponse, useLoaderData, useRouteError } from '@remix-run/react';

import { NotFoundError, PublicLayout, ServerError, i18nNamespaces as layoutI18nNamespaces } from '~/components/layouts/public-layout';
import SessionTimeout from '~/components/session-timeout';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getLocale } from '~/utils/locale-utils.server';
import type { RouteHandleData } from '~/utils/route-utils';
import { removePathSegment } from '~/utils/url-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces(...layoutI18nNamespaces),
  //Adobe Analytics needs us to clean up URLs before sending event data. This ensures their reports
  // focus on the core content, not things like tracking codes, because they don't want those to
  // mess up their website visitor categories.
  transformAdobeAnalyticsUrl: (url) => {
    const urlObj = new URL(url);
    const applyRouteRegex = /^\/(en|fr)\/(apply|appliquer)\//i;
    if (!applyRouteRegex.test(urlObj.href)) return urlObj;
    return new URL(removePathSegment(urlObj, 2));
  },
} as const satisfies RouteHandleData;

export async function loader({ context: { session }, request }: LoaderFunctionArgs) {
  const lang = getLocale(request);
  return { lang };
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

export default function Layout() {
  const { lang } = useLoaderData<typeof loader>();
  return (
    <PublicLayout>
      <SessionTimeout navigateTo={`/${lang}/apply`} promptBeforeIdle={5 * 60 * 1000} timeout={15 * 60 * 1000} />
      <Outlet />
    </PublicLayout>
  );
}
