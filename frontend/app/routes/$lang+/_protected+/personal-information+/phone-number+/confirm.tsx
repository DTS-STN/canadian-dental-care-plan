import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { redirectWithSuccess } from 'remix-toast';

import { Button, ButtonLink } from '~/components/buttons';
import { getAuditService } from '~/services/audit-service.server';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getSessionService } from '~/services/session-service.server';
import { getUserService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, getLocale, redirectWithLocale } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { IdToken } from '~/utils/raoidc-utils.server';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

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

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ request }: LoaderFunctionArgs) {
  const instrumentationService = getInstrumentationService();
  const raoidcService = await getRaoidcService();
  const sessionService = await getSessionService();
  const userService = getUserService();

  await raoidcService.handleSessionValidation(request);

  const userId = await userService.getUserId();

  if (!userId) {
    instrumentationService.countHttpStatus('phone-number.confirm', 302);
    return redirectWithLocale(request, '/');
  }

  const userInfo = await userService.getUserInfo(userId);
  if (!userInfo) {
    instrumentationService.countHttpStatus('phone-number.confirm', 302);
    return redirectWithLocale(request, '/');
  }

  const session = await sessionService.getSession(request);
  if (!session.has('newPhoneNumber')) {
    instrumentationService.countHttpStatus('phone-number.confirm', 302);
    return redirectWithLocale(request, '/');
  }

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('personal-information:phone-number.confirm.page-title') }) };

  instrumentationService.countHttpStatus('phone-number.confirm', 200);
  return json({ meta, newPhoneNumber: session.get('newPhoneNumber'), userInfo });
}

export async function action({ request }: ActionFunctionArgs) {
  const instrumentationService = getInstrumentationService();
  const raoidcService = await getRaoidcService();
  const sessionService = await getSessionService();
  const userService = getUserService();

  await raoidcService.handleSessionValidation(request);

  const session = await sessionService.getSession(request);

  const userId = await userService.getUserId();
  if (!userId) {
    instrumentationService.countHttpStatus('phone-number.confirm', 302);
    return redirectWithLocale(request, '/');
  }

  const userInfo = await userService.getUserInfo(userId);
  if (!userInfo) {
    instrumentationService.countHttpStatus('phone-number.confirm', 302);
    return redirectWithLocale(request, '/');
  }

  if (!session.has('newPhoneNumber')) {
    instrumentationService.countHttpStatus('phone-number.confirm', 302);
    return redirectWithLocale(request, '/');
  }

  await userService.updateUserInfo(userId, { phoneNumber: session.get('newPhoneNumber') });

  const idToken: IdToken = session.get('idToken');
  getAuditService().audit('update-data.phone-number', { userId: idToken.sub });

  session.unset('newPhoneNumber');
  const locale = await getLocale(request);

  instrumentationService.countHttpStatus('phone-number.confirm', 302);
  return redirectWithSuccess(`/${locale}/personal-information`, 'personal-information:phone-number.confirm.updated-notification', {
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
