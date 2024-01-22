import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { userService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('common', 'gcweb');

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'common:index.breadcrumbs.home' }],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0001',
  pageTitleI18nKey: 'common:index.page-title',
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
        {t('common:index.page-title')}
      </h1>
      <p>
      {t('common:index.welcome')} {userInfo.firstName} {userInfo.lastName}
      </p>
      <ul>
        <li>
          <Link to="/personal-information">{t('common:personal-information.page-title')}</Link>
        </li>
        <li>
          <Link to="/update-info">{t('common:personal-information.update')}</Link>
        </li>
        <li>
          <Link to="/about">{t('common:about.page-title')}</Link>
        </li>
        <li>
          <Link to="/not-found">{t('gcweb:not-found.page-title')}</Link>
        </li>
        <li>
          <Link to="/error">{t('gcweb:server-error.page-title')}</Link>
        </li>
      </ul>
    </>
  );
}
