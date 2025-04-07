import { useEffect } from 'react';

import { Outlet, useNavigate } from 'react-router';

import type { Route } from './+types/layout';

import { TYPES } from '~/.server/constants';
import { getLocale } from '~/.server/utils/locale.utils';
import { i18nNamespaces as layoutI18nNamespaces } from '~/components/layouts/protected-layout';
import SessionTimeout from '~/components/session-timeout';
//TODO replace with correct import once file is created
import { transformAdobeAnalyticsUrl } from '~/route-helpers/protected-renew-route-helpers';
import { useApiProtectedApplyState } from '~/utils/api-protected-apply-state.utils';
import { useApiSession } from '~/utils/api-session-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'protected-apply:index.page-title' }],
  i18nNamespaces: getTypedI18nNamespaces(...layoutI18nNamespaces),
  transformAdobeAnalyticsUrl,
} as const satisfies RouteHandleData;

// eslint-disable-next-line @typescript-eslint/require-await
export async function loader({ context: { appContainer, session }, request }: Route.LoaderArgs) {
  const locale = getLocale(request);
  const { SESSION_TIMEOUT_PROMPT_SECONDS, SESSION_TIMEOUT_SECONDS } = appContainer.get(TYPES.configs.ClientConfig);
  return { locale, SESSION_TIMEOUT_PROMPT_SECONDS, SESSION_TIMEOUT_SECONDS };
}

export default function Layout({ loaderData, params }: Route.ComponentProps) {
  const { SESSION_TIMEOUT_PROMPT_SECONDS, SESSION_TIMEOUT_SECONDS } = loaderData;

  const navigate = useNavigate();

  const path = getPathById('protected/apply/index', params);

  useEffect(() => {
    // redirect to start if the flow has not yet been initialized
    const protectedApplyState = sessionStorage.getItem('protected.apply.state');

    if (protectedApplyState !== 'active') {
      void navigate(path, { replace: true });
    }
  }, [navigate, path]);

  const apiProtectedApplyState = useApiProtectedApplyState();
  const apiSession = useApiSession();

  async function handleOnSessionEnd() {
    await navigate('/auth/logout');
  }

  async function handleOnSessionExtend() {
    // extends the protected apply state if 'id' param exists
    const id = params.id;
    if (typeof id === 'string') {
      await apiProtectedApplyState.submit({ action: 'extend', id });
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
