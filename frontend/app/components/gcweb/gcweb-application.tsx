import { Link, useMatches } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { LanguageSwitcher } from './language-switcher';

export type GCWebApplicationProps = {
  children: React.ReactElement;
};

/**
 * GCWeb Application page template.
 * see: https://wet-boew.github.io/GCWeb/templates/application/application-docs-en.html
 */
export default function GCWebApplication(props: GCWebApplicationProps) {
  return (
    <>
      <ApplicationHeader />
      <main className="container" property="mainContentOfPage" resource="#wb-main" typeof="WebPageElement">
        {props.children}
        <PageDetails />
      </main>
      <ApplicationFooter />
    </>
  );
}

function ApplicationHeader() {
  const { i18n, t } = useTranslation();

  return (
    <>
      <nav>
        <ul id="wb-tphp">
          <li className="wb-slc">
            <a className="wb-sl" href="#wb-cont">
              {t('gcweb.nav.skip-to-content')}
            </a>
          </li>
          <li className="wb-slc visible-sm visible-md visible-lg">
            <a className="wb-sl" href="#wb-info">
              {t('gcweb.nav.skip-to-about')}
            </a>
          </li>
        </ul>
      </nav>
      <header>
        <div id="wb-bnr" className="container">
          <div className="row">
            <section id="wb-lng" className="col-xs-3 col-sm-12 pull-right text-right">
              <h2 className="wb-inv">{t('gcweb.header.language-selection')}</h2>
              <ul className="list-inline mrgn-bttm-0">
                <li>
                  <LanguageSwitcher />
                </li>
              </ul>
            </section>
            <div className="brand col-xs-9 col-sm-5 col-md-4" property="publisher" typeof="GovernmentOrganization">
              <Link to={t('gcweb.header.govt-of-canada.href')} property="url">
                <img src={`/theme/gcweb/assets/sig-blk-${i18n.language}.svg`} alt={t('gcweb.header.govt-of-canada.text')} property="logo" />
              </Link>
              <meta property="name" content={t('gcweb.header.govt-of-canada.text')} />
              <meta property="areaServed" typeof="Country" content="Canada" />
              <link property="logo" href="/theme/gcweb/assets/wmms-blk.svg" />
            </div>
          </div>
        </div>
      </header>
      <section className="application-bar">
        <div className="container">
          <h2>
            <Link to="/">{t('gcweb.header.application-title')}</Link>
          </h2>
        </div>
      </section>
    </>
  );
}

function ApplicationFooter() {
  const { t } = useTranslation(['gcweb']);

  return (
    <footer id="wb-info">
      <h2 className="wb-inv">{t('gcweb.footer.about-site')}</h2>
      <div className="gc-sub-footer">
        <div className="d-flex align-items-center container">
          <nav>
            <h3 className="wb-inv">{t('gcweb.footer.gc-corporate')}</h3>
            <ul>
              <li>
                <Link to={t('gcweb.footer.terms-conditions.href')}>{t('gcweb.footer.terms-conditions.text')}</Link>
              </li>
              <li>
                <Link to={t('gcweb.footer.privacy.href')}>{t('gcweb.footer.privacy.text')}</Link>
              </li>
            </ul>
          </nav>
          <div className="wtrmrk align-self-end">
            <img src="/theme/gcweb/assets/wmms-blk.svg" alt={t('gcweb.footer.gc-symbol')} />
          </div>
        </div>
      </div>
    </footer>
  );
}

function PageDetails() {
  type PageDetailsAttrs = { gcweb?: { dateModified?: string; pageId?: string; version?: string } };
  const pageDetailsAttrs = useMatches().map((match) => match.handle as PageDetailsAttrs);

  const dateModified = pageDetailsAttrs.map((attr) => attr.gcweb?.dateModified).reduce((last, curr) => curr ?? last, undefined);
  const pageId = pageDetailsAttrs.map((attr) => attr.gcweb?.pageId).reduce((last, curr) => curr ?? last, undefined);
  const version = pageDetailsAttrs.map((attr) => attr.gcweb?.version).reduce((last, curr) => curr ?? last, undefined);

  const { t } = useTranslation(['gcweb']);

  return (
    <section className="pagedetails">
      <h2 className="wb-inv">{t('gcweb.page-details.page-details')}</h2>
      <div className="row">
        <div className="col-xs-12">
          <dl id="wb-dtmd">
            {!!pageId && (
              <>
                <dt className="float-left clear-left pr-[1ch]">{t('gcweb.page-details.screen-id')}</dt>
                <dd className="float-left clear-right mb-0">
                  <span property="identifier">{pageId}</span>
                </dd>
              </>
            )}
            {!!dateModified && (
              <>
                <dt className="float-left clear-left pr-[1ch]">{t('gcweb.page-details.date-modfied')}</dt>
                <dd className="float-left clear-right mb-0">
                  <time property="dateModified">{dateModified}</time>
                </dd>
              </>
            )}
            {!!version && (
              <>
                <dt className="float-left clear-left pr-[1ch]">{t('gcweb.page-details.version')}</dt>
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
