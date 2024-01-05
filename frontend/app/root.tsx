import { useContext } from 'react';

import { cssBundleHref } from '@remix-run/css-bundle';
import { type LinksFunction } from '@remix-run/node';
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, isRouteErrorResponse, useRouteError } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { NonceContext } from '~/components/nonce-context';
import NotFound from '~/components/not-found';
import ServerError from '~/components/server-error';
import stylesheet from '~/tailwind.css';

export const handle = {
  i18nNamespaces: ['common'],
};

export const links: LinksFunction = () => [{ rel: 'stylesheet', href: stylesheet }, ...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : [])];

export default function App() {
  const { nonce } = useContext(NonceContext);
  const { i18n } = useTranslation(handle.i18nNamespaces);

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

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    switch (error.status) {
      case 404:
        return <NotFound />;
    }
  }

  return <ServerError />;
}
