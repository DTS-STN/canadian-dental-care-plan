import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { userService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('personal-information');

export const handle = {
  breadcrumbs: [
    { labelI18nKey: 'personal-information:preferred-language.breadcrumbs.home', to: '/' },
    { labelI18nKey: 'personal-information:preferred-language.breadcrumbs.personal-information', to: '/personal-information' },
    { labelI18nKey: 'personal-information:preferred-language.breadcrumbs.preferred-language' },
  ],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0004',
  pageTitleI18nKey: 'personal-information:preferred-language.page-title',
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);

  if (userInfo === null) {
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
        {t('personal-information:preferred-language.page-title')}
      </h1>
      <p>{t('personal-information:preferred-language.on-file')}</p>
      <dl>
        <dt>{t('personal-information:preferred-language.language')}</dt>
        <dd>{user.preferredLanguage}</dd>
      </dl>
    </>
  );
}
