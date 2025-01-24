import { useEffect } from 'react';
import type { PropsWithChildren } from 'react';

import { Link } from 'react-router';

import { faArrowRightFromBracket, faChevronDown, faCircleUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Trans, useTranslation } from 'react-i18next';

import { AppLink } from '../app-link';
import { Banner } from '../banner';

import { Breadcrumbs } from '~/components/breadcrumbs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '~/components/dropdown-menu';
import { InlineLink } from '~/components/inline-link';
import { PageDetails } from '~/components/page-details';
import { PageHeaderBrand } from '~/components/page-header-brand';
import { PageTitle } from '~/components/page-title';
import { SkipNavigationLinks } from '~/components/skip-navigation-links';
import { useFeature } from '~/root';
import * as adobeAnalytics from '~/utils/adobe-analytics.client';
import { getClientEnv } from '~/utils/env-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { useBreadcrumbs, useI18nNamespaces, usePageTitleI18nKey, usePageTitleI18nOptions } from '~/utils/route-utils';

export const i18nNamespaces = getTypedI18nNamespaces('gcweb');

/**
 * GCWeb Application page template.
 * see: https://wet-boew.github.io/GCWeb/templates/application/application-docs-en.html
 */
export function ProtectedLayout({ children }: PropsWithChildren) {
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
  return (
    <div className="my-8 border-b border-red-800">
      <PageTitle>{children}</PageTitle>
    </div>
  );
}

function NavigationMenu() {
  const { t } = useTranslation(i18nNamespaces);
  const { SCCH_BASE_URI } = getClientEnv();

  return (
    <div className="sm:w-[260px]">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button className="inline-flex w-full items-center justify-between bg-slate-200 px-4 py-3 align-middle font-bold text-slate-700 outline-offset-2 hover:bg-neutral-300 focus:bg-neutral-300" id="dropdownNavbarLink" data-testid="menuButton">
            <span className="inline-flex w-full appearance-none items-center gap-4">
              <FontAwesomeIcon icon={faCircleUser} className="size-9 shrink-0" />
              <span>{t('header.menu-title')}</span>
            </span>
            <FontAwesomeIcon icon={faChevronDown} className="size-3 shrink-0" />
          </button>
        </DropdownMenuTrigger>
        {/* Use of a workaround (onFocusOutside={(e) => e.preventDefault()}) for the drowndownmenucontent with the resize issue raised by accessibility : https://github.com/radix-ui/primitives/issues/2754 */}
        <DropdownMenuContent onFocusOutside={(e) => e.preventDefault()} side="bottom" avoidCollisions={false} className="w-svw rounded-t-none sm:w-[260px]" sideOffset={0} align="center">
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link to={t('gcweb:header.menu-dashboard.href', { baseUri: SCCH_BASE_URI })}>{t('gcweb:header.menu-dashboard.text')}</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link to={t('gcweb:header.menu-profile.href', { baseUri: SCCH_BASE_URI })}>{t('gcweb:header.menu-profile.text')}</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link to={t('gcweb:header.menu-security-settings.href', { baseUri: SCCH_BASE_URI })}>{t('gcweb:header.menu-security-settings.text')}</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link to={t('gcweb:header.menu-contact-us.href', { baseUri: SCCH_BASE_URI })}>{t('gcweb:header.menu-contact-us.text')}</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link to="/auth/logout" className="flex items-center justify-between gap-2">
              {t('gcweb:header.menu-sign-out.text')} <FontAwesomeIcon icon={faArrowRightFromBracket} className="size-4 shrink-0" />
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function PageHeader() {
  const { t } = useTranslation(i18nNamespaces);
  const { SCCH_BASE_URI } = getClientEnv();

  return (
    <header>
      <SkipNavigationLinks />
      {useFeature('show-prototype-banner') && <Banner alert={t('gcweb:header.banner.alert')} description={t('gcweb:header.banner.desc')} />}
      <PageHeaderBrand />
      <section className="bg-gray-700 text-white">
        <div className="sm:container">
          <div className="flex flex-col items-stretch justify-between sm:flex-row sm:items-center">
            <h2 className="p-4 font-lato text-xl font-semibold sm:p-0 sm:py-3 sm:text-2xl">
              <AppLink to={t('gcweb:header.menu-dashboard.href', { baseUri: SCCH_BASE_URI })} className="hover:underline">
                {t('gcweb:header.application-title-msca')}
              </AppLink>
            </h2>
            <NavigationMenu />
          </div>
        </div>
      </section>
    </header>
  );
}

function PageBreadcrumbs() {
  const { t } = useTranslation([...i18nNamespaces, ...useI18nNamespaces()]);
  const breadcrumbs = useBreadcrumbs();
  const { SCCH_BASE_URI } = getClientEnv();

  return (
    <Breadcrumbs
      className="my-4"
      items={[
        { content: t('gcweb:breadcrumbs.home'), to: t('gcweb:header.menu-dashboard.href', { baseUri: SCCH_BASE_URI }) },
        ...breadcrumbs.map((item) => ({
          content: t(item.labelI18nKey),
          routeId: item.routeId,
          to: item.to,
        })),
      ]}
    />
  );
}

function PageFooter() {
  const { ECAS_BASE_URI, SCCH_BASE_URI } = getClientEnv();
  const { t } = useTranslation(['gcweb']);

  return (
    <footer id="wb-info" tabIndex={-1} className="bg-stone-50 print:hidden">
      <div className="bg-gray-700 text-white">
        <section className="container py-6">
          <h2 className="mb-4">{t('gcweb:footer.main-band.header')}</h2>
          <div className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
            <Link className="hover:underline" to={t('gcweb:footer.main-band.links.contact-us.protected-href', { baseUri: SCCH_BASE_URI })} data-gc-analytics-navigation={`Footer:Footer:${t('gcweb:footer.main-band.links.contact-us.content')}`}>
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
              <Link className="text-slate-700 hover:underline" to={t('gcweb:footer.terms-conditions.protected-href', { baseUri: ECAS_BASE_URI })} data-gc-analytics-navigation={`Footer:Footer:${t('gcweb:footer.terms-conditions.text')}`}>
                {t('gcweb:footer.terms-conditions.text')}
              </Link>
              <div className="hidden size-0 rounded-full border-[3px] border-slate-700 sm:block"></div>
              <Link className="text-slate-700 hover:underline" to={t('gcweb:footer.privacy.protected-href', { baseUri: ECAS_BASE_URI })} data-gc-analytics-navigation={`Footer:Footer:${t('gcweb:footer.privacy.text')}`}>
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

export interface NotFoundErrorProps {
  error?: unknown;
}

export function NotFoundError({ error }: NotFoundErrorProps) {
  const { t } = useTranslation(i18nNamespaces);
  const { SCCH_BASE_URI } = getClientEnv();
  const dashboard = <InlineLink to={t('gcweb:header.menu-dashboard.href', { baseUri: SCCH_BASE_URI })} />;

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
          <span>{t('gcweb:protected-not-found.page-title')}</span>
          <small className="block text-2xl font-normal text-neutral-500">{t('gcweb:protected-not-found.page-subtitle')}</small>
        </PageTitle>
        <p className="mb-8 text-lg text-gray-500">{t('gcweb:protected-not-found.page-message')}</p>
        <ul className="list-disc space-y-2 pl-10">
          <li>
            <Trans ns={i18nNamespaces} i18nKey="gcweb:protected-not-found.page-link" components={{ dashboard }} />
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
