import { json, redirect } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { redirectWithSuccess } from 'remix-toast';

import { Button, ButtonLink } from '~/components/buttons';
import { getLookupService } from '~/services/lookup-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getSessionService } from '~/services/session-service.server';
import { getUserService } from '~/services/user-service.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import type { RouteHandleData } from '~/utils/route-utils';

const i18nNamespaces = getTypedI18nNamespaces('personal-information');

export const handle = {
  breadcrumbs: [
    { labelI18nKey: 'personal-information:preferred-language.confirm.breadcrumbs.personal-information', to: '/personal-information' },
    { labelI18nKey: 'personal-information:preferred-language.confirm.breadcrumbs.preferred-language-edit', to: '/personal-information/preferred-language/edit' },
    { labelI18nKey: 'personal-information:preferred-language.confirm.breadcrumbs.preferred-language-confirm' },
  ],
  i18nNamespaces,
  pageIdentifier: 'CDCP-00010',
  pageTitleI18nKey: 'personal-information:preferred-language.confirm.page-title',
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);

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
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);

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
      <p className="mb-8 text-lg text-gray-500">{t('personal-information:preferred-language.confirm.subtitle')}</p>
      <Form method="post" noValidate>
        <dl className="my-6 border-y">
          <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-6">
            <dt className="font-semibold">{t('personal-information:preferred-language.edit.language')}</dt>
            <dd className="mt-3 sm:col-span-2 sm:mt-0">{preferredLanguage && getNameByLanguage(i18n.language, preferredLanguage)}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">{t('personal-information:preferred-language.confirm.button.confirm')}</Button>
          <ButtonLink id="cancelButton" to="/personal-information/preferred-language/edit">
            {t('personal-information:preferred-language.confirm.button.cancel')}
          </ButtonLink>
        </div>
      </Form>
    </>
  );
}
