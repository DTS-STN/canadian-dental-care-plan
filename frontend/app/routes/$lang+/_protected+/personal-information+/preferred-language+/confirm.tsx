import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, useLoaderData, useParams } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { redirectWithSuccess } from 'remix-toast';

import pageIds from '../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getLookupService } from '~/services/lookup-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getUserService } from '~/services/user-service.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { getPathById } from '~/utils/route-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  breadcrumbs: [
    { labelI18nKey: 'personal-information:preferred-language.confirm.breadcrumbs.personal-information', routeId: '$lang+/_protected+/personal-information+/index' },
    { labelI18nKey: 'personal-information:preferred-language.confirm.breadcrumbs.preferred-language-edit', routeId: '$lang+/_protected+/personal-information+/preferred-language+/edit' },
    { labelI18nKey: 'personal-information:preferred-language.confirm.breadcrumbs.preferred-language-confirm' },
  ],
  i18nNamespaces: getTypedI18nNamespaces('personal-information', 'gcweb'),
  pageIdentifier: pageIds.protected.personalInformation.preferredLanguageConfirm,
  pageTitleI18nKey: 'personal-information:preferred-language.confirm.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const instrumentationService = getInstrumentationService();
  const lookupService = getLookupService();
  const raoidcService = await getRaoidcService();
  const userService = getUserService();

  await raoidcService.handleSessionValidation(request, session);

  const userId = await userService.getUserId();
  if (!userId) {
    instrumentationService.countHttpStatus('preferred-language.confirm', 302);
    return redirect(getPathById('$lang+/_protected+/home', params));
  }

  const userInfo = await userService.getUserInfo(userId);
  if (!userInfo) {
    instrumentationService.countHttpStatus('preferred-language.confirm', 302);
    return redirect(getPathById('$lang+/_protected+/home', params));
  }

  if (!session.has('newPreferredLanguage')) {
    instrumentationService.countHttpStatus('preferred-language.confirm', 302);
    return redirect(getPathById('$lang+/_protected+/home', params));
  }

  const preferredLanguage = await lookupService.getPreferredLanguage(session.get('newPreferredLanguage'));

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('personal-information:preferred-language.confirm.page-title') }) };

  instrumentationService.countHttpStatus('preferred-language.confirm', 200);
  return json({ meta, preferredLanguage, userInfo });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const instrumentationService = getInstrumentationService();
  const raoidcService = await getRaoidcService();
  const userService = getUserService();

  await raoidcService.handleSessionValidation(request, session);

  const userId = await userService.getUserId();
  if (!userId) {
    instrumentationService.countHttpStatus('preferred-language.confirm', 302);
    return redirect(getPathById('$lang+/_protected+/home', params));
  }

  const userInfo = await userService.getUserInfo(userId);
  if (!userInfo) {
    instrumentationService.countHttpStatus('preferred-language.confirm', 302);
    return redirect(getPathById('$lang+/_protected+/home', params));
  }

  if (!session.has('newPreferredLanguage')) {
    instrumentationService.countHttpStatus('preferred-language.confirm', 302);
    return redirect(getPathById('$lang+/_protected+/home', params));
  }

  await userService.updateUserInfo(userId, { preferredLanguage: session.get('newPreferredLanguage') });
  session.unset('newPreferredLanguage');

  instrumentationService.countHttpStatus('preferred-language.confirm', 302);
  return redirectWithSuccess(getPathById('$lang+/_protected+/personal-information+/index', params), 'personal-information:preferred-language.confirm.updated-notification');
}

export default function PreferredLanguageConfirm() {
  const { preferredLanguage } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const params = useParams();

  return (
    <>
      <p className="mb-8 text-lg text-gray-500">{t('personal-information:preferred-language.confirm.subtitle')}</p>
      <Form method="post" noValidate>
        <dl className="my-6 border-y">
          <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-6">
            <dt className="font-semibold"></dt>
            <dd className="mt-3 sm:col-span-2 sm:mt-0">{preferredLanguage && getNameByLanguage(i18n.language, preferredLanguage)}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">{t('personal-information:preferred-language.confirm.button.confirm')}</Button>
          <ButtonLink id="cancelButton" routeId="$lang+/_protected+/personal-information+/preferred-language+/edit" params={params}>
            {t('personal-information:preferred-language.confirm.button.cancel')}
          </ButtonLink>
        </div>
      </Form>
    </>
  );
}
