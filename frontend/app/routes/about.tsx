import { Link } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { LanguageSwitcher } from '~/components/language-switcher';

export const handle = {
  i18nNamespaces: ['common'],
};

export default function About() {
  const { t } = useTranslation(handle.i18nNamespaces);

  return (
    <>
      <h1 className="mb-5 text-3xl font-bold underline">{t('index.page-title')}</h1>
      <ul>
        <li>
          <LanguageSwitcher />
        </li>
        <li>
          <Link to="/">Home</Link>
        </li>
      </ul>
    </>
  );
}
