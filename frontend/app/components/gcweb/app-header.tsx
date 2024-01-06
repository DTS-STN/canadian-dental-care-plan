import { Link } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { LanguageSwitcher } from '~/components/gcweb/language-switcher';

export default function AppHeader() {
  const { i18n, t } = useTranslation(['gcweb']);

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
              <Link to={`https://www.canada.ca/${i18n.language}.html`} property="url">
                <img src={`/theme/gcweb/assets/sig-blk-${i18n.language}.svg`} alt={t('gcweb.header.govt-of-canada')} property="logo" />
              </Link>
              <meta property="name" content={t('gcweb.header.govt-of-canada')} />
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
