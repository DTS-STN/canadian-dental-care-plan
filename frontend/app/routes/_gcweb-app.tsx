import { type ReactNode } from 'react';

import { type LinksFunction, type LoaderFunctionArgs, json } from '@remix-run/node';
import { Link, Outlet, isRouteErrorResponse, useRouteError } from '@remix-run/react';

import { type Namespace } from 'i18next';
import { Trans, useTranslation } from 'react-i18next';

import { LanguageSwitcher } from '~/components/language-switcher';
import { useBreadcrumbs, useBuildInfo, usePageIdentifier } from '~/utils/route-utils';

const i18nNamespaces: Namespace = ['gcweb'];

export const links: LinksFunction = () => [{ rel: 'stylesheet', href: '/theme/gcweb/css/theme.min.css' }];

export async function loader({ request }: LoaderFunctionArgs) {
  return json<LoaderFunctionData>({ i18nNamespaces });
}

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
  const { i18n, t } = useTranslation(i18nNamespaces);

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

function Breadcrumbs() {
  const { t } = useTranslation(i18nNamespaces);
  const breadcrumbs = useBreadcrumbs();

  if (breadcrumbs === undefined || breadcrumbs.length === 0) {
    return <></>;
  }

  return (
    <nav id="wb-bc" property="breadcrumb" aria-labelledby="breadcrumbs">
      <h2 id="breadcrumbs">{t('gcweb:breadcrumbs.you-are-here')}</h2>
      <div className="container">
        <ol className="breadcrumb" typeof="BreadcrumbList">
          {breadcrumbs.map(({ label, to }, index) => (
            <li key={index} property="itemListElement" typeof="ListItem">
              {to ? (
                <Link to={to} property="item" typeof="WebPage">
                  <span property="name">{label}</span>
                </Link>
              ) : (
                <span property="name">{label}</span>
              )}
              <meta property="position" content={`${index + 1}`} />
            </li>
          ))}
        </ol>
      </div>
    </nav>
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
