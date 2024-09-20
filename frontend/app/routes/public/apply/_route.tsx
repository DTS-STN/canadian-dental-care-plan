import type { LoaderFunctionArgs } from '@remix-run/node';
import { Outlet, isRouteErrorResponse, useLoaderData, useParams, useRouteError } from '@remix-run/react';

import { NotFoundError, PublicLayout, ServerError, i18nNamespaces as layoutI18nNamespaces } from '~/components/layouts/public-layout';
import SessionTimeout from '~/components/session-timeout';
import { transformAdobeAnalyticsUrl } from '~/route-helpers/apply-route-helpers';
import { useApiApplyState } from '~/utils/api-apply-state-utils';
import { useApiSession } from '~/utils/api-session-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getLocale } from '~/utils/locale-utils.server';
import type { RouteHandleData } from '~/utils/route-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces(...layoutI18nNamespaces),
  transformAdobeAnalyticsUrl,
} as const satisfies RouteHandleData;

// eslint-disable-next-line @typescript-eslint/require-await
export async function loader({ context: { configProvider, serviceProvider, session }, request }: LoaderFunctionArgs) {
  const locale = getLocale(request);
  const { SESSION_TIMEOUT_PROMPT_SECONDS, SESSION_TIMEOUT_SECONDS } = configProvider.getClientConfig();
  return { locale, SESSION_TIMEOUT_PROMPT_SECONDS, SESSION_TIMEOUT_SECONDS };
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
  const { locale, SESSION_TIMEOUT_PROMPT_SECONDS, SESSION_TIMEOUT_SECONDS } = useLoaderData<typeof loader>();
  const params = useParams();
  const apiApplyState = useApiApplyState();
  const apiSession = useApiSession();

  function handleOnSessionEnd() {
    apiSession.submit({ action: 'end', locale, redirectTo: 'cdcp-website-apply' });
  }

  function handleOnSessionExtend() {
    // extends the apply state if 'id' param exists
    const id = params.id;
    if (typeof id === 'string') {
      apiApplyState.submit({ action: 'extend', id });
      return;
    }

    // extends the user's session
    apiSession.submit({ action: 'extend' });
  }

  return (
    <PublicLayout>
      <SessionTimeout promptBeforeIdle={SESSION_TIMEOUT_PROMPT_SECONDS * 1000} timeout={SESSION_TIMEOUT_SECONDS * 1000} onSessionEnd={handleOnSessionEnd} onSessionExtend={handleOnSessionExtend} />
      <Outlet />
    </PublicLayout>
  );
}
