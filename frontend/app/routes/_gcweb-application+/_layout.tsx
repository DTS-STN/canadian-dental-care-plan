import { type LinksFunction } from '@remix-run/node';
import { Outlet } from '@remix-run/react';

import GCWebApplication from '~/components/gcweb/gcweb-application';
import ServerError from '~/components/server-error';

export const handle = {
  i18nNamespaces: ['gcweb'],
};

export const links: LinksFunction = () => [{ rel: 'stylesheet', href: '/theme/gcweb/css/theme.min.css' }];

export default function Layout() {
  return (
    <GCWebApplication>
      <Outlet />
    </GCWebApplication>
  );
}

export function ErrorBoundary() {
  return (
    <GCWebApplication>
      <ServerError />
    </GCWebApplication>
  );
}
