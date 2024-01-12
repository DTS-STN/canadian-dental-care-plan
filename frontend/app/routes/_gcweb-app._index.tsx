import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { Link } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { type RouteHandle } from '~/types';
import { getFixedT } from '~/utils/locale-utils.server';

export const handle = {
  breadcrumbs: [{ i18nKey: 'common:index.breadcrumbs.home' }],
  i18nNamespaces: ['common'],
  pageId: 'CDCP-0001',
} satisfies RouteHandle;

export async function loader({ request }: LoaderFunctionArgs) {
  const t = await getFixedT(request, ['common']);
  return json({ pageTitle: t('common:index.page-title') });
}

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
