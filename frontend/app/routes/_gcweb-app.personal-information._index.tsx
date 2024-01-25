import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { userService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('personal-information');

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'personal-information:index.breadcrumbs.home', to: '/' }, { labelI18nKey: 'personal-information:index.page-title' }],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0002',
  pageTitleI18nKey: 'personal-information:index.page-title',
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);

  if (!userInfo) {
    throw new Response(null, { status: 404 });
  }

  return json({ user: userInfo });
}

export default function PersonalInformationIndex() {
  const { user } = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNamespaces);
  return (
    <>
      <h1 id="wb-cont" property="name">
        {t('personal-information:index.page-title')}
      </h1>
      <p>{t('personal-information:index.on-file')}</p>
      <dl>
        <dt>{t('personal-information:index.first-name')}</dt>
        <dd>{user.firstName}</dd>
        <dt>{t('personal-information:index.last-name')}</dt>
        <dd>{user.lastName}</dd>
        <dt>
          <Link to="/personal-information/phone-number">{t('personal-information:index.phone-number')}</Link>
        </dt>
        <dd>{user.phoneNumber}</dd>
        <dt>
          <Link to="/personal-information/address">{t('personal-information:index.home-address')}</Link>
        </dt>
        <dd>{user.homeAddress}</dd>
        <dt>
          <Link to="/personal-information/address">{t('personal-information:index.mailing-address')}</Link>
        </dt>
        <dd>{user.mailingAddress}</dd>
        <dt>
          <Link to="/personal-information/preferred-language">{t('personal-information:index.preferred-language')}</Link>
        </dt>
        <dd>{user.preferredLanguage}</dd>
      </dl>
    </>
  );
}
