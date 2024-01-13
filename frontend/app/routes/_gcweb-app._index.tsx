import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { Link } from '@remix-run/react';

import { type Namespace } from 'i18next';
import { useTranslation } from 'react-i18next';

import { getFixedT } from '~/utils/locale-utils.server';

const i18nNamespaces: Namespace = ['common'];

export async function loader({ request }: LoaderFunctionArgs) {
  const t = await getFixedT(request, i18nNamespaces);

  return json<LoaderFunctionData>({
    breadcrumbs: [{ label: t('common:index.breadcrumbs.home') }],
    i18nNamespaces,
    pageIdentifier: 'CDCP-0001',
    pageTitle: t('common:index.page-title'),
  });
}

export default function () {
  const { t } = useTranslation(i18nNamespaces);

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
