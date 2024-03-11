import type { ComponentProps, PropsWithChildren } from 'react';

import { Trans, useTranslation } from 'react-i18next';

import { Breadcrumbs } from '~/components/breadcrumbs';
import { InlineLink } from '~/components/inline-link';
import { PageDetails } from '~/components/page-details';
import { PageFooter } from '~/components/page-footer';
import { PageHeaderBrand } from '~/components/page-header-brand';
import { PageTitle } from '~/components/page-title';
import { SkipNavigationLinks } from '~/components/skip-navigation-links';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { useI18nNamespaces, usePageTitleI18nKey } from '~/utils/route-utils';

export const i18nNamespaces = getTypedI18nNamespaces('gcweb');

/**
 * GCWeb Application page template.
 * see: https://wet-boew.github.io/GCWeb/templates/application/application-docs-en.html
 */
export function PublicLayout({ children }: PropsWithChildren) {
  return (
    <>
      <SkipNavigationLinks />
      <PageHeader />
      <PageBreadcrumbs />
      <main className="container" property="mainContentOfPage" resource="#wb-main" typeof="WebPageElement">
        <AppPageTitle />
        <div>{children}</div>
        <PageDetails />
      </main>
      <PageFooter />
    </>
  );
}

function AppPageTitle(props: Omit<ComponentProps<typeof PageTitle>, 'children'>) {
  const { t } = useTranslation(useI18nNamespaces());
  const pageTitleI18nKey = usePageTitleI18nKey();
  return pageTitleI18nKey && <PageTitle {...props}>{t(pageTitleI18nKey)}</PageTitle>;
}

function PageHeader() {
  return (
    <header className="border-b-[3px] border-slate-700">
      <PageHeaderBrand />
    </header>
  );
}

function PageBreadcrumbs() {
  const { t } = useTranslation([...i18nNamespaces, ...useI18nNamespaces()]);
  return (
    <Breadcrumbs
      items={[
        { content: t('gcweb:breadcrumbs.canada-ca'), to: t('gcweb:breadcrumbs.canada-ca-url') },
        { content: t('gcweb:breadcrumbs.benefits'), to: t('gcweb:breadcrumbs.benefits-url') },
        { content: t('gcweb:breadcrumbs.dental-coverage'), to: t('gcweb:breadcrumbs.dental-coverage-url') },
        { content: t('gcweb:breadcrumbs.canadian-dental-care-plan'), to: t('gcweb:breadcrumbs.canadian-dental-care-plan-url') },
      ]}
    />
  );
}

export interface NotFoundErrorProps {
  error?: unknown;
}

export function NotFoundError({ error }: NotFoundErrorProps) {
  const { t } = useTranslation(i18nNamespaces);
  const home = <InlineLink to="/" />;

  return (
    <>
      <PageHeader />
      <main className="container" property="mainContentOfPage" resource="#wb-main" typeof="WebPageElement">
        <PageTitle>
          <span>{t('gcweb:not-found.page-title')}</span>
          <small className="block text-2xl font-normal text-neutral-500">{t('gcweb:not-found.page-subtitle')}</small>
        </PageTitle>
        <p className="mb-8 text-lg text-gray-500">{t('gcweb:not-found.page-message')}</p>
        <ul className="list-disc space-y-2 pl-10">
          <li>
            <Trans ns={i18nNamespaces} i18nKey="gcweb:not-found.page-link" components={{ home }} />
          </li>
        </ul>
        <PageDetails />
      </main>
      <PageFooter />
    </>
  );
}

export interface ServerErrorProps {
  error: unknown;
}

export function ServerError({ error }: ServerErrorProps) {
  const { t } = useTranslation(i18nNamespaces);
  const home = <InlineLink to="/" />;

  return (
    <>
      <PageHeader />
      <main className="container" property="mainContentOfPage" resource="#wb-main" typeof="WebPageElement">
        <PageTitle>
          <span>{t('gcweb:server-error.page-title')}</span>
          <small className="block text-2xl font-normal text-neutral-500">{t('gcweb:server-error.page-subtitle')}</small>
        </PageTitle>
        <p className="mb-8 text-lg text-gray-500">{t('gcweb:server-error.page-message')}</p>
        <ul className="list-disc space-y-2 pl-10">
          <li>{t('gcweb:server-error.option-01')}</li>
          <li>
            <Trans ns={i18nNamespaces} i18nKey="gcweb:server-error.option-02" components={{ home }} />
          </li>
        </ul>
        <PageDetails />
      </main>
      <PageFooter />
    </>
  );
}
