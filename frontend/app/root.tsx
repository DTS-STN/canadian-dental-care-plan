import { useContext } from 'react';

import { cssBundleHref } from '@remix-run/css-bundle';
import { type LinksFunction } from '@remix-run/node';
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { NonceContext } from '~/components/nonce-context';
import stylesheet from '~/tailwind.css';

export const links: LinksFunction = () => [{ rel: 'stylesheet', href: stylesheet }, ...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : [])];

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
      <body>
        <Outlet />
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
        <LiveReload nonce={nonce} />
      </body>
    </html>
  );
}
