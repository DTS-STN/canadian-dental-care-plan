import { Outlet, isRouteErrorResponse, useNavigate, useRouteError } from 'react-router';

import type { Route } from './+types/layout';

import { TYPES } from '~/.server/constants';
import { NotFoundError, ProtectedLayout, ServerError, i18nNamespaces as layoutI18nNamespaces } from '~/components/layouts/protected-layout';
import SessionTimeout from '~/components/session-timeout';
import { useApiSession } from '~/utils/api-session-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';

export const handle = {
  i18nNamespaces: [...layoutI18nNamespaces],
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return [{ name: 'dcterms.accessRights', content: '1' }];
});

// eslint-disable-next-line @typescript-eslint/require-await
export async function loader({ context: { appContainer, session }, request }: Route.LoaderArgs) {
  const { SESSION_TIMEOUT_PROMPT_SECONDS, SESSION_TIMEOUT_SECONDS } = appContainer.get(TYPES.configs.ClientConfig);
  return { SESSION_TIMEOUT_PROMPT_SECONDS, SESSION_TIMEOUT_SECONDS };
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundError error={error} />;
  }

  return <ServerError error={error} />;
}

export default function Layout({ loaderData, params }: Route.ComponentProps) {
  const { SESSION_TIMEOUT_PROMPT_SECONDS, SESSION_TIMEOUT_SECONDS } = loaderData;
  const navigate = useNavigate();
  const apiSession = useApiSession();

  async function handleOnSessionEnd() {
    await navigate('/auth/logout');
  }

  async function handleOnSessionExtend() {
    await apiSession.submit({ action: 'extend' });
  }

  return (
    <ProtectedLayout>
      <SessionTimeout promptBeforeIdle={SESSION_TIMEOUT_PROMPT_SECONDS * 1000} timeout={SESSION_TIMEOUT_SECONDS * 1000} onSessionEnd={handleOnSessionEnd} onSessionExtend={handleOnSessionExtend} />
      <Outlet />
    </ProtectedLayout>
  );
}
