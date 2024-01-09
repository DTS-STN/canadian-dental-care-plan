import { Link, type LinkProps, useHref } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { useClientEnv } from '~/components/client-env';
import { getAltLanguage } from '~/utils/locale-utils';

export type LanguageSwitcherProps = Omit<LinkProps, 'to' | 'reloadDocument'>;

/**
 * Component that can be used to switch from one language to another.
 * (ie: 'en' → 'fr'; 'fr' → 'en')
 */
export function LanguageSwitcher({ children, ...props }: LanguageSwitcherProps) {
  const { i18n } = useTranslation(['gcweb']);

  const { LANG_QUERY_PARAM: langParam } = useClientEnv();
  const langValue = getAltLanguage(i18n.language);
  const to = useHref(`?${langParam}=${langValue}`);

  return (
    <Link data-testid="language-switcher" reloadDocument to={to} {...props}>
      {children}
    </Link>
  );
}
