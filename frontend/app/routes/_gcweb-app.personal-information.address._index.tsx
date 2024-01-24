import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { userService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('personal-information');

export const handle = {
  breadcrumbs: [
    { labelI18nKey: 'personal-information:address.index.breadcrumbs.home', to: '/' },
    { labelI18nKey: 'personal-information:address.index.breadcrumbs.personal-information', to: '/personal-information' },
    { labelI18nKey: 'personal-information:address.index.breadcrumbs.address' },
  ],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0007',
  pageTitleI18nKey: 'personal-information:address.index.page-title',
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);

  if (!userInfo) {
    throw new Response(null, { status: 404 });
  }

  return json({ userInfo });
}

export default function AddressIndex() {
  const { userInfo } = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNamespaces);

  return (
    <>
      <h1 id="wb-cont" property="name">
        {t('personal-information:address.index.page-title')}
      </h1>

      <dl>
        <dt>{t('personal-information:address.index.home-address')}</dt>
        <dd>{userInfo.homeAddress}</dd>
        <dt>{t('personal-information:address.index.mailing-address')}</dt>
        <dd>{userInfo.mailingAddress}</dd>
      </dl>
      <Link to="/personal-information/address/edit" className="btn btn-primary">
        {t('personal-information:address.index.change')}
      </Link>
    </>
  );
}
