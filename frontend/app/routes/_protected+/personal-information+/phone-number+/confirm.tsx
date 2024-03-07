import { json, redirect } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { Form, MetaFunction, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { redirectWithSuccess } from 'remix-toast';

import { Button, ButtonLink } from '~/components/buttons';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getSessionService } from '~/services/session-service.server';
import { getUserService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';

export const handle = {
  breadcrumbs: [
    // prettier-ignore
    { labelI18nKey: 'personal-information:phone-number.confirm.breadcrumbs.personal-information', to: '/personal-information' },
    { labelI18nKey: 'personal-information:phone-number.confirm.breadcrumbs.confirm-phone-number' },
  ],
  i18nNamespaces: getTypedI18nNamespaces('personal-information', 'gcweb'),
  pageIdentifier: 'CDCP-0009',
  pageTitleI18nKey: 'personal-information:phone-number.confirm.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta((args) => {
  const { t } = useTranslation(handle.i18nNamespaces);
  return [{ title: t('gcweb:meta.title.template', { title: t('personal-information:phone-number.confirm.page-title') }) }];
});

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
  if (!session.has('newPhoneNumber')) return redirect('/');

  return json({ userInfo, newPhoneNumber: session.get('newPhoneNumber') });
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
  if (!session.has('newPhoneNumber')) return redirect('/');

  await userService.updateUserInfo(userId, { phoneNumber: session.get('newPhoneNumber') });
  session.unset('newPhoneNumber');
  return redirectWithSuccess('/personal-information', 'personal-information:phone-number.confirm.updated-notification', {
    headers: {
      'Set-Cookie': await sessionService.commitSession(session),
    },
  });
}

export default function PhoneNumberConfirm() {
  const loaderData = useLoaderData<typeof loader>();
  const { t } = useTranslation(handle.i18nNamespaces);
  return (
    <>
      <p className="mb-8 text-lg text-gray-500">{t('personal-information:phone-number.confirm.subtitle')}</p>
      <Form method="post" noValidate>
        <dl className="my-6 divide-y border-y">
          <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-6">
            <dt className="font-semibold">{t('personal-information:phone-number.edit.component.previous')}</dt>
            <dd className="mt-3 sm:col-span-2 sm:mt-0">{loaderData.userInfo.phoneNumber}</dd>
          </div>
          <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-6">
            <dt className="font-semibold">{t('personal-information:phone-number.edit.component.phone')}</dt>
            <dd className="mt-3 sm:col-span-2 sm:mt-0">{loaderData.newPhoneNumber}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">{t('personal-information:phone-number.confirm.button.confirm')}</Button>
          <ButtonLink id="cancelButton" to="/personal-information/phone-number/edit">
            {t('personal-information:phone-number.confirm.button.cancel')}
          </ButtonLink>
        </div>
      </Form>
    </>
  );
}
