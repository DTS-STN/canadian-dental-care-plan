import { type MouseEvent } from 'react';

import { Link, type LinkProps, useSearchParams } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { getClientEnv } from '~/utils/env';
import { getAltLanguage, switchLanguageCookie } from '~/utils/locale-utils';

export type LanguageSwitcherProps = Omit<LinkProps, 'to' | 'reloadDocument' | 'onClick'>;

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

  /**
   * Asynchronously changes the language based on a user interaction event.
   *
   * @param {MouseEvent<HTMLAnchorElement>} event - The mouse event triggering the language change.
   * @returns {Promise<void>} A promise that resolves when the language change operation is complete.
   *
   * @param {MouseEvent<HTMLAnchorElement>} event - The mouse event triggering the language change.
   */
  async function changeLanguage(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

    // Changes the language cookie client-side.
    const status = await switchLanguageCookie(langValue);

    if (status >= 200 && status < 300) {
      // Changes the language client-side.
      i18n.changeLanguage(langValue);
    }
  }

  return (
    <Link data-testid="language-switcher" onClick={changeLanguage} reloadDocument to={{ search }} {...props}>
      {children}
    </Link>
  );
}
