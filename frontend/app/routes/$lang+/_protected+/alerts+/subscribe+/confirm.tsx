import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import pageIds from '../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { InputField } from '~/components/input-field';
import { getPersonalInformationRouteHelpers } from '~/route-helpers/personal-information-route-helpers.server';
import { PersonalInfo } from '~/schemas/personal-informaton-service-schemas.server';
import { getAuditService } from '~/services/audit-service.server';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getLookupService } from '~/services/lookup-service.server';
import { featureEnabled } from '~/utils/env.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { UserinfoToken } from '~/utils/raoidc-utils.server';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { useUserOrigin } from '~/utils/user-origin-utils';

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'alerts:confirm.page-title' }],
  i18nNamespaces: getTypedI18nNamespaces('alerts', 'gcweb'),
  pageIdentifier: pageIds.protected.alerts.confirm,
  pageTitleI18nKey: 'alerts:confirm.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});
export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  featureEnabled('email-alerts');
  const lookupService = getLookupService();
  const instrumentationService = getInstrumentationService();
  const t = await getFixedT(request, handle.i18nNamespaces);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('alerts:confirm.page-title') }) };

  const personalInformationRouteHelper = getPersonalInformationRouteHelpers();
  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  const personalInformation: PersonalInfo = await personalInformationRouteHelper.getPersonalInformation(userInfoToken, params, request, session);
  const preferredLanguage = personalInformation.preferredLanguageId ? await getLookupService().getPreferredLanguage(personalInformation.preferredLanguageId) : undefined;

  instrumentationService.countHttpStatus('alerts.subscibe', 302);
  return json({ csrfToken, meta, personalInformation, preferredLanguage });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('alerts/subscribe');

  const instrumentationService = getInstrumentationService();
  const auditService = getAuditService();
  const t = await getFixedT(request, handle.i18nNamespaces);

  return '';
}

export default function confirmSubscription() {
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, personalInformation, preferredLanguage } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const userOrigin = useUserOrigin();
  const errorSummaryId = 'error-summary';

  return (
    <>
      <fetcher.Form className="max-w-prose" method="post" noValidate>
        <div className="mb-8 space-y-6">
          <p id="confirmation-information" className="mb-4">
            {t('alerts:confirm.confirmation-information-text')}
          </p>
          <p id="confirmation-completed" className="mb-4">
            {t('alerts:confirm.confirmation-completed-text')}
          </p>
          <div className="grid gap-12 md:grid-cols-2">
            <p id="confirmation-language" className="mb-4">
              {t('alerts:confirm.confirmation-selected-language')}
            </p>
            <p>{preferredLanguage ? getNameByLanguage(i18n.language, preferredLanguage) : t('alerts:confirm.no-preferred-language-on-file')}</p>
          </div>
          <InputField id="confirmationCode" className="w-full" label={t('alerts:confirm.confirmation-code-label')} maxLength={100} name="confirmationCode" required />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink id="back-button" to={userOrigin?.to} params={params}>
            {t('alerts:confirm.back')}
          </ButtonLink>
          <Button id="new-code-button" variant="alternative">
            {t('alerts:confirm.request-new-code')}
          </Button>
          <Button id="submit-button" variant="primary">
            {t('alerts:confirm.submit-code')}
          </Button>
        </div>
      </fetcher.Form>
    </>
  );
}
