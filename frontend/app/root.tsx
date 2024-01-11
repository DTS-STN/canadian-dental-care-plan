import { useContext } from 'react';

import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData, useMatches } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { type RouteHandle } from './types';
import { getNamespaces } from './utils/locale-utils';
import { useRouteHandles } from './utils/route-utils';
import { ClientEnv } from '~/components/client-env';
import { NonceContext } from '~/components/nonce-context';
import stylesheet from '~/tailwind.css';
import { readBuildInfo } from '~/utils/build-info.server';
import { getPublicEnv } from '~/utils/env.server';

export const links = () => [{ rel: 'stylesheet', href: stylesheet }];

export const loader = ({ request }: LoaderFunctionArgs) => {
  return json({
    buildInfo: readBuildInfo('build-info.json') ?? {
      buildDate: '2000-01-01T00:00:00Z',
      buildId: '0000',
      buildRevision: '00000000',
      buildVersion: '0.0.0+00000000-0000',
    },
    env: getPublicEnv(),
  });
};

export default function () {
  const { nonce } = useContext(NonceContext);
  const { env } = useLoaderData<typeof loader>();
  const { i18n } = useTranslation();

  return (
    <html lang={i18n.language}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <PageTitle />
        <Meta />
        <Links />
      </head>
      <body vocab="http://schema.org/" typeof="WebPage">
        <Outlet />
        <ClientEnv env={env} nonce={nonce} />
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
        <LiveReload nonce={nonce} />
      </body>
    </html>
  );
}

function PageTitle() {
  const matches = useMatches();
  const { t } = useTranslation(getNamespaces(matches));

  const pageTitlei18nKey = useRouteHandles<RouteHandle>()
    .map((handle) => handle.pageTitlei18nKey)
    .filter((pageTitleKey) => pageTitleKey !== undefined)
    .reduce((last, curr) => curr ?? last, undefined);

  if (pageTitlei18nKey === undefined) {
    return <></>;
  }

  return <title>{t(pageTitlei18nKey)}</title>;
}
