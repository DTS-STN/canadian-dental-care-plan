import { useTranslation } from 'react-i18next';

import { LanguageSwitcher } from '~/components/language-switcher';
import { useCurrentLanguage } from '~/hooks';

interface PageHeaderBrandProps {
  /**
   * The URL to wrap the logo with. If this prop is defined and non-empty,
   * the logo will be wrapped in a link pointing to this URL.
   *
   * @type {string}
   */
  headerLogoUrl?: string;
}

export function PageHeaderBrand({ headerLogoUrl }: PageHeaderBrandProps) {
  const { currentLanguage, altLanguage } = useCurrentLanguage();
  const { i18n, t } = useTranslation(['gcweb']);
  const altT = i18n.getFixedT(altLanguage, ['gcweb']);

  const headerLogo = (
    <>
      <img className="h-8 w-auto" src={`/assets/sig-blk-${currentLanguage}.svg`} alt={t('gcweb:header.govtOfCanada.text')} property="logo" width="300" height="28" decoding="async" />
      <span className="sr-only">{<span lang={altLanguage}>{altT('gcweb:header.govtOfCanada.text')}</span>}</span>
    </>
  );

  return (
    <div id="wb-bnr">
      <div className="container flex items-center justify-between gap-6 py-2.5 sm:py-3.5">
        <div property="publisher" typeof="GovernmentOrganization">
          {headerLogoUrl ? (
            <a href={headerLogoUrl} property="url">
              {headerLogo}
            </a>
          ) : (
            headerLogo
          )}

          <meta property="name" content={t('gcweb:header.govtOfCanada.text')} />
          <meta property="areaServed" typeof="Country" content="Canada" />
          <link property="logo" href="/assets/wmms-blk.svg" />
        </div>
        <section id="wb-lng">
          <h2 className="sr-only">{t('gcweb:header.languageSelection')}</h2>
          <LanguageSwitcher>
            <span className="hidden md:block" lang={t('gcweb:languageSwitcher.altLangAbbrProp')}>
              {t('gcweb:languageSwitcher.altLang')}
            </span>
            <abbr title={t('gcweb:languageSwitcher.altLang')} className="cursor-help uppercase md:hidden">
              {t('gcweb:languageSwitcher.altLangAbbr')}
            </abbr>
          </LanguageSwitcher>
        </section>
      </div>
    </div>
  );
}
