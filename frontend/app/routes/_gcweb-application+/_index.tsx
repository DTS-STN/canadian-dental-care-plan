import { type LoaderFunctionArgs } from '@remix-run/node';
import { Link, type MetaFunction, json } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { getFixedT, getLocale } from '~/utils/locale-utils.server';

export const handle = {
  i18nNamespaces: ['common'],
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const locale = getLocale(request);
  const { pathname } = new URL(request.url);

  if (pathname !== '/' && locale === undefined) {
    throw new Response('Not found', { status: 404, statusText: 'Not found' });
  }

  const t = await getFixedT(request, handle.i18nNamespaces);
  return json({
    pageId: 'CDCP-0001',
    pageTitle: t('index.page-title'),
  });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [{ title: data?.pageTitle }];
};

export default function Index() {
  const { t } = useTranslation(handle.i18nNamespaces);

  return (
    <>
      <h1 id="wb-cont" property="name">
        {t('index.page-title')}
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
