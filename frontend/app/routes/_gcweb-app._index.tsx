import { type LoaderFunctionArgs, type MetaFunction, json } from '@remix-run/node';
import { Link } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { type RouteHandle } from '~/types';
import { getFixedT } from '~/utils/locale-utils.server';

export const handle = {
  i18nNamespaces: ['gcweb', 'common'],
  breadcrumbs: [{ i18nKey: 'gcweb:breadcrumbs.index' }],
} satisfies RouteHandle;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const t = await getFixedT(request, handle.i18nNamespaces);

  return json({
    pageId: 'CDCP-0001',
    pageTitle: t('common:index.page-title'),
  });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [{ title: data?.pageTitle }];
};

export default function () {
  const { t } = useTranslation();

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
