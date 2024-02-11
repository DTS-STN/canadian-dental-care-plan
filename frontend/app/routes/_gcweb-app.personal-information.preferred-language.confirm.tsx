import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, Link, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { redirectWithSuccess } from 'remix-toast';

import { getLookupService } from '~/services/lookup-service.server';
import { getSessionService } from '~/services/session-service.server';
import { getUserService } from '~/services/user-service.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';

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
  const userService = getUserService();
  const sessionService = await getSessionService();

  const userId = await userService.getUserId();
  if (!userId) return redirect('/');

  const userInfo = await userService.getUserInfo(userId);
  if (!userInfo) return redirect('/');

  const session = await sessionService.getSession(request);
  if (!session.has('newPreferredLanguage')) return redirect('/');

  const preferredLanguage = await getLookupService().getPreferredLanguage(session.get('newPreferredLanguage'));
  return json({ userInfo, preferredLanguage });
}

export async function action({ request }: ActionFunctionArgs) {
  const userService = getUserService();
  const sessionService = await getSessionService();

  const userId = await userService.getUserId();
  if (!userId) return redirect('/');

  const userInfo = await userService.getUserInfo(userId);
  if (!userInfo) return redirect('/');

  const session = await sessionService.getSession(request);
  if (!session.has('newPreferredLanguage')) return redirect('/');

  await userService.updateUserInfo(userId, { preferredLanguage: session.get('newPreferredLanguage') });
  session.unset('newPreferredLanguage');
  return redirectWithSuccess('/personal-information', 'personal-information:preferred-language.confirm.updated-notification', {
    headers: {
      'Set-Cookie': await sessionService.commitSession(session),
    },
  });
}

export default function PreferredLanguageConfirm() {
  const { preferredLanguage } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(i18nNamespaces);
  return (
    <>
      <p>{t('personal-information:preferred-language.confirm.confirm-message')}</p>
      <Form method="post">
        <dl>
          <dt>{t('personal-information:preferred-language.edit.language')}</dt>
          <dd>{preferredLanguage && getNameByLanguage(i18n.language, preferredLanguage)}</dd>
        </dl>
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
