import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { getUserService } from '~/services/user-service.server';
import { getEnv } from '~/utils/env.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('common', 'gcweb');

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'common:index.breadcrumbs.home' }],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0001',
  pageTitleI18nKey: 'common:index.page-title',
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  const env = getEnv();
  const userService = getUserService({ env });
  const userId = await userService.getUserId();
  return json({
    user: await userService.getUserInfo(userId),
  });
}

export default function Index() {
  const { user } = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNamespaces);

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
          <Link to="/personal-information">Personal information</Link>
        </li>
        <li>
          <Link to="/update-info">Update personal info</Link>
        </li>
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
