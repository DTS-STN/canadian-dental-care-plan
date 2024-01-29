import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, Link, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { sessionService } from '~/services/session-service.server';
import { userService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('personal-information');

export const handle = {
  breadcrumbs: [
    { labelI18nKey: 'personal-information:preferred-language.confirm.breadcrumbs.home', to: '/' },
    { labelI18nKey: 'personal-information:preferred-language.confirm.breadcrumbs.personal-information', to: '/personal-information' },
    { labelI18nKey: 'personal-information:preferred-language.confirm.breadcrumbs.preferred-language-edit', to: '/personal-information/preferred-language/edit' },
    { labelI18nKey: 'personal-information:preferred-language.confirm.breadcrumbs.preferred-language-confirm' },
  ],
  i18nNamespaces,
  pageIdentifier: 'CDCP-00010',
  pageTitleI18nKey: 'personal-information:preferred-language.confirm.page-title',
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);
  const session = await sessionService.getSession(request.headers.get('Cookie'));

  return json({ userInfo, preferredLanguage: await session.get('preferredLanguage') });
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const userId = await userService.getUserId();
    const session = await sessionService.getSession(request.headers.get('Cookie'));

    const preferredLanguage = await session.get('preferredLanguage');
    await userService.updateUserInfo(userId, { preferredLanguage });

    return redirect('/personal-information');
  } catch (error) {
    console.error(error);
  }
}

export default function PreferredLanguageConfirm() {
  const loaderData = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNamespaces);
  return (
    <>
      <h1 id="wb-cont" property="name">
        {t('personal-information:preferred-language.confirm.page-title')}
      </h1>
      <p>{t('personal-information:preferred-language.confirm.confirm-message')}</p>
      <Form method="post">
        <div className="form-group">
          <dl>
            <dt>{t('personal-information:preferred-language.index.language')}</dt>
            <dd>{loaderData.preferredLanguage === 'en' ? t('personal-information:preferred-language.index.nameEn') : t('personal-information:preferred-language.index.nameFr')}</dd>
          </dl>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="btn btn-primary btn-lg">{t('personal-information:preferred-language.confirm.button.confirm')}</button>
          <Link id="cancelButton" to="/personal-information/preferred-language/edit" className="btn btn-default btn-lg">
            {t('personal-information:preferred-language.confirm.button.cancel')}
          </Link>
        </div>
      </Form>
    </>
  );
}
