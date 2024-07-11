import { Link } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { LanguageSwitcher } from '~/components/language-switcher';
import { getAltLanguage } from '~/utils/locale-utils';

export function PageHeaderBrand() {
  const { i18n, t } = useTranslation(['gcweb']);

  const altLanguage = getAltLanguage(i18n.language);
  const altLogoContent = <span lang={altLanguage}>{i18n.getFixedT(altLanguage)('gcweb:header.govt-of-canada.text')}</span>;

  return (
    <div id="wb-bnr">
      <div className="container flex items-center justify-between gap-6 py-2.5 sm:py-3.5">
        <div property="publisher" typeof="GovernmentOrganization">
          <Link to={t('gcweb:header.govt-of-canada.href')} property="url">
            <img className="h-8 w-auto" src={`/assets/sig-blk-${i18n.language}.svg`} alt={t('gcweb:header.govt-of-canada.text')} property="logo" width="300" height="28" decoding="async" />
          </Link>
          <span className="sr-only">/ {altLogoContent}</span>
          <meta property="name" content={t('gcweb:header.govt-of-canada.text')} />
          <meta property="areaServed" typeof="Country" content="Canada" />
          <link property="logo" href="/assets/wmms-blk.svg" />
        </div>
        <section id="wb-lng">
          <h2 className="sr-only">{t('gcweb:header.language-selection')}</h2>
          <LanguageSwitcher>
            <span className="hidden md:block" lang={t('gcweb:language-switcher.alt-lang-abbr-prop')}>
              {t('gcweb:language-switcher.alt-lang')}
            </span>
            <abbr title={t('gcweb:language-switcher.alt-lang')} className="cursor-help uppercase md:hidden">
              {t('gcweb:language-switcher.alt-lang-abbr')}
            </abbr>
          </LanguageSwitcher>
        </section>
      </div>
    </div>
  );
}
