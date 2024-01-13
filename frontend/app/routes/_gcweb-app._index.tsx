import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';

import { type Namespace } from 'i18next';
import { useTranslation } from 'react-i18next';

import { getFixedT } from '~/utils/locale-utils.server';

const i18nNamespaces: Namespace = ['common'];

export async function loader({ request }: LoaderFunctionArgs) {
  const t = await getFixedT(request, i18nNamespaces);

  const res = await fetch('https://api.example.com/user/00000000-0000-0000-0000-00000000000');
  const user = (await res.json()) as { firstName: string; lastName: string };

  return json<LoaderFunctionData & { user: typeof user }>({
    breadcrumbs: [{ label: t('common:index.breadcrumbs.home') }],
    i18nNamespaces,
    pageIdentifier: 'CDCP-0001',
    pageTitle: t('common:index.page-title'),
    user,
  });
}

export default function () {
  const { t } = useTranslation(i18nNamespaces);
  const { user } = useLoaderData<typeof loader>();

  return (
    <>
      <h1 id="wb-cont" property="name">
        {t('common:index.page-title')}
      </h1>
      <p>
        Welcome {user.firstName} {user.lastName}
      </p>
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
