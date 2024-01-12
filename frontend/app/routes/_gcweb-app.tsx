import { type ReactNode } from 'react';

import { type LinksFunction } from '@remix-run/node';
import { Link, Outlet, isRouteErrorResponse, useMatches, useRouteError } from '@remix-run/react';

import { Trans, useTranslation } from 'react-i18next';

import { LanguageSwitcher } from '~/components/language-switcher';
import { type RouteHandle, type RouteHandleBreadcrumb } from '~/types';
import { useBuildInfo } from '~/utils/build-info';
import { getNamespaces } from '~/utils/locale-utils';

export const handle = {
  i18nNamespaces: ['gcweb'],
} satisfies RouteHandle;

export const links: LinksFunction = () => [{ rel: 'stylesheet', href: '/theme/gcweb/css/theme.min.css' }];

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    switch (error.status) {
      // TODO :: GjB :: handle other status codes
      default:
        console.error(error);
        return <ServerError error={error} />;
    }
  }

  console.error(error);
  return <ServerError error={error} />;
}

export default function () {
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
        {children}
        <PageDetails />
      </main>
      <PageFooter />
    </>
  );
}

function PageHeader() {
  const { i18n, t } = useTranslation();

  return (
    <>
      <nav>
        <ul id="wb-tphp">
          <li className="wb-slc">
            <a className="wb-sl" href="#wb-cont">
              {t('gcweb:nav.skip-to-content')}
            </a>
          </li>
          <li className="wb-slc visible-sm visible-md visible-lg">
            <a className="wb-sl" href="#wb-info">
              {t('gcweb:nav.skip-to-about')}
            </a>
          </li>
        </ul>
      </nav>
      <header>
        <div id="wb-bnr" className="container">
          <div className="row">
            <section id="wb-lng" className="col-xs-3 col-sm-12 pull-right text-right">
              <h2 className="wb-inv">{t('gcweb:header.language-selection')}</h2>
              <ul className="list-inline mrgn-bttm-0">
                <li>
                  <LanguageSwitcher>
                    <span className="hidden-xs">{t('gcweb:language-switcher.alt-lang')}</span>
                    <abbr title="Français" className="visible-xs h3 mrgn-tp-sm mrgn-bttm-0 text-uppercase">
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
            <h2>
              <Link to="/">{t('gcweb:header.application-title')}</Link>
            </h2>
          </div>
        </section>
      </header>
      <Breadcrumbs />
    </>
  );
}

function PageDetails() {
  const buildInfo = useBuildInfo();
  const dateModified = buildInfo?.buildDate;
  const version = buildInfo?.buildVersion;

  const pageId = useMatches()
    .map((route) => route.handle)
    .filter((handle): handle is RouteHandle => !!handle)
    .map((routeHandle) => routeHandle.pageId)
    .reduce((last, curr) => curr ?? last);

  const { t } = useTranslation(['gcweb']);

  return (
    <section className="pagedetails">
      <h2 className="wb-inv">{t('gcweb:page-details.page-details')}</h2>
      <div className="row">
        <div className="col-xs-12">
          <dl id="wb-dtmd">
            {!!pageId && (
              <>
                <dt className="float-left clear-left pr-[1ch]">{t('gcweb:page-details.screen-id')}</dt>
                <dd className="float-left clear-right mb-0">
                  <span property="identifier">{pageId}</span>
                </dd>
              </>
            )}
            {!!dateModified && (
              <>
                <dt className="float-left clear-left pr-[1ch]">{t('gcweb:page-details.date-modfied')}</dt>
                <dd className="float-left clear-right mb-0">
                  <time property="dateModified">{dateModified.slice(0, 10)}</time>
                </dd>
              </>
            )}
            {!!version && (
              <>
                <dt className="float-left clear-left pr-[1ch]">{t('gcweb:page-details.version')}</dt>
                <dd className="float-left clear-right mb-0">
                  <span property="version">{version}</span>
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
  const { t } = useTranslation(['gcweb']);

  return (
    <footer id="wb-info">
      <h2 id='footer-heading' className="wb-inv">{t('gcweb:footer.about-site')}</h2>
      <div className="gc-sub-footer">
        <div className="d-flex align-items-center container">
          <nav aria-labelledby='footer-heading'>
            <h3 className="wb-inv">{t('gcweb:footer.gc-corporate')}</h3>
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
  const { t } = useTranslation(getNamespaces(useMatches()));

  const breadcrumbs = useMatches()
    .map((route) => route.handle)
    .filter((handle): handle is RouteHandle => !!handle)
    .flatMap((routeHandle) => routeHandle.breadcrumbs)
    .filter((breadcrumbs): breadcrumbs is RouteHandleBreadcrumb => !!breadcrumbs);

  if (breadcrumbs.length === 0) {
    return <></>;
  }

  return (
    <nav id="wb-bc" property="breadcrumb" aria-labelledby="breadcrumbs">
      <h2 id="breadcrumbs">{t('gcweb:breadcrumbs.you-are-here')}</h2>
      <div className="container">
        <ol className="breadcrumb" typeof="BreadcrumbList">
          {breadcrumbs.map((breadcrumb, index) => {
            const breadcrumbItem = breadcrumb?.to ? (
              <Link to={breadcrumb.to} property="item" typeof="WebPage">
                <span property="name">{t(breadcrumb.i18nKey)}</span>
              </Link>
            ) : (
              <span property="name">{t(breadcrumb.i18nKey)}</span>
            );

            return (
              <li key={index} property="itemListElement" typeof="ListItem">
                {breadcrumbItem}
                <meta property="position" content={index + 1 + ''} />
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

function ServerError({ error }: { error: unknown }) {
  const { t } = useTranslation(['gcweb']);

  // (content will be added by <Trans>)
  // eslint-disable-next-line jsx-a11y/anchor-has-content
  const home = <Link to="/" />;

  return (
    <ApplicationLayout>
      <h1>
        <span className="glyphicon glyphicon-warning-sign mrgn-rght-md"></span>
        <span>{t('gcweb:server-error.page-header')}</span> <small className="help-inline">{t('gcweb:server-error.page-subheader')}</small>
      </h1>
      <p>{t('gcweb:server-error.page-message')}</p>
      <ul className="list-disc ps-16">
        <li>{t('gcweb:server-error.option-01')}</li>
        <li>
          <Trans i18nKey="gcweb:server-error.option-02" components={{ home }} />
        </li>
      </ul>
    </ApplicationLayout>
  );
}
