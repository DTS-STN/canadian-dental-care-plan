import type { ComponentProps, ReactNode } from 'react';

import { Link, Outlet, isRouteErrorResponse, useRouteError } from '@remix-run/react';

import { ChevronDown as ChevronDownIcon, ChevronRight as ChevronRightIcon, CircleUserRound as CircleUserRoundIcon, Home as HomeIcon, LogOut as LogOutIcon } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';

import { AnchorLink } from '~/components/anchor-link';
import { Button } from '~/components/buttons';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '~/components/dropdown-menu';
import { InlineLink } from '~/components/inline-link';
import { LanguageSwitcher } from '~/components/language-switcher';
import { PageTitle } from '~/components/page-title';
import { getClientEnv } from '~/utils/env-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { useBreadcrumbs, useBuildInfo, useI18nNamespaces, usePageIdentifier, usePageTitleI18nKey } from '~/utils/route-utils';
import type { RouteHandleData } from '~/utils/route-utils';

const i18nNamespaces = getTypedI18nNamespaces('gcweb');

export const handle = { i18nNamespaces } as const satisfies RouteHandleData;

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    switch (error.status) {
      // TODO :: GjB :: handle other status codes
      default:
        return <ServerError error={error} />;
    }
  }

  return <ServerError error={error} />;
}

export default function GCWebApp() {
  return (
    <ApplicationLayout>
      <Outlet />
    </ApplicationLayout>
  );
}

/**
 * GCWeb Application page template.
 * see: https://wet-boew.github.io/GCWeb/templates/application/application-docs-en.html
 */
function ApplicationLayout({ children }: { children?: ReactNode }) {
  return (
    <>
      <PageHeader />
      <main className="container" property="mainContentOfPage" resource="#wb-main" typeof="WebPageElement">
        <AppPageTitle />
        {children}
        <PageDetails />
      </main>
      <PageFooter />
    </>
  );
}

