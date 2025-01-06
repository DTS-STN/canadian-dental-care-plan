import { useEffect } from 'react';

import type { LoaderFunctionArgs } from 'react-router';
import { Outlet, useLoaderData, useNavigate, useParams } from 'react-router';

import { TYPES } from '~/.server/constants';
import { getLocale } from '~/.server/utils/locale.utils';
import { i18nNamespaces as layoutI18nNamespaces } from '~/components/layouts/protected-layout';
import SessionTimeout from '~/components/session-timeout';
import { transformAdobeAnalyticsUrl } from '~/route-helpers/protected-renew-route-helpers';
import { useApiProtectedRenewState } from '~/utils/api-protected-renew-state.utils';
import { useApiSession } from '~/utils/api-session-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces(...layoutI18nNamespaces),
  transformAdobeAnalyticsUrl,
} as const satisfies RouteHandleData;

// eslint-disable-next-line @typescript-eslint/require-await
export async function loader({ context: { appContainer, session }, request }: LoaderFunctionArgs) {
  const locale = getLocale(request);
  const { SESSION_TIMEOUT_PROMPT_SECONDS, SESSION_TIMEOUT_SECONDS } = appContainer.get(TYPES.configs.ClientConfig);
  return { locale, SESSION_TIMEOUT_PROMPT_SECONDS, SESSION_TIMEOUT_SECONDS };
}

export default function Layout() {
  const { locale, SESSION_TIMEOUT_PROMPT_SECONDS, SESSION_TIMEOUT_SECONDS } = useLoaderData<typeof loader>();

  const navigate = useNavigate();
  const params = useParams();

  const path = getPathById('protected/renew/index', params);

  useEffect(() => {
    // redirect to start if the flow has not yet been initialized
    const protectedRenewState = sessionStorage.getItem('protected.renew.state');

    if (protectedRenewState !== 'active') {
      void navigate(path, { replace: true });
    }
  }, [navigate, path]);

  const apiProtectedRenewState = useApiProtectedRenewState();
  const apiSession = useApiSession();

  async function handleOnSessionEnd() {
    await apiSession.submit({ action: 'end', locale, redirectTo: 'cdcp-website-apply' });
  }

  async function handleOnSessionExtend() {
    // extends the protected renew state if 'id' param exists
    const id = params.id;
    if (typeof id === 'string') {
      await apiProtectedRenewState.submit({ action: 'extend', id });
      return;
    }

    // extends the user's session
    await apiSession.submit({ action: 'extend' });
  }

  return (
    <>
      <SessionTimeout promptBeforeIdle={SESSION_TIMEOUT_PROMPT_SECONDS * 1000} timeout={SESSION_TIMEOUT_SECONDS * 1000} onSessionEnd={handleOnSessionEnd} onSessionExtend={handleOnSessionExtend} />
      <Outlet />
    </>
  );
}
