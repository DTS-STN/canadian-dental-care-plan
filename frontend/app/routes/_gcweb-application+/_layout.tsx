import { type LinksFunction } from '@remix-run/node';
import { Outlet } from '@remix-run/react';

import AppFooter from '~/components/gcweb/app-footer';
import AppHeader from '~/components/gcweb/app-header';
import PageDetails from '~/components/gcweb/page-details';

export const handle = {
  i18nNamespaces: ['gcweb'],
};

export const links: LinksFunction = () => [{ rel: 'stylesheet', href: '/theme/gcweb/css/theme.min.css' }];

export default function Layout() {
  return (
    <>
      <AppHeader />
      <main className="container" property="mainContentOfPage" resource="#wb-main" typeof="WebPageElement">
        <Outlet />
        <PageDetails dateModified="2000-01-01" />
      </main>
      <AppFooter />
    </>
  );
}
