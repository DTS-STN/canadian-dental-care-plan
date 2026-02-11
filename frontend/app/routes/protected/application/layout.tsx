import { useEffect } from 'react';

import { Outlet, useNavigate } from 'react-router';

import { faLaptopCode } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import type { Route } from './+types/layout';

import { TYPES } from '~/.server/constants';
import { KILLSWITCH_KEY } from '~/.server/domain/services';
import { getLocale } from '~/.server/utils/locale.utils';
import { DebugPayload } from '~/components/debug-payload';
import { KillswitchDialog } from '~/components/killswitch-dialog';
import { i18nNamespaces as layoutI18nNamespaces } from '~/components/layouts/protected-layout';
import SessionTimeout from '~/components/session-timeout';
import { transformAdobeAnalyticsUrl } from '~/route-helpers/application-route-helpers';
import { useApiApplicationState } from '~/utils/api-application-state-utils';
import { useApiSession } from '~/utils/api-session-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';

export const handle = {
  // Declare all i18n namespaces required by this route and its descendants.
  // Preloading them upfront ensures translations are available on initial render.
  i18nNamespaces: getTypedI18nNamespaces(
    ...layoutI18nNamespaces,
    'common',
    'application',
    'application-full-adult',
    'application-full-child',
    'application-full-family',
    'application-simplified-adult',
    'application-simplified-child',
    'application-simplified-family',
    'application-spokes',
  ),
  transformAdobeAnalyticsUrl,
} as const satisfies RouteHandleData;

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const locale = getLocale(request);

  const redisService = appContainer.find(TYPES.RedisService);
  const killswitchTimeout = (await redisService?.ttl(KILLSWITCH_KEY)) ?? 0;

  // load application state debug data only in development mode
  const { NODE_ENV } = appContainer.get(TYPES.ServerConfig);
  const applicationStateDebugData = NODE_ENV === 'development' && params.id ? session.find(`protected-application-flow-${params.id}`).unwrapUnchecked() : undefined;

  const { SESSION_TIMEOUT_PROMPT_SECONDS, SESSION_TIMEOUT_SECONDS } = appContainer.get(TYPES.ClientConfig);
  return { applicationStateDebugData, killswitchTimeout, locale, SESSION_TIMEOUT_PROMPT_SECONDS, SESSION_TIMEOUT_SECONDS };
}

export default function Layout({ loaderData, params }: Route.ComponentProps) {
  const { applicationStateDebugData, killswitchTimeout, locale, SESSION_TIMEOUT_PROMPT_SECONDS, SESSION_TIMEOUT_SECONDS } = loaderData;

  const navigate = useNavigate();

  const path = getPathById('protected/application/index', params);

  useEffect(() => {
    // redirect to start if the flow has not yet been initialized
    const flowState = sessionStorage.getItem('flow.state');

    if (flowState !== 'active') {
      void navigate(path, { replace: true });
    }
  }, [navigate, path]);

  const apiApplicationState = useApiApplicationState();
  const apiSession = useApiSession();

  async function handleOnSessionEnd() {
    await apiSession.submit({ action: 'end', locale, redirectTo: 'cdcp-website-apply' });
  }

  async function handleOnSessionExtend() {
    // extends the application state if 'id' param exists
    const id = params.id;
    if (typeof id === 'string') {
      await apiApplicationState.submit({ action: 'extend', id });
      return;
    }

    // extends the user's session
    await apiSession.submit({ action: 'extend' });
  }

  return (
    <>
      <KillswitchDialog timeoutSecs={killswitchTimeout} />
      <SessionTimeout promptBeforeIdle={SESSION_TIMEOUT_PROMPT_SECONDS * 1000} timeout={SESSION_TIMEOUT_SECONDS * 1000} onSessionEnd={handleOnSessionEnd} onSessionExtend={handleOnSessionExtend} />
      <Outlet />
      {applicationStateDebugData && (
        <>
          <h2 className="font-lato mt-10 flex items-center gap-2 rounded-t-md border border-orange-400 bg-orange-100 p-4 text-xl font-bold text-orange-600">
            <FontAwesomeIcon icon={faLaptopCode} />
            <span>Application State Debug Data</span>
          </h2>
          <div className="border border-t-0 border-orange-400">
            <DebugPayload data={applicationStateDebugData} />
          </div>
        </>
      )}
    </>
  );
}
