import { Outlet, isRouteErrorResponse, useRouteError } from '@remix-run/react';

import ApplicationLayout, { NotFoundError, ServerError, i18nNamespaces as layoutI18nNamespaces } from '~/components/layouts/application-layout';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import type { RouteHandleData } from '~/utils/route-utils';

export const handle = {
  breadcrumbs: [
    // prettier-ignore
    { labelI18nKey: 'apply:breadcrumbs.canada-ca', to: 'apply:breadcrumbs.canada-ca-url'},
    { labelI18nKey: 'apply:breadcrumbs.benefits', to: 'apply:breadcrumbs.benefits-url' },
    { labelI18nKey: 'apply:breadcrumbs.dental-coverage', to: 'apply:breadcrumbs.dental-coverage-url' },
    { labelI18nKey: 'apply:breadcrumbs.canadian-dental-care-plan', to: 'apply:breadcrumbs.canadian-dental-care-plan-url' },
  ],
  i18nNamespaces: getTypedI18nNamespaces(...layoutI18nNamespaces, 'apply'),
} as const satisfies RouteHandleData;

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    switch (error.status) {
      case 404: {
        return <NotFoundError layout="public" error={error} />;
      }
    }
  }

  return <ServerError layout="public" error={error} />;
}

export default function Layout() {
  return (
    <ApplicationLayout layout="public">
      <Outlet />
    </ApplicationLayout>
  );
}
