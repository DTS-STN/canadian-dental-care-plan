import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { userService } from '~/services/user-service.server';
import { lookupService } from '~/services/lookup-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('common', 'personal-information');

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'common:personal-information.breadcrumbs.home', to: '/' }, { labelI18nKey: 'common:personal-information.page-title', to: '/personal-information' }, { labelI18nKey: 'common:preferred-language.page-title' }],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0004',
  pageTitleI18nKey: 'common:preferred-language.page-title',
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);
  if (userInfo === null) {
    throw new Response(null, { status: 404 });
  }

  const preferredLanguage = (userInfo?.preferredLanguage)? await lookupService.getPreferredLanguage(userInfo.preferredLanguage) : undefined;
  if (preferredLanguage === null) {
    throw new Response(null, { status: 404 });
  }
  return json({ user: userInfo, preferredLanguageDetails: preferredLanguage });
}

export default function PersonalInformationIndex() {
  const { user, preferredLanguageDetails } = useLoaderData<typeof loader>();
  
  const { t } = useTranslation(i18nNamespaces);
  return (
    <>
      <h1 id="wb-cont" property="name">
        {t('common:preferred-language.page-title')}
      </h1>
      <p>{t('personal-information:preferred-language.on-file')}</p>
      <dl>
        <dt>{t('personal-information:preferred-language.language')}</dt>
        <dd>{user?.preferredLanguage}</dd>
        <dt>{t('personal-information:preferred-language.id')}</dt>
        <dd>{preferredLanguageDetails?.id}</dd>
        <dt>{t('personal-information:preferred-language.nameEn')}</dt>
        <dd>{preferredLanguageDetails?.nameEn}</dd>
        <dt>{t('personal-information:preferred-language.nameFr')}</dt>
        <dd>{preferredLanguageDetails?.nameFr}</dd>
      </dl>
    </>
  );
}
