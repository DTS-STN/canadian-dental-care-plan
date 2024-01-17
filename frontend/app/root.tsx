import { useContext } from 'react';

import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { ClientEnv } from '~/components/client-env';
import { NonceContext } from '~/components/nonce-context';
import stylesheet from '~/tailwind.css';
import { readBuildInfo } from '~/utils/build-info.server';
import { getEnv, getPublicEnv } from '~/utils/env.server';
import { useI18nNamespaces, usePageTitleI18nKey } from '~/utils/route-utils';

export const links = () => [{ rel: 'stylesheet', href: stylesheet }];

export async function loader({ request }: LoaderFunctionArgs) {
  const buildInfo = readBuildInfo('build-info.json');
  const privateEnv = getEnv();
  const publicEnv = getPublicEnv();

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
