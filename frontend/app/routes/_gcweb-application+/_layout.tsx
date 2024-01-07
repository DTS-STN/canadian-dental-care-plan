import { type ReactElement } from 'react';

import { type LinksFunction } from '@remix-run/node';
import { Outlet } from '@remix-run/react';

import AppFooter from '~/components/gcweb/app-footer';
import AppHeader from '~/components/gcweb/app-header';
import PageDetails from '~/components/gcweb/page-details';
import ServerError from '~/components/server-error';

export const handle = { i18nNamespaces: ['gcweb'] };

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

function GCWebApplication({ children }: { children: ReactElement }) {
  return (
    <>
      <AppHeader />
      <main className="container" property="mainContentOfPage" resource="#wb-main" typeof="WebPageElement">
        {children}
        <PageDetails dateModified="2000-01-01" />
      </main>
      <AppFooter />
    </>
  );
}
