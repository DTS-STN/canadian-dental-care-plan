import { useContext } from 'react';

import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { NonceContext } from './components/nonce-context';
import stylesheet from '~/tailwind.css';

export const handle = {
  gcweb: {
    dateModified: '2000-01-01',
    version: '0.0.0',
  },
};

export const links = () => [{ rel: 'stylesheet', href: stylesheet }];

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
