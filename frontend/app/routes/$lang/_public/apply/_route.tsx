import type { LoaderFunctionArgs } from '@remix-run/node';
import { Outlet, isRouteErrorResponse, useLoaderData, useNavigate, useParams, useRouteError } from '@remix-run/react';

import { NotFoundError, PublicLayout, ServerError, i18nNamespaces as layoutI18nNamespaces } from '~/components/layouts/public-layout';
import SessionTimeout from '~/components/session-timeout';
import { transformAdobeAnalyticsUrl } from '~/route-helpers/apply-route-helpers';
import { ApiApplyStateAction } from '~/routes/api/apply-state';
import { ApiSessionAction } from '~/routes/api/session';
import { useApiApplyState, useApiSession } from '~/utils/api-utils';
import { getPublicEnv } from '~/utils/env-utils.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getLocale } from '~/utils/locale-utils.server';
import type { RouteHandleData } from '~/utils/route-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces(...layoutI18nNamespaces),
  transformAdobeAnalyticsUrl,
} as const satisfies RouteHandleData;

// eslint-disable-next-line @typescript-eslint/require-await
export async function loader({ context: { session }, request }: LoaderFunctionArgs) {
  const lang = getLocale(request);
  const { SESSION_TIMEOUT_PROMPT_SECONDS, SESSION_TIMEOUT_SECONDS } = getPublicEnv();
  return { lang, SESSION_TIMEOUT_PROMPT_SECONDS, SESSION_TIMEOUT_SECONDS };
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
  const { lang, SESSION_TIMEOUT_PROMPT_SECONDS, SESSION_TIMEOUT_SECONDS } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const params = useParams();
  const apiApplyState = useApiApplyState();
  const apiSession = useApiSession();

  function handleOnSessionEnd() {
    apiSession.submit({ action: ApiSessionAction.End });

    // TODO: navigate to CDCP website page
    const to = lang === 'fr' ? '/fr/demander' : '/en/apply';
    navigate(to);
  }

  function handleOnSessionExtend() {
    // extends the apply state if 'id' param exists
    if (typeof params.id === 'string') {
      apiApplyState.submit({ action: ApiApplyStateAction.Extend, id: params.id });
    } else {
      apiSession.submit({ action: ApiSessionAction.Extend });
    }
  }

  return (
    <PublicLayout>
      <SessionTimeout promptBeforeIdle={SESSION_TIMEOUT_PROMPT_SECONDS * 1000} timeout={SESSION_TIMEOUT_SECONDS * 1000} onSessionEnd={handleOnSessionEnd} onSessionExtend={handleOnSessionExtend} />
      <Outlet />
    </PublicLayout>
  );
}
