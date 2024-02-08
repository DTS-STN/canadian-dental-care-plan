import type { ComponentProps, MouseEventHandler, ReactElement, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import { Link, Outlet, isRouteErrorResponse, useRouteError } from '@remix-run/react';

import { Trans, useTranslation } from 'react-i18next';

import { AnchorLink } from '~/components/anchor-link';
import { InlineLink } from '~/components/inline-link';
import { LanguageSwitcher } from '~/components/language-switcher';
import { PageTitle } from '~/components/page-title';
import { SignOutIcon } from '~/components/sign-out-icon';
import { getClientEnv } from '~/utils/env';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { useBreadcrumbs, useBuildInfo, useI18nNamespaces, usePageIdentifier, usePageTitleI18nKey } from '~/utils/route-utils';

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

function PageHeader() {
  const { i18n, t } = useTranslation(i18nNamespaces);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const dropdown = useRef<HTMLDivElement>(null);
  const { SCCH_BASE_URI } = getClientEnv();

  const onClickMenuHandler = () => setShowDropdown((currentState) => !currentState);

  useEffect(() => {
    if (!showDropdown) return;

    function handleEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowDropdown(false);
      }
    }

    function handleClick(event: MouseEvent) {
      if (dropdown.current) {
        const targetInsideDropdown = dropdown.current?.contains(event.target as Node) ?? false;
        setShowDropdown(targetInsideDropdown);
      }
    }

    window.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [showDropdown]);
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
      <header>
        <div id="wb-bnr" className="container flex justify-between gap-6 py-2.5">
          <div className="md:mt-7" property="publisher" typeof="GovernmentOrganization">
            <Link to={t('gcweb:header.govt-of-canada.href')} property="url">
              <img className="h-7 w-auto md:h-8" src={`/theme/gcweb/assets/sig-blk-${i18n.language}.svg`} alt={t('gcweb:header.govt-of-canada.text')} property="logo" width="300" height="28" decoding="async" />
            </Link>
            <meta property="name" content={t('gcweb:header.govt-of-canada.text')} />
            <meta property="areaServed" typeof="Country" content="Canada" />
            <link property="logo" href="/theme/gcweb/assets/wmms-blk.svg" />
          </div>
          <section id="wb-lng">
            <h2 className="sr-only">{t('gcweb:header.language-selection')}</h2>
            <LanguageSwitcher className="underline">
              <span className="hidden md:block">{t('gcweb:language-switcher.alt-lang')}</span>
              <abbr title={t('gcweb:language-switcher.alt-lang')} className="cursor-help font-bold uppercase md:hidden">
                {t('gcweb:language-switcher.alt-lang-abbr')}
              </abbr>
            </LanguageSwitcher>
          </section>
        </div>
        <section className="mt-4 bg-gray-700">
          <div className="container">
            <div className="justify-between sm:flex">
              <h2 className="my-2.5 text-2xl font-bold text-white hover:underline">
                <Link to="/">{t('gcweb:header.application-title')}</Link>
              </h2>
              <nav ref={dropdown}>
                <button
                  id="dropdownNavbarLink"
                  onClick={() => setShowDropdown((currentState) => !currentState)}
                  aria-haspopup="true"
                  data-testid="menuButton"
                  aria-expanded={showDropdown}
                  className="text-blue-primary ring-blue-hover flex h-full w-full items-center justify-between rounded-sm py-0.5 font-bold text-white ring-offset-2 focus:mb-1 focus:outline-none focus:ring-2 sm:pl-4"
                >
                  <span className="flex items-center">
                    <svg className="mr-4" width="35" height="35" viewBox="0 0 35 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M17.5 0.499756C7.84 0.499756 0 8.33976 0 17.9998C0 27.6598 7.84 35.4998 17.5 35.4998C27.16 35.4998 35 27.6598 35 17.9998C35 8.33976 27.16 0.499756 17.5 0.499756ZM17.5 7.49976C20.8775 7.49976 23.625 10.2473 23.625 13.6248C23.625 17.0023 20.8775 19.7498 17.5 19.7498C14.1225 19.7498 11.375 17.0023 11.375 13.6248C11.375 10.2473 14.1225 7.49976 17.5 7.49976ZM17.5 31.9998C13.9475 31.9998 9.7475 30.5648 6.755 26.9598C9.7125 24.6498 13.44 23.2498 17.5 23.2498C21.56 23.2498 25.2875 24.6498 28.245 26.9598C25.2525 30.5648 21.0525 31.9998 17.5 31.9998Z"
                        fill="#FFFFFF"
                      />
                    </svg>
                    {t('header.menu-title')}
                  </span>
                  <svg className="mx-4 h-4 w-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
                  </svg>
                </button>
                {showDropdown && (
                  <div id="dropdownNavbar" className="text-deep-blue-dark z-10 rounded-b-[5px] bg-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)] sm:absolute sm:w-[260px]" aria-labelledby="dropdownLargeButton">
                    <MenuOption onClick={onClickMenuHandler} href={t('gcweb:header.menu-dashboard.href', { baseUri: SCCH_BASE_URI })} text={t('gcweb:header.menu-dashboard.text')} />
                    <MenuOption onClick={onClickMenuHandler} href={t('gcweb:header.menu-profile.href', { baseUri: SCCH_BASE_URI })} text={t('gcweb:header.menu-profile.text')} />
                    <MenuOption onClick={onClickMenuHandler} href={t('gcweb:header.menu-security-settings.href', { baseUri: SCCH_BASE_URI })} text={t('gcweb:header.menu-security-settings.text')} />
                    <MenuOption onClick={onClickMenuHandler} href={t('gcweb:header.menu-contact-us.href', { baseUri: SCCH_BASE_URI })} text={t('gcweb:header.menu-contact-us.text')} />
                    <MenuOption onClick={onClickMenuHandler} icon={<SignOutIcon />} href={t('gcweb:header.menu-dashboard.href', { baseUri: SCCH_BASE_URI })} text={t('gcweb:header.menu-sign-out.text')} />
                  </div>
                )}
              </nav>
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
    buildVersion: '0.0.0+00000000-0000',
  };

  const pageIdentifier = usePageIdentifier();

  const { t } = useTranslation(i18nNamespaces);

  return (
    <section className="pagedetails">
      <h2 className="sr-only">{t('gcweb:page-details.page-details')}</h2>
      <div className="row">
        <div className="col-xs-12">
          <dl id="wb-dtmd">
            {!!pageIdentifier && (
              <>
                <dt className="float-left clear-left pr-[1ch]">{t('gcweb:page-details.screen-id')}</dt>
                <dd className="float-left clear-right mb-0">
                  <span property="identifier">{pageIdentifier}</span>
                </dd>
              </>
            )}
            {!!buildInfo?.buildDate && (
              <>
                <dt className="float-left clear-left pr-[1ch]">{t('gcweb:page-details.date-modfied')}</dt>
                <dd className="float-left clear-right mb-0">
                  <time property="dateModified">{buildInfo?.buildDate.slice(0, 10)}</time>
                </dd>
              </>
            )}
            {!!buildInfo?.buildVersion && (
              <>
                <dt className="float-left clear-left pr-[1ch]">{t('gcweb:page-details.version')}</dt>
                <dd className="float-left clear-right mb-0">
                  <span property="version">{buildInfo?.buildVersion}</span>
                </dd>
              </>
            )}
          </dl>
        </div>
      </div>
    </section>
  );
}

