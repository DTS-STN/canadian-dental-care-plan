import { Link, useLocation, type LinkProps } from '@remix-run/react';
import { type ReactEventHandler } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Props for the LanguageSwitcher component.
 */
export type LanguageSwitcherProps = Omit<LinkProps, 'to'>;

/**
 * A component that renders a link to switch between languages.
 */
export function LanguageSwitcher({ ...props }: LanguageSwitcherProps) {
  const { pathname } = useLocation();
  const { i18n, t } = useTranslation('common');
  
  const altLang = i18n.language === 'fr' ? 'en' : 'fr';
  const altLangUrl = `${pathname}?lang=${altLang}`;

  const changeLanguage: ReactEventHandler = () => {
    i18n.changeLanguage(altLang);
  };

  return (
    <Link {...props} to={altLangUrl} onClick={changeLanguage}>
      {t('alt-lang')}
    </Link>
  );
}
