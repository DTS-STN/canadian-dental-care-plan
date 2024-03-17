import type { PropsWithChildren } from 'react';

import { Link } from '@remix-run/react';

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
  const { t } = useTranslation(i18nNamespaces);
  return (
    <>
      <PageHeader />
      <PageBreadcrumbs />
      <main className="container" property="mainContentOfPage" resource="#wb-main" typeof="WebPageElement">
        <div className="my-8 border-b border-red-800">
          <h2 className="font-lato text-lg text-stone-500 sm:text-xl">{t('gcweb:header.application-title')}</h2>
          <AppPageTitle />
        </div>
        <div>{children}</div>
        <PageDetails />
      </main>
      <PageFooter />
    </>
  );
}

function AppPageTitle() {
  const { t } = useTranslation(useI18nNamespaces());
  const pageTitleI18nKey = usePageTitleI18nKey();
  return pageTitleI18nKey && <PageTitle>{t(pageTitleI18nKey)}</PageTitle>;
}

function PageHeader() {
  return (
    <header className="border-b-[3px] border-slate-700 print:hidden">
      <SkipNavigationLinks />
      <PageHeaderBrand />
    </header>
  );
}

function PageBreadcrumbs() {
  const { t } = useTranslation([...i18nNamespaces, ...useI18nNamespaces()]);
  return (
    <Breadcrumbs
      className="my-4 print:hidden"
      items={[
        { content: t('gcweb:breadcrumbs.canada-ca'), to: t('gcweb:breadcrumbs.canada-ca-url') },
        { content: t('gcweb:breadcrumbs.benefits'), to: t('gcweb:breadcrumbs.benefits-url') },
        { content: t('gcweb:breadcrumbs.dental-coverage'), to: t('gcweb:breadcrumbs.dental-coverage-url') },
        { content: t('gcweb:breadcrumbs.canadian-dental-care-plan'), to: t('gcweb:breadcrumbs.canadian-dental-care-plan-url') },
      ]}
    />
  );
}

export interface BilingualNotFoundErrorProps {
  error?: unknown;
}

/**
 * A 404 page that renders both languages, for when the user's language cannot be detected
 */
export function BilingualNotFoundError({ error }: BilingualNotFoundErrorProps) {
  const { i18n } = useTranslation(['gcweb']);
  const en = i18n.getFixedT('en');
  const fr = i18n.getFixedT('fr');

  const homeLink = <Link to="/" className="text-slate-700 underline hover:text-blue-700 focus:text-blue-700" />;

  return (
    <>
      <header className="border-b-[3px] border-slate-700 print:hidden">
        <div id="wb-bnr">
          <div className="container flex items-center justify-between gap-6 py-2.5 sm:py-3.5">
            <div property="publisher" typeof="GovernmentOrganization">
              <Link to="https://canada.ca/" property="url">
                <img className="h-8 w-auto" src="/assets/sig-blk-en.svg" alt={`${en('gcweb:header.govt-of-canada.text')} / ${fr('gcweb:header.govt-of-canada.text')}`} property="logo" width="300" height="28" decoding="async" />
              </Link>
              <meta property="name" content={`${en('gcweb:header.govt-of-canada.text')} / ${fr('gcweb:header.govt-of-canada.text')}`} />
              <meta property="areaServed" typeof="Country" content="Canada" />
              <link property="logo" href="/assets/wmms-blk.svg" />
            </div>
          </div>
        </div>
      </header>
      <main className="container" property="mainContentOfPage" resource="#wb-main" typeof="WebPageElement">
        <div className="grid grid-cols-1 gap-6 py-2.5 sm:grid-cols-2 sm:py-3.5">
          <div id="english" lang="en">
            <PageTitle className="my-8">
              <span>{en('gcweb:not-found.page-title')}</span>
              <small className="block text-2xl font-normal text-neutral-500">{en('gcweb:not-found.page-subtitle')}</small>
            </PageTitle>
            <p className="mb-8 text-lg text-gray-500">{en('gcweb:not-found.page-message')}</p>
            <ul className="list-disc space-y-2 pl-10">
              <li>
                <Trans t={en} ns={['gcweb']} i18nKey="gcweb:not-found.page-link" components={{ home: homeLink }} />
              </li>
            </ul>
          </div>
          <div id="french" lang="fr">
            <PageTitle className="my-8">
              <span>{fr('gcweb:not-found.page-title')}</span>
              <small className="block text-2xl font-normal text-neutral-500">{fr('gcweb:not-found.page-subtitle')}</small>
            </PageTitle>
            <p className="mb-8 text-lg text-gray-500">{fr('gcweb:not-found.page-message')}</p>
            <ul className="list-disc space-y-2 pl-10">
              <li>
                <Trans t={fr} ns={['gcweb']} i18nKey="gcweb:not-found.page-link" components={{ home: homeLink }} />
              </li>
            </ul>
          </div>
        </div>
      </main>
      <footer id="wb-info" className="bg-stone-50 print:hidden">
        <div className="container flex items-center justify-end gap-6 py-2.5 sm:py-3.5">
          <div>
            <h2 className="sr-only">
              <span lang="en">{en('gcweb:footer.about-site')}</span> / <span lang="fr">{fr('gcweb:footer.about-site')}</span>
            </h2>
            <div>
              <img src="/assets/wmms-blk.svg" alt={`${en('gcweb:footer.gc-symbol')} / ${fr('gcweb:footer.gc-symbol')}`} width={300} height={71} className="h-10 w-auto" />
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

export interface NotFoundErrorProps {
  error?: unknown;
}

export function NotFoundError({ error }: NotFoundErrorProps) {
  const { t } = useTranslation(i18nNamespaces);
  const home = <InlineLink to="/apply" />;

  return (
    <>
      <PageHeader />
      <main className="container" property="mainContentOfPage" resource="#wb-main" typeof="WebPageElement">
        <PageTitle className="my-8">
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
