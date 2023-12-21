import { useContext } from 'react';

import { cssBundleHref } from '@remix-run/css-bundle';
import { type LinksFunction, type LoaderFunctionArgs, json } from '@remix-run/node';
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from '@remix-run/react';

import { NonceContext } from '~/components/nonce-context';
import stylesheet from '~/tailwind.css';
import { getLocale } from '~/utils/locale-utils';

export const links: LinksFunction = () => [{ rel: 'stylesheet', href: stylesheet }, ...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : [])];

export const loader = ({ request }: LoaderFunctionArgs) => {
  return json({ locale: getLocale(request.url) });
};

export default function App() {
  const { nonce } = useContext(NonceContext);
  const { locale } = useLoaderData<typeof loader>();

  return (
    <html lang={locale ?? 'en'}>
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
