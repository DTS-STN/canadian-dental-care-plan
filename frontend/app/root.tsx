import { useContext } from 'react';

import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { ClientEnv } from '~/components/client-env';
import { NonceContext } from '~/components/nonce-context';
import stylesheet from '~/tailwind.css';
import { readBuildInfo } from '~/utils/build-info.server';
import { getClientEnv } from '~/utils/env.server';

export const links = () => [{ rel: 'stylesheet', href: stylesheet }];

export const loader = ({ request }: LoaderFunctionArgs) => {
  const { LANG_QUERY_PARAM } = getClientEnv();

  return json({
    buildInfo: readBuildInfo('build-info.json') ?? {
      buildDate: '2000-01-01T00:00:00Z',
      buildId: '0000',
      buildRevision: '00000000',
      buildVersion: '0.0.0+00000000-0000',
    },
    env: {
      LANG_QUERY_PARAM,
    },
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
