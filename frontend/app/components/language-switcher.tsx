import { Link, type LinkProps, useLocation } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

/**
 * Props for the LanguageSwitcher component.
 */
export type LanguageSwitcherProps = Omit<LinkProps, 'to' | 'reloadDocument'>;

/**
 * A component that renders a link to switch between languages.
 */
export function LanguageSwitcher({ ...props }: LanguageSwitcherProps) {
  const { pathname } = useLocation();
  const { i18n, t } = useTranslation('common');

  const to = `${pathname}?lang=${i18n.language === 'fr' ? 'en' : 'fr'}`;

  return (
    <Link {...props} to={to} reloadDocument>
      {t('alt-lang')}
    </Link>
  );
}
