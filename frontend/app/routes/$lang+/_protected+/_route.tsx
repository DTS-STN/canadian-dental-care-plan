import { LoaderFunctionArgs } from '@remix-run/node';
import { Outlet, isRouteErrorResponse, json, useLoaderData, useRouteError } from '@remix-run/react';

import { NotFoundError, ProtectedLayout, ServerError, i18nNamespaces as layoutI18nNamespaces } from '~/components/layouts/protected-layout';
import SessionTimeout from '~/components/session-timeout';
import { getPublicEnv } from '~/utils/env.server';
import type { RouteHandleData } from '~/utils/route-utils';

export const handle = {
  i18nNamespaces: [...layoutI18nNamespaces],
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  const env = getPublicEnv();
  return json({ env });
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
  const { env } = useLoaderData<typeof loader>();
  return (
    <ProtectedLayout>
      <SessionTimeout promptBeforeIdle={env.SESSION_TIMEOUT_PROMPT_SECONDS * 1000} timeout={env.SESSION_TIMEOUT_SECONDS * 1000} navigateTo="/auth/logout" />
      <Outlet />
    </ProtectedLayout>
  );
}
