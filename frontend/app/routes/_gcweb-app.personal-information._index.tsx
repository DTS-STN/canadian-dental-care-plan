import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { userService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('common', 'personal-information');

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'common:personal-information.breadcrumbs.home', to: '/' }, { labelI18nKey: 'common:personal-information.page-title' }],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0003',
  pageTitleI18nKey: 'common:personal-information.page-title',
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);

  return json({ user: userInfo });
}

export default function PersonalInformationIndex() {
  const { user } = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNamespaces);
  return (
    <>
      <h1 id="wb-cont" property="name">
        {t('common:personal-information.page-title')}
      </h1>
      <p>{t('personal-information:index.on-file')}</p>
      <dl>
        <dt>{t('personal-information:index.first-name')}</dt>
        <dd>{user?.firstName}</dd>
        <dt>{t('personal-information:index.last-name')}</dt>
        <dd>{user?.lastName}</dd>
        <dt>{t('personal-information:index.phone-number')}</dt>
        <dd>{user?.phoneNumber}</dd>
        <dt>{t('personal-information:index.home-address')}</dt>
        <dd>{user?.homeAddress}</dd>
        <dt>{t('personal-information:index.mailing-address')}</dt>
        <dd>{user?.mailingAddress}</dd>
        <dt>
          <Link to="/personal-information/preferred-language">{t('personal-information:index.preferred-language')}</Link>
        </dt>
        <dd>{user?.preferredLanguage}</dd>
      </dl>
    </>
  );
}
