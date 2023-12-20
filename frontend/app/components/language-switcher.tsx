import { Link, useLocation, type LinkProps } from '@remix-run/react';
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
  const linkPath = pathname.replace(i18n.language, altLang);

  return (
    <Link {...props} to={linkPath} onClick={() => i18n.changeLanguage(altLang)}>
      {t('alt-lang')}
    </Link>
  );
}
