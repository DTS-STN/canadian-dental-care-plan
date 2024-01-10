import { type LoaderFunctionArgs, type MetaFunction, json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { type RouteHandle } from '~/types';
import { getFixedT } from '~/utils/locale-utils.server';

export const handle = {
  i18nNamespaces: ['common'],
} satisfies RouteHandle;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const t = await getFixedT(request, handle.i18nNamespaces);

  const response = await fetch('https://api.example.com/user');
  const user = await response.json();

  return json({
    pageId: 'CDCP-0001',
    pageTitle: t('index.page-title'),
    user,
  });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [{ title: data?.pageTitle }];
};

export default function () {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { user } = useLoaderData<typeof loader>();

  return (
    <>
      <h1 id="wb-cont" property="name">
        {t('index.page-title')}
      </h1>
      <p id="greeting">Hello, {user.firstName}</p>
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