function NavigationMenu() {
  const { t } = useTranslation(i18nNamespaces);
  const { SCCH_BASE_URI } = getClientEnv();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="gap-2" id="dropdownNavbarLink" pill aria-haspopup="true" data-testid="menuButton">
          <CircleUserRoundIcon className="h-4 w-4 flex-shrink-0" />
          <span>{t('header.menu-title')}</span>
          <ChevronDownIcon className="h-4 w-4 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60" align="end">
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
            {t('gcweb:header.menu-sign-out.text')} <LogOutIcon className="h-4 w-4 flex-shrink-0" />
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PageHeader() {
  const { i18n, t } = useTranslation(i18nNamespaces);
  // const { SCCH_BASE_URI } = getClientEnv();

  return (
    <>
      <div id="skip-to-content">
        {[
          { anchorElementId: 'wb-cont', children: t('gcweb:nav.skip-to-content') },
          { anchorElementId: 'wb-info', children: t('gcweb:nav.skip-to-about') },
        ].map(({ anchorElementId, children }) => (
          <AnchorLink
            key={anchorElementId}
            anchorElementId={anchorElementId}
            className="absolute z-10 mx-2 -translate-y-full rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-blue-800 focus:mt-2 focus:translate-y-0 focus:outline-none focus:ring-4 focus:ring-blue-300"
          >
            {children}
          </AnchorLink>
        ))}
      </div>
      <header className="border-b border-slate-300 shadow">
        <div id="wb-bnr" className="border border-b border-gray-200 bg-gray-50">
          <div className="container flex items-center justify-between gap-6 py-2">
            <div property="publisher" typeof="GovernmentOrganization">
              <Link to={t('gcweb:header.govt-of-canada.href')} property="url">
                <img className="h-6 w-auto" src={`/assets/sig-blk-${i18n.language}.svg`} alt={t('gcweb:header.govt-of-canada.text')} property="logo" width="300" height="28" decoding="async" />
              </Link>
              <meta property="name" content={t('gcweb:header.govt-of-canada.text')} />
              <meta property="areaServed" typeof="Country" content="Canada" />
              <link property="logo" href="/assets/wmms-blk.svg" />
            </div>
            <section id="wb-lng">
              <h2 className="sr-only">{t('gcweb:header.language-selection')}</h2>
              <LanguageSwitcher className="font-semibold underline">
                <span className="hidden md:block">{t('gcweb:language-switcher.alt-lang')}</span>
                <abbr title={t('gcweb:language-switcher.alt-lang')} className="cursor-help uppercase md:hidden">
                  {t('gcweb:language-switcher.alt-lang-abbr')}
                </abbr>
              </LanguageSwitcher>
            </section>
          </div>
        </div>
        <section className="bg-gray-700 py-2 text-white">
          <div className="container">
            <div className="gep-6 flex items-center justify-between ">
              <Link to="/" className="text-2xl font-semibold hover:underline">
                <h2>{t('gcweb:header.application-title')}</h2>
              </Link>
              <NavigationMenu />
            </div>
          </div>
        </section>
      </header>
      <Breadcrumbs />
    </>
  );
}

function AppPageTitle(props: Omit<ComponentProps<typeof PageTitle>, 'children'>) {
  const { t } = useTranslation(useI18nNamespaces());
  const pageTitleI18nKey = usePageTitleI18nKey();

  return pageTitleI18nKey && <PageTitle {...props}>{t(pageTitleI18nKey)}</PageTitle>;
}

function PageDetails() {
  const buildInfo = useBuildInfo() ?? {
    buildDate: '2000-01-01T00:00:00Z',
    buildVersion: '0.0.0-00000000-0000',
  };

  const pageIdentifier = usePageIdentifier();

  const { t } = useTranslation(i18nNamespaces);

  return (
    <section className="mb-8 mt-16">
      <h2 className="sr-only">{t('gcweb:page-details.page-details')}</h2>
      <dl id="wb-dtmd" className="space-y-1 text-sm text-gray-500">
        {!!pageIdentifier && (
          <div className="flex gap-2">
            <dt>{t('gcweb:page-details.screen-id')}</dt>
            <dd>
              <span property="identifier">{pageIdentifier}</span>
            </dd>
          </div>
        )}
        {!!buildInfo.buildDate && (
          <div className="flex gap-2">
            <dt>{t('gcweb:page-details.date-modfied')}</dt>
            <dd>
              <time property="dateModified">{buildInfo.buildDate.slice(0, 10)}</time>
            </dd>
          </div>
        )}
        {!!buildInfo.buildVersion && (
          <div className="flex gap-2">
            <dt>{t('gcweb:page-details.version')}</dt>
            <dd>
              <span property="version">{buildInfo.buildVersion}</span>
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}

function PageFooter() {
  const { t } = useTranslation(i18nNamespaces);

  return (
    <footer id="wb-info" className="border-t bg-stone-50 py-8">
      <div className="container">
        <h2 className="sr-only">{t('gcweb:footer.about-site')}</h2>
        <div className=" flex items-center justify-between gap-4">
          <nav aria-labelledby="gc-corporate">
            <h3 id="gc-corporate" className="sr-only">
              {t('gcweb:footer.gc-corporate')}
            </h3>
            <div className="flex flex-col items-start gap-2 text-sm leading-6 sm:flex-row sm:items-center sm:gap-4">
              <Link to={t('gcweb:footer.terms-conditions.href')}>{t('gcweb:footer.terms-conditions.text')}</Link>
              <div className="hidden h-4 w-px bg-slate-500/20 sm:block"></div>
              <Link to={t('gcweb:footer.privacy.href')}>{t('gcweb:footer.privacy.text')}</Link>
            </div>
          </nav>
          <div>
            <img src="/assets/wmms-blk.svg" alt={t('gcweb:footer.gc-symbol')} width={300} height={71} className="h-8 w-auto" />
          </div>
        </div>
      </div>
    </footer>
  );
}

function Breadcrumb({ children, to }: { children: ReactNode; to?: string }) {
  // prettier-ignore
  return to === undefined
    ? <span property="name">{children}</span>
    : <InlineLink to={to} property="item" typeof="WebPage"><span property="name">{children}</span></InlineLink>;
}

function Breadcrumbs() {
  const { t } = useTranslation([...i18nNamespaces, ...useI18nNamespaces()]);
  const breadcrumbs = useBreadcrumbs();

  return (
    <nav id="wb-bc" property="breadcrumb" aria-labelledby="breadcrumbs">
      <h2 id="breadcrumbs" className="sr-only">
        {t('gcweb:breadcrumbs.you-are-here')}
      </h2>
      <div className="container mt-4">
        <ol className="flex flex-wrap items-center gap-x-3 gap-y-1" typeof="BreadcrumbList">
          <li property="itemListElement" typeof="ListItem" className="flex items-center gap-2">
            <HomeIcon className="h-4 w-4 flex-shrink-0" />
            <Breadcrumb to={breadcrumbs.length !== 0 ? '/' : undefined}>{t('gcweb:breadcrumbs.home')}</Breadcrumb>
          </li>
          {breadcrumbs.map(({ labelI18nKey, to }) => {
            return (
              <li key={labelI18nKey} property="itemListElement" typeof="ListItem" className="flex items-center">
                <ChevronRightIcon className="mr-2 mt-0.5 h-4 w-4 text-gray-400" />
                <Breadcrumb to={to}>{t(labelI18nKey)}</Breadcrumb>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

interface ServerErrorProps {
  error: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ServerError({ error }: ServerErrorProps) {
  const { t } = useTranslation(i18nNamespaces);

  // (content will be added by <Trans>)
  // eslint-disable-next-line jsx-a11y/anchor-has-content
  const home = <InlineLink to="/" />;

  return (
    <ApplicationLayout>
      <PageTitle>
        {t('gcweb:server-error.page-title')}
        &#32;<small className="block text-2xl font-normal text-neutral-500">{t('gcweb:server-error.page-subtitle')}</small>
      </PageTitle>
      <p className="mb-8 text-lg text-gray-500">{t('gcweb:server-error.page-message')}</p>
      <ul className="list-disc space-y-2 pl-10">
        <li>{t('gcweb:server-error.option-01')}</li>
        <li>
          <Trans ns={i18nNamespaces} i18nKey="gcweb:server-error.option-02" components={{ home }} />
        </li>
      </ul>
    </ApplicationLayout>
  );
}
