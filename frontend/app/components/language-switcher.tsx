import { type LinkProps, useFetcher } from '@remix-run/react';
import { MouseEventHandler } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Props for the LanguageSwitcher component.
 */
export type LanguageSwitcherProps = Omit<LinkProps, 'to'>;

/**
 * A component that renders a link to switch between languages.
 */
export function LanguageSwitcher() {
  const { i18n, t } = useTranslation('common');
  const fetcher = useFetcher();

  const altLang = i18n.language === 'fr' ? 'en' : 'fr';

  const changeLanguage: MouseEventHandler<HTMLButtonElement> = (event) => {
    fetcher.submit(event.currentTarget.form, { method: 'POST' });
    i18n.changeLanguage(altLang);
  };

  return (
    <fetcher.Form method="post" action="/api/switch-lang">
      <button onClick={changeLanguage}>{t('alt-lang')}</button>
    </fetcher.Form>
  );
}
