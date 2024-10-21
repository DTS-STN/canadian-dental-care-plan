import { useEffect } from 'react';
import type { PropsWithChildren } from 'react';

import { Link } from '@remix-run/react';

import { Trans, useTranslation } from 'react-i18next';

import { Banner } from '../banner';
import { Breadcrumbs } from '~/components/breadcrumbs';
import { InlineLink } from '~/components/inline-link';
import { PageDetails } from '~/components/page-details';
import { PageHeaderBrand } from '~/components/page-header-brand';
import { PageTitle } from '~/components/page-title';
import { SkipNavigationLinks } from '~/components/skip-navigation-links';
import { useFeature } from '~/root';
import * as adobeAnalytics from '~/utils/adobe-analytics.client';
import { getAltLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { useI18nNamespaces, usePageTitleI18nKey, usePageTitleI18nOptions } from '~/utils/route-utils';

export const i18nNamespaces = getTypedI18nNamespaces('gcweb');

/**
 * GCWeb Application page template.
 * see: https://wet-boew.github.io/GCWeb/templates/application/application-docs-en.html
 */
export function PublicLayout({ children }: PropsWithChildren) {
  const { t } = useTranslation(useI18nNamespaces());
  const pageTitleI18nKey = usePageTitleI18nKey();
  const i18nOptions = usePageTitleI18nOptions();

  return (
    <>
      <PageHeader />
      <PageBreadcrumbs />
      <main className="container" property="mainContentOfPage" resource="#wb-main" typeof="WebPageElement">
        {pageTitleI18nKey && <AppPageTitle>{t(pageTitleI18nKey, i18nOptions)}</AppPageTitle>}
        {children}
        <PageDetails />
      </main>
      <PageFooter />
    </>
  );
}

export function AppPageTitle({ children }: PropsWithChildren) {
  const { t } = useTranslation(i18nNamespaces);
  return (
    <div className="my-8 border-b border-red-800">
      <div className="max-w-prose">
        <h2 className="font-lato text-lg text-stone-500 sm:text-xl">{t('gcweb:header.application-title')}</h2>
        <PageTitle>{children}</PageTitle>
      </div>
    </div>
  );
}

function PageHeader() {
  const { t } = useTranslation(i18nNamespaces);

  return (
    <header className="border-b-[3px] border-slate-700 print:hidden">
      <SkipNavigationLinks />
      {useFeature('show-prototype-banner') && <Banner alert={t('gcweb:header.banner.alert')} description={t('gcweb:header.banner.desc')} />}
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

function PageFooter() {
  const { t } = useTranslation(['gcweb']);
  return (
    <footer id="wb-info" tabIndex={-1} className="bg-stone-50 print:hidden">
      <div className="bg-gray-700 text-white">
        <section className="container py-6">
          <h2 className="mb-4">{t('gcweb:footer.main-band.header')}</h2>
          <div className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
            <Link className="hover:underline" to={t('gcweb:footer.main-band.links.contact-us.public-href')} data-gc-analytics-navigation={`Footer:Footer:${t('gcweb:footer.main-band.links.contact-us.content')}`}>
              {t('gcweb:footer.main-band.links.contact-us.content')}
            </Link>
          </div>
        </section>
      </div>
      <div className="container py-7">
        <h2 className="sr-only">{t('gcweb:footer.about-site')}</h2>
        <div className="flex items-center justify-between gap-4">
          <nav aria-labelledby="gc-corporate">
            <h3 id="gc-corporate" className="sr-only">
              {t('gcweb:footer.gc-corporate')}
            </h3>
            <div className="flex flex-col items-start gap-2 text-sm leading-6 sm:flex-row sm:items-center sm:gap-4">
              <Link className="text-slate-700 hover:underline" to={t('gcweb:footer.terms-conditions.public-href')} data-gc-analytics-navigation={`Footer:Footer:${t('gcweb:footer.terms-conditions.text')}`}>
                {t('gcweb:footer.terms-conditions.text')}
              </Link>
              <div className="hidden size-0 rounded-full border-[3px] border-slate-700 sm:block"></div>
              <Link className="text-slate-700 hover:underline" to={t('gcweb:footer.privacy.public-href')} data-gc-analytics-navigation={`Footer:Footer:${t('gcweb:footer.privacy.text')}`}>
                {t('gcweb:footer.privacy.text')}
              </Link>
            </div>
          </nav>
          <div>
            <img src="/assets/wmms-blk.svg" alt={t('gcweb:footer.gc-symbol')} width={300} height={71} className="h-10 w-auto" />
          </div>
        </div>
      </div>
    </footer>
  );
}

export interface BilingualNotFoundErrorProps {
  error?: unknown;
}

/**
 * A 404 page that renders both languages, for when the user's language cannot be detected
 */
export function BilingualNotFoundError({ error }: BilingualNotFoundErrorProps) {
  const { i18n, t } = useTranslation(['gcweb']);
  const en = i18n.getFixedT('en');
  const fr = i18n.getFixedT('fr');

  const altLanguage = getAltLanguage(i18n.language);
  const altLogoContent = <span lang={altLanguage}>{i18n.getFixedT(altLanguage)('gcweb:header.govt-of-canada.text')}</span>;

  const englishCdcpLink = <InlineLink to={en('gcweb:public-not-found.cdcp-link')} className="external-link" newTabIndicator target="_blank" />;
  const frenchCdcpLink = <InlineLink to={fr('gcweb:public-not-found.cdcp-link')} className="external-link" newTabIndicator target="_blank" />;

  useEffect(() => {
    if (adobeAnalytics.isConfigured()) {
      adobeAnalytics.pushErrorEvent(404);
    }
  }, []);

  return (
    <>
      <header className="border-b-[3px] border-slate-700 print:hidden">
        <div id="wb-bnr">
          <div className="container flex items-center justify-between gap-6 py-2.5 sm:py-3.5">
            <div property="publisher" typeof="GovernmentOrganization">
              <Link to="https://canada.ca/" property="url">
                <img className="h-8 w-auto" src="/assets/sig-blk-en.svg" alt={t('gcweb:header.govt-of-canada.text')} property="logo" width="300" height="28" decoding="async" />
                <span className="sr-only">/ {altLogoContent}</span>
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
              <span>{en('gcweb:public-not-found.page-title')}</span>
              <small className="block text-2xl font-normal text-neutral-500">{en('gcweb:public-not-found.page-subtitle')}</small>
            </PageTitle>
            <p className="mb-8 text-lg text-gray-500">{en('gcweb:public-not-found.page-message')}</p>
            <ul className="list-disc space-y-2 pl-10">
              <li>
                <Trans t={en} ns={['gcweb']} i18nKey="gcweb:public-not-found.return-cdcp" components={{ englishCdcpLink }} />
              </li>
            </ul>
          </div>
          <div id="french" lang="fr">
            <PageTitle className="my-8">
              <span>{fr('gcweb:public-not-found.page-title')}</span>
              <small className="block text-2xl font-normal text-neutral-500">{fr('gcweb:public-not-found.page-subtitle')}</small>
            </PageTitle>
            <p className="mb-8 text-lg text-gray-500">{fr('gcweb:public-not-found.page-message')}</p>
            <ul className="list-disc space-y-2 pl-10">
              <li>
                <Trans t={fr} ns={['gcweb']} i18nKey="gcweb:public-not-found.return-cdcp" components={{ frenchCdcpLink }} />
              </li>
            </ul>
          </div>
        </div>
      </main>
      <footer id="wb-info" tabIndex={-1} className="bg-stone-50 print:hidden">
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
  const cdcpLink = <InlineLink to={t('gcweb:public-not-found.cdcp-link')} className="external-link" newTabIndicator target="_blank" />;

  useEffect(() => {
    if (adobeAnalytics.isConfigured()) {
      adobeAnalytics.pushErrorEvent(404);
    }
  }, []);

  return (
    <>
      <PageHeader />
      <main className="container" property="mainContentOfPage" resource="#wb-main" typeof="WebPageElement">
        <PageTitle className="my-8">
          <span>{t('gcweb:public-not-found.page-title')}</span>
          <small className="block text-2xl font-normal text-neutral-500">{t('gcweb:public-not-found.page-subtitle')}</small>
        </PageTitle>
        <p className="mb-8 text-lg text-gray-500">{t('gcweb:public-not-found.page-message')}</p>
        <ul className="list-disc space-y-2 pl-10">
          <li>
            <Trans ns={i18nNamespaces} i18nKey="gcweb:public-not-found.unilingual-return-cdcp" components={{ cdcpLink }} />
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

  useEffect(() => {
    document.title = t('gcweb:meta.title.template', { title: t('gcweb:server-error.document-title') });
  }, [t]);

  useEffect(() => {
    if (adobeAnalytics.isConfigured()) {
      adobeAnalytics.pushErrorEvent(500);
    }
  }, []);

  return (
    <>
      <PageHeader />
      <main className="container" property="mainContentOfPage" resource="#wb-main" typeof="WebPageElement">
        <PageTitle className="my-8">
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
