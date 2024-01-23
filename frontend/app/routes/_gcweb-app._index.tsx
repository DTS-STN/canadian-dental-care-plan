import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { userService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('index');

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'index:breadcrumbs.home' }],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0001',
  pageTitleI18nKey: 'index:page-title',
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);

  if (!userInfo) {
    throw new Response(null, { status: 404 });
  }

  return json({ userInfo });
}

export default function Index() {
  const { userInfo } = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNamespaces);

  return (
    <>
      <h1 id="wb-cont" property="name">
        {t('index:page-title')}
      </h1>
      <p>{t('index:welcome', { firstName: userInfo.firstName, lastName: userInfo.firstName })}</p>
      <ul>
        <li>
          <Link to="/personal-information">{t('index:personal-info')}</Link>
        </li>
        <li>
          <Link to="/update-info">{t('index:update-info')}</Link>
        </li>
        <li>
          <Link to="/about">{t('index:about')}</Link>
        </li>
        <li>
          <Link to="/not-found">{t('index:not-found')}</Link>
        </li>
        <li>
          <Link to="/error">{t('index:server-error')}</Link>
        </li>
      </ul>
    </>
  );
}
