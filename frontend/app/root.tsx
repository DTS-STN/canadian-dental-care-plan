import { useContext } from 'react';

import { type LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { getRaoidcService } from './services/raoidc-service.server';
import { sessionService } from './services/session-service.server';
import { getLogger } from './utils/logging.server';
import { ClientEnv } from '~/components/client-env';
import { NonceContext } from '~/components/nonce-context';
import stylesheet from '~/tailwind.css';
import { readBuildInfo } from '~/utils/build-info.server';
import { getEnv, getPublicEnv } from '~/utils/env.server';
import { useI18nNamespaces, usePageTitleI18nKey } from '~/utils/route-utils';

export const links = () => [{ rel: 'stylesheet', href: stylesheet }];

export async function loader({ request }: LoaderFunctionArgs) {
  const log = getLogger('root');

  const buildInfo = readBuildInfo('build-info.json');
  const privateEnv = getEnv();
  const publicEnv = getPublicEnv();

  if (privateEnv.AUTH_ENABLED) {
    const raoidcService = await getRaoidcService();
    //
    // XXX :: GjB :: the AUTH_ENABLED feature flag will eventually be removed and
    //               the RAOIDC service will be replaced with calls to either the
    //               real RAOIDC service, or a mock that emulates RAOIDC.
    //
    const session = await sessionService.getSession(request.headers.get('Cookie'));

    if (!session.has('auth')) {
      log.debug('User has not authenticated; redirecting to /auth/login');
      return redirect('/auth/login');
    }

    const { id_token: idToken } = session.get('auth');
    const sessionValid = raoidcService.handleSessionValidation(idToken.sid); // sid is the session ID

    if (!sessionValid) {
      log.debug('RAOIDC session has expired; redirecting to /auth/login');
      return redirect('/auth/login');
    }

    log.debug('Authentication check passed');
  }

  return json({
    buildInfo: buildInfo ?? {
      buildDate: '2000-01-01T00:00:00Z',
      buildId: '0000',
      buildRevision: '00000000',
      buildVersion: '0.0.0+00000000-0000',
    },
    env: publicEnv,
    javascriptEnabled: privateEnv.JAVASCRIPT_ENABLED,
  });
}

export default function () {
  const { nonce } = useContext(NonceContext);
  const { env, javascriptEnabled } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(useI18nNamespaces());
  const pageTitleI18nKey = usePageTitleI18nKey();

  return (
    <html lang={i18n.language}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{pageTitleI18nKey && t(pageTitleI18nKey)}</title>
        <Meta />
        <Links />
      </head>
      <body vocab="http://schema.org/" typeof="WebPage">
        <Outlet />
        {javascriptEnabled && (
          <>
            <ClientEnv env={env} nonce={nonce} />
            <ScrollRestoration nonce={nonce} />
            <Scripts nonce={nonce} />
          </>
        )}
        <LiveReload nonce={nonce} />
      </body>
    </html>
  );
}
