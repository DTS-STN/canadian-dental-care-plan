import type { ComponentProps, MouseEventHandler, ReactElement, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import { type LinksFunction } from '@remix-run/node';
import { Link, Outlet, isRouteErrorResponse, useRouteError } from '@remix-run/react';

import { Trans, useTranslation } from 'react-i18next';

import cdcpStylesheet from '~/cdcp.css';
import { AnchorLink } from '~/components/anchor-link';
import { LanguageSwitcher } from '~/components/language-switcher';
import { PageTitle } from '~/components/page-title';
import { SignOutIcon } from '~/components/sign-out-icon';
import { getClientEnv } from '~/utils/env';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { useBreadcrumbs, useBuildInfo, useI18nNamespaces, usePageIdentifier, usePageTitleI18nKey } from '~/utils/route-utils';

const i18nNamespaces = getTypedI18nNamespaces('gcweb');

export const handle = { i18nNamespaces } as const satisfies RouteHandleData;

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: '/theme/gcweb/css/theme.min.css' },
  { rel: 'stylesheet', href: cdcpStylesheet },
];

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
      <div id="skip-to-content" className="wb-slc">
        <AnchorLink anchorElementId="wb-cont" className="wb-sl">
          {t('gcweb:nav.skip-to-content')}
        </AnchorLink>
        <AnchorLink anchorElementId="wb-info" className="wb-sl">
          {t('gcweb:nav.skip-to-about')}
        </AnchorLink>
      </div>
      <header>
        <div id="wb-bnr" className="container">
          <div className="row">
            <section id="wb-lng" className="col-xs-3 col-sm-12 pull-right text-right">
              <h2 className="wb-inv">{t('gcweb:header.language-selection')}</h2>
              <ul className="list-inline mrgn-bttm-0">
                <li>
                  <LanguageSwitcher>
                    <span className="hidden-xs">{t('gcweb:language-switcher.alt-lang')}</span>
                    <abbr title={t('gcweb:language-switcher.alt-lang')} className="visible-xs h3 mrgn-tp-sm mrgn-bttm-0 text-uppercase">
                      {t('gcweb:language-switcher.alt-lang-abbr')}
                    </abbr>
                  </LanguageSwitcher>
                </li>
              </ul>
            </section>
            <div className="brand col-xs-9 col-sm-5 col-md-4" property="publisher" typeof="GovernmentOrganization">
              <Link to={t('gcweb:header.govt-of-canada.href')} property="url">
                <img src={`/theme/gcweb/assets/sig-blk-${i18n.language}.svg`} alt={t('gcweb:header.govt-of-canada.text')} property="logo" />
              </Link>
              <meta property="name" content={t('gcweb:header.govt-of-canada.text')} />
              <meta property="areaServed" typeof="Country" content="Canada" />
              <link property="logo" href="/theme/gcweb/assets/wmms-blk.svg" />
            </div>
          </div>
        </div>
        <section className="application-bar">
          <div className="container">
            <div className="justify-between sm:flex">
              <h2>
                <Link to="/">{t('gcweb:header.application-title')}</Link>
              </h2>
              <nav ref={dropdown} className="relative">
                <button
                  id="dropdownNavbarLink"
                  onClick={() => setShowDropdown((currentState) => !currentState)}
                  aria-haspopup="true"
                  data-testid="menuButton"
                  aria-expanded={showDropdown}
                  className="font-body text-blue-primary ring-blue-hover relative z-20 flex h-full w-full items-center justify-between rounded-sm py-0.5 font-bold ring-offset-2 focus:outline-none focus:ring-2 sm:pl-4"
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
                  <div id="dropdownNavbar" className="text-deep-blue-dark z-10 rounded-b-[5px] bg-white pt-1 drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)] sm:absolute sm:w-[260px]" aria-labelledby="dropdownLargeButton">
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
      <h2 className="wb-inv">{t('gcweb:page-details.page-details')}</h2>
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
      <h2 className="wb-inv">{t('gcweb:footer.about-site')}</h2>
      <div className="gc-sub-footer">
        <div className="d-flex align-items-center container">
          <nav aria-labelledby="gc-corporate">
            <h3 id="gc-corporate" className="wb-inv">
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

function Breadcrumb({ children, to }: { children: ReactNode; to?: string }) {
  // prettier-ignore
  return to === undefined
    ? <span property="name">{children}</span>
    : <Link to={to} property="item" typeof="WebPage"><span property="name">{children}</span></Link>;
}

function Breadcrumbs() {
  const { t } = useTranslation([...i18nNamespaces, ...useI18nNamespaces()]);
  const breadcrumbs = useBreadcrumbs();

  return (
    <nav id="wb-bc" property="breadcrumb" aria-labelledby="breadcrumbs">
      <h2 id="breadcrumbs">{t('gcweb:breadcrumbs.you-are-here')}</h2>
      <div className="container">
        <ol className="breadcrumb" typeof="BreadcrumbList">
          <li property="itemListElement" typeof="ListItem">
            <Breadcrumb to={breadcrumbs.length !== 0 ? '/' : undefined}>{t('gcweb:breadcrumbs.home')}</Breadcrumb>
          </li>
          {breadcrumbs.map(({ labelI18nKey, to }, index) => {
            return (
              <li key={index} property="itemListElement" typeof="ListItem">
                <Breadcrumb to={to}>{t(labelI18nKey)}</Breadcrumb>
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
    <Link className="font-body hover:text-blue-hover ring-blue-hover flex h-[55px] items-center rounded-sm px-4 ring-offset-2 focus:border-none focus:outline-none focus:ring-2" onClick={onClick} to={href} aria-label={text}>
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
      <h1>
        <span className="glyphicon glyphicon-warning-sign mrgn-rght-md"></span>
        <span>{t('gcweb:server-error.page-title')}</span> <small className="help-inline">{t('gcweb:server-error.page-subtitle')}</small>
      </h1>
      <p>{t('gcweb:server-error.page-message')}</p>
      <ul className="list-disc ps-16">
        <li>{t('gcweb:server-error.option-01')}</li>
        <li>
          <Trans ns={i18nNamespaces} i18nKey="gcweb:server-error.option-02" components={{ home }} />
        </li>
      </ul>
    </ApplicationLayout>
  );
}
