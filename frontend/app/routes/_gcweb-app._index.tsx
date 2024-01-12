import { Link } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { type RouteHandle } from '~/types';

export const handle = {
  breadcrumbs: [{ i18nKey: 'common:index.breadcrumbs.home' }],
  i18nNamespaces: ['common'],
  pageId: 'CDCP-0001',
  pageTitlei18nKey: 'common:index.page-title',
} satisfies RouteHandle;

export default function () {
  const { t } = useTranslation(['common']);

  return (
    <>
      <h1 id="wb-cont" property="name">
        {t('common:index.page-title')}
      </h1>
      <ul>
        <li>
          <Link to="/about">About</Link>
        </li>
        <li>
          <Link to="/not-found">404 not found page</Link>
        </li>
        <li>
          <Link to="/error">500 internal server error page</Link>
        </li>
      </ul>
    </>
  );
}
