import { useEffect } from 'react';
import type { PropsWithChildren } from 'react';

import { Link } from '@remix-run/react';

import { faArrowRightFromBracket, faChevronDown, faCircleUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Trans, useTranslation } from 'react-i18next';

import { AppLink } from '../app-link';
import { Breadcrumbs } from '~/components/breadcrumbs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '~/components/dropdown-menu';
import { InlineLink } from '~/components/inline-link';
import { PageDetails } from '~/components/page-details';
import { PageFooter } from '~/components/page-footer';
import { PageHeaderBrand } from '~/components/page-header-brand';
import { PageTitle } from '~/components/page-title';
import { SkipNavigationLinks } from '~/components/skip-navigation-links';
import * as adobeAnalytics from '~/utils/adobe-analytics.client';
import { getClientEnv } from '~/utils/env-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { useBreadcrumbs, useI18nNamespaces, usePageTitleI18nKey } from '~/utils/route-utils';
import { useUserOrigin } from '~/utils/user-origin-utils';

export const i18nNamespaces = getTypedI18nNamespaces('gcweb');

/**
 * GCWeb Application page template.
 * see: https://wet-boew.github.io/GCWeb/templates/application/application-docs-en.html
 */
export function ProtectedLayout({ children }: PropsWithChildren) {
  return (
    <>
      <PageHeader />
      <PageBreadcrumbs />
      <main className="container" property="mainContentOfPage" resource="#wb-main" typeof="WebPageElement">
        <div className="my-8 border-b border-red-800">
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
  return pageTitleI18nKey && <PageTitle className="mb-2 mt-6">{t(pageTitleI18nKey)}</PageTitle>;
}

function NavigationMenu() {
  const { t } = useTranslation(i18nNamespaces);
  const { SCCH_BASE_URI } = getClientEnv();
  const userOrigin = useUserOrigin();

  return (
    <div className="sm:w-[260px]">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button className="inline-flex w-full items-center justify-between bg-slate-200 px-4 py-3 align-middle font-bold text-slate-700 outline-offset-2 hover:bg-neutral-300 focus:bg-neutral-300" id="dropdownNavbarLink" data-testid="menuButton">
            <span className="inline-flex w-full appearance-none items-center gap-4">
              <FontAwesomeIcon icon={faCircleUser} className="size-9 flex-shrink-0" />
              <span>{t('header.menu-title')}</span>
            </span>
            <FontAwesomeIcon icon={faChevronDown} className="size-3 flex-shrink-0" />
          </button>
        </DropdownMenuTrigger>
        {/* Use of a workaround (onFocusOutside={(e) => e.preventDefault()}) for the drowndownmenucontent with the resize issue raised by accessibility : https://github.com/radix-ui/primitives/issues/2754 */}
        <DropdownMenuContent onFocusOutside={(e) => e.preventDefault()} side="bottom" avoidCollisions={false} className="w-svw rounded-t-none sm:w-[260px]" sideOffset={0} align="center">
          {userOrigin && (
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link to={userOrigin.to}>{userOrigin.text}</Link>
            </DropdownMenuItem>
          )}
          {(!userOrigin || userOrigin.isFromMSCAD) && (
            <>
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
            </>
          )}
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link to="/auth/logout" className="flex items-center justify-between gap-2">
              {t('gcweb:header.menu-sign-out.text')} <FontAwesomeIcon icon={faArrowRightFromBracket} className="size-4 flex-shrink-0" />
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function PageHeader() {
  const { t } = useTranslation(i18nNamespaces);
  const userOrigin = useUserOrigin();

  return (
    <header>
      <SkipNavigationLinks />
      <PageHeaderBrand />
      <section className="bg-gray-700 text-white">
        <div className="sm:container">
          <div className="flex flex-col items-stretch justify-between sm:flex-row sm:items-center">
            <h2 className="p-4 font-lato text-xl font-semibold sm:p-0 sm:py-3 sm:text-2xl">
              <AppLink to={userOrigin ? userOrigin.to : '/home'} className="hover:underline">
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
  const userOrigin = useUserOrigin();

  return (
    <Breadcrumbs
      className="my-4"
      items={[
        { content: t('gcweb:breadcrumbs.home'), to: userOrigin?.to },
        ...breadcrumbs.map((item) => ({
          content: t(item.labelI18nKey),
          routeId: item.routeId,
          to: item.to,
        })),
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

  useEffect(() => {
    if (adobeAnalytics.isConfigured()) {
      adobeAnalytics.error(404);
    }
  }, []);

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

  useEffect(() => {
    if (adobeAnalytics.isConfigured()) {
      adobeAnalytics.error(500);
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
