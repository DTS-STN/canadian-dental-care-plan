import { Link, type LinkProps, useSearchParams } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { getClientEnv } from '~/utils/env';
import { getAltLanguage } from '~/utils/locale-utils';

export type LanguageSwitcherProps = Omit<LinkProps, 'to' | 'reloadDocument'>;

/**
 * Component that can be used to switch from one language to another.
 * (ie: 'en' → 'fr'; 'fr' → 'en')
 */
export function LanguageSwitcher({ children, ...props }: LanguageSwitcherProps) {
  const { i18n } = useTranslation(['gcweb']);
  const [currentSearchParams] = useSearchParams();

  const { LANG_QUERY_PARAM: langParam } = getClientEnv();
  const langValue = getAltLanguage(i18n.language);

  const searchParams = new URLSearchParams(currentSearchParams);
  searchParams.set(langParam, langValue);

  const search = searchParams.toString();

  return (
    <Link data-testid="language-switcher" reloadDocument to={{ search }} {...props}>
      {children}
    </Link>
  );
}
