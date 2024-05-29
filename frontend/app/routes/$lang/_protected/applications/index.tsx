import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData, useParams } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import pageIds from '../../page-ids.json';
import { ButtonLink } from '~/components/buttons';
import { ContextualAlert } from '~/components/contextual-alert';
import { InlineLink } from '~/components/inline-link';
import { getAuditService } from '~/services/audit-service.server';
import { getBenefitApplicationService } from '~/services/benefit-application-service.server';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { featureEnabled } from '~/utils/env.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { IdToken, UserinfoToken } from '~/utils/raoidc-utils.server';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { useUserOrigin } from '~/utils/user-origin-utils';

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'applications:index.page-title' }],
  i18nNamespaces: getTypedI18nNamespaces('applications', 'gcweb'),
  pageIdentifier: pageIds.protected.applications.index,
  pageTitleI18nKey: 'applications:index.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  if (!data) return [];
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  featureEnabled('view-applications');

  const auditService = getAuditService();
  const instrumentationService = getInstrumentationService();
  const raoidcService = await getRaoidcService();
  const benefitApplicationService = getBenefitApplicationService();

  await raoidcService.handleSessionValidation(request, session);

  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  const applications = await benefitApplicationService.getApplications(userInfoToken.sub);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('applications:index.page-title') }) };

  const idToken: IdToken = session.get('idToken');
  auditService.audit('page-view.applications', { userId: idToken.sub });
  instrumentationService.countHttpStatus('applications.view', 200);

  return json({ applications, meta });
}

export default function ApplicationsIndex() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { applications } = useLoaderData<typeof loader>();
  const params = useParams();
  const userOrigin = useUserOrigin();

  //TODO: will update <InlineLink rounteId> when view details page is ready
  return (
    <>
      {applications.length === 0 ? (
        <ContextualAlert type="info">
          <p>{t('applications:index.no-application')}</p>
        </ContextualAlert>
      ) : (
        <>
          <ul className="divide-y border-y">
            {applications.map((application) => {
              return (
                <li key={application.id} className="py-4 sm:py-6">
                  <InlineLink routeId="$lang/_protected/letters/$id.download" params={{ ...params, id: application.id }} className="external-link font-lato font-semibold" newTabIndicator target="_blank">
                    {t('applications:index.date', { date: application.submittedOn })}
                  </InlineLink>
                  <p className="mt-1 text-sm text-gray-500">{application.status}</p>
                  <p className="mt-1 text-sm text-gray-500">{application.confirmationCode}</p>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {userOrigin && (
        <div className="my-6 flex flex-wrap items-center gap-3">
          <ButtonLink id="back-button" to={userOrigin.to}>
            {t('applications:index.button.back')}
          </ButtonLink>
        </div>
      )}
    </>
  );
}
