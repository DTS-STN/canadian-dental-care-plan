import type { LoaderFunctionArgs } from '@remix-run/node';
import { Outlet, isRouteErrorResponse, useLoaderData, useNavigate, useRouteError } from '@remix-run/react';

import { NotFoundError, ProtectedLayout, ServerError, i18nNamespaces as layoutI18nNamespaces } from '~/components/layouts/protected-layout';
import SessionTimeout from '~/components/session-timeout';
import { ApiSessionAction } from '~/routes/api/session';
import { useApiSession } from '~/utils/api-utils';
import { getPublicEnv } from '~/utils/env-utils.server';
import type { RouteHandleData } from '~/utils/route-utils';

export const handle = {
  i18nNamespaces: [...layoutI18nNamespaces],
} as const satisfies RouteHandleData;

// eslint-disable-next-line @typescript-eslint/require-await
export async function loader({ context: { session }, request }: LoaderFunctionArgs) {
  const { SESSION_TIMEOUT_PROMPT_SECONDS, SESSION_TIMEOUT_SECONDS } = getPublicEnv();
  return { SESSION_TIMEOUT_PROMPT_SECONDS, SESSION_TIMEOUT_SECONDS };
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
  const { SESSION_TIMEOUT_PROMPT_SECONDS, SESSION_TIMEOUT_SECONDS } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const apiSession = useApiSession();

  function handleOnSessionEnd() {
    navigate('/auth/logout');
  }

  function handleOnSessionExtend() {
    apiSession.submit({ action: ApiSessionAction.Extend });
  }

  return (
    <ProtectedLayout>
      <SessionTimeout promptBeforeIdle={SESSION_TIMEOUT_PROMPT_SECONDS * 1000} timeout={SESSION_TIMEOUT_SECONDS * 1000} onSessionEnd={handleOnSessionEnd} onSessionExtend={handleOnSessionExtend} />
      <Outlet />
    </ProtectedLayout>
  );
}
