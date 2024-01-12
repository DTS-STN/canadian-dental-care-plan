import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { Link } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { type RouteHandle } from '~/types';
import { getFixedT } from '~/utils/locale-utils.server';
import { type BreadcrumbDataSchema, type PageTitleDataSchema } from '~/utils/route-utils';

export const handle = {
  i18nNamespaces: ['common'],
  pageId: 'CDCP-0001',
} satisfies RouteHandle;

export async function loader({ request }: LoaderFunctionArgs) {
  const t = await getFixedT(request, ['common']);

  const data: PageTitleDataSchema & BreadcrumbDataSchema = {
    breadcrumb: [{ label: t('common:index.breadcrumbs.home') }],
    pageTitle: t('common:index.page-title'),
  };

  return json(data);
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