function PageFooter() {
  const { t } = useTranslation(i18nNamespaces);

  return (
    <footer id="wb-info">
      <h2 className="sr-only">{t('gcweb:footer.about-site')}</h2>
      <div className="gc-sub-footer">
        <div className="d-flex align-items-center container">
          <nav aria-labelledby="gc-corporate">
            <h3 id="gc-corporate" className="sr-only">
              {t('gcweb:footer.gc-corporate')}
            </h3>
            <ul>
              <li>
                <Link to={t('gcweb:footer.terms-conditions.href')}>{t('gcweb:footer.terms-conditions.text')}</Link>
              </li>
              <li>
                <Link to={t('gcweb:footer.privacy.href')}>{t('gcweb:footer.privacy.text')}</Link>
              </li>
            </ul>
          </nav>
          <div className="wtrmrk align-self-end">
            <img src="/theme/gcweb/assets/wmms-blk.svg" alt={t('gcweb:footer.gc-symbol')} />
          </div>
        </div>
      </div>
    </footer>
  );
}

function Breadcrumbs() {
  const { t } = useTranslation(i18nNamespaces);
  const { t: breadcrumbsTranslation } = useTranslation(useI18nNamespaces());
  const breadcrumbs = useBreadcrumbs();

  if (breadcrumbs === undefined || breadcrumbs.length === 0) {
    return <></>;
  }

  return (
    <nav id="wb-bc" property="breadcrumb" aria-labelledby="breadcrumbs">
      <h2 id="breadcrumbs" className="sr-only">
        {t('gcweb:breadcrumbs.you-are-here')}
      </h2>
      <div className="container mt-4">
        <ol className="flex flex-wrap items-center gap-1 md:gap-2" typeof="BreadcrumbList">
          {breadcrumbs.map(({ labelI18nKey, to }, index) => {
            const label = breadcrumbsTranslation(labelI18nKey);
            return (
              <li key={labelI18nKey} property="itemListElement" typeof="ListItem" className="flex items-center">
                {index === 0 ? (
                  <svg className="me-2.5 h-3 w-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                    <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z"></path>
                  </svg>
                ) : (
                  <svg className="mx-1 h-3 w-3 text-gray-400 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m1 9 4-4-4-4"></path>
                  </svg>
                )}
                {to ? (
                  <InlineLink to={to} property="item" typeof="WebPage">
                    <span property="name">{label}</span>
                  </InlineLink>
                ) : (
                  <span property="name">{label}</span>
                )}
                <meta property="position" content={`${index + 1}`} />
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

function MenuOption({ onClick, icon, href, text }: { onClick: MouseEventHandler<HTMLAnchorElement>; icon?: ReactElement; href: string; text: string }) {
  return (
    <Link className="hover:text-blue-hover ring-blue-hover flex h-[55px] items-center rounded-sm px-4 ring-offset-2 focus:border-none focus:outline-none focus:ring-2" onClick={onClick} to={href} aria-label={text}>
      {icon}
      {text}
    </Link>
  );
}

function ServerError({ error }: { error: unknown }) {
  const { t } = useTranslation(i18nNamespaces);

  // (content will be added by <Trans>)
  // eslint-disable-next-line jsx-a11y/anchor-has-content
  const home = <Link to="/" />;

  return (
    <ApplicationLayout>
      <PageTitle>
        <span className="glyphicon glyphicon-warning-sign mrgn-rght-md"></span>
        <span>{t('gcweb:server-error.page-title')}</span> <small className="help-inline">{t('gcweb:server-error.page-subtitle')}</small>
      </PageTitle>
      <p className="pragraph-gutter">{t('gcweb:server-error.page-message')}</p>
      <ul className="list-disc ps-16">
        <li>{t('gcweb:server-error.option-01')}</li>
        <li>
          <Trans ns={i18nNamespaces} i18nKey="gcweb:server-error.option-02" components={{ home }} />
        </li>
      </ul>
    </ApplicationLayout>
  );
}
