import { Link, type LinkProps, useLoaderData, useLocation } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { type loader } from './route';

/**
 * Props for the LanguageSwitcher component.
 */
export type LanguageSwitcherProps = Omit<LinkProps, 'to' | 'reloadDocument'>;

/**
 * A component that renders a link to switch between languages.
 */
export function LanguageSwitcher({ ...props }: LanguageSwitcherProps) {
  const { langQueryParam } = useLoaderData<typeof loader>();
  const { pathname } = useLocation();
  const { i18n, t } = useTranslation(['gcweb']);

  const to = `${pathname}?${langQueryParam}=${i18n.language === 'fr' ? 'en' : 'fr'}`;

  return (
    <Link {...props} to={to} data-testid="language-switcher" reloadDocument>
      <span className="hidden-xs">{t('gcweb.language-switcher.alt-lang')}</span>
      <abbr title="Français" className="visible-xs h3 mrgn-tp-sm mrgn-bttm-0 text-uppercase">
        {t('gcweb.language-switcher.alt-lang-abbr')}
      </abbr>
    </Link>
  );
}
