import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { userService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('personal-information');

export const handle = {
  breadcrumbs: [
    { labelI18nKey: 'personal-information:preferred-language.index.breadcrumbs.home', to: '/' },
    { labelI18nKey: 'personal-information:preferred-language.index.breadcrumbs.personal-information', to: '/personal-information' },
    { labelI18nKey: 'personal-information:preferred-language.index.breadcrumbs.preferred-language' },
  ],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0011',
  pageTitleI18nKey: 'personal-information:preferred-language.index.page-title',
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);
  if (userInfo === null) {
    throw new Response(null, { status: 404 });
  }
  return json({ user: userInfo });
}

export default function PreferredLanguage() {
  const { user } = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNamespaces);
  return (
    <>
      <h1 id="wb-cont" property="name">
        {t('personal-information:preferred-language.index.page-title')}
      </h1>
      <p>{t('personal-information:preferred-language.index.on-file')}</p>
      <dl>
        <dt>{t('personal-information:preferred-language.index.language')}</dt>
        <dd>{user?.preferredLanguage === 'en' ? t('personal-information:preferred-language.index.nameEn') : t('personal-information:preferred-language.index.nameFr')}</dd>
      </dl>
      <Link to="/personal-information/preferred-language/edit" className="btn btn-primary">
        {t('personal-information:preferred-language.index.change')}
      </Link>
    </>
  );
}
