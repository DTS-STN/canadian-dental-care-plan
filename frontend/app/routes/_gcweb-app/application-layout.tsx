import { type ReactNode } from 'react';

import { PageDetails } from './page-details';
import { PageFooter } from './page-footer';
import { PageHeader } from './page-header';

export type ApplicationLayoutProps = {
  children?: ReactNode;
};

/**
 * GCWeb Application page template.
 * see: https://wet-boew.github.io/GCWeb/templates/application/application-docs-en.html
 */
export function ApplicationLayout({ children }: ApplicationLayoutProps) {
  return (
    <>
      <PageHeader />
      <main className="container" property="mainContentOfPage" resource="#wb-main" typeof="WebPageElement">
        {children}
        <PageDetails />
      </main>
      <PageFooter />
    </>
  );
}
