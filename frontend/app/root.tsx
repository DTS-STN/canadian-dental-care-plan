import { useContext } from 'react';

import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { NonceContext } from '~/components/nonce-context';
import stylesheet from '~/tailwind.css';
import { readBuildInfo } from '~/utils/build-info';

export const links = () => [{ rel: 'stylesheet', href: stylesheet }];

export const loader = ({ request }: LoaderFunctionArgs) => {
  const buildInfo = readBuildInfo('build-info.json') ?? {
    buildDate: '2000-01-01T00:00:00Z',
    buildId: '0000',
    buildRevision: '00000000',
    buildVersion: '0.0.0+00000000-0000',
  };

  return json({ buildInfo });
};

export default function App() {
  const { nonce } = useContext(NonceContext);
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
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
        <LiveReload nonce={nonce} />
      </body>
    </html>
  );
}
