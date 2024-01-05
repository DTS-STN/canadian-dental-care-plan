import { Link } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

export default function AppFooter() {
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
