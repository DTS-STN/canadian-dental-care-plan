import { LoaderFunctionArgs, json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import { UTCDate } from '@date-fns/utc';
import { useTranslation } from 'react-i18next';

import pageIds from '../../page-ids.json';
import { ButtonLink } from '~/components/buttons';
import { DescriptionListItem } from '~/components/description-list-item';
import { getAuditService } from '~/services/audit-service.server';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { toLocaleDateString } from '~/utils/date-utils';
import { featureEnabled } from '~/utils/env.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, getLocale } from '~/utils/locale-utils.server';
import { IdToken } from '~/utils/raoidc-utils.server';
import { RouteHandleData } from '~/utils/route-utils';
import { useUserOrigin } from '~/utils/user-origin-utils';

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'applications:view-application.page-title' }],
  i18nNamespaces: getTypedI18nNamespaces('applications', 'gcweb'),
  pageIdentifier: pageIds.protected.applications.view,
  pageTitleI18nKey: 'applications:view-application.page-title',
} as const satisfies RouteHandleData;

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  featureEnabled('view-applications');

  const auditService = getAuditService();
  const instrumentationService = getInstrumentationService();
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request, session);

  if (!params.id) {
    instrumentationService.countHttpStatus('application.view', 400);
    throw new Response(null, { status: 400 });
  }

  //prevent users from entering any ID in the URL and seeing other users' applications
  const applications: { id: string | undefined; submittedOn: string | undefined; status: string | undefined; confirmationCode: string | undefined; data: object[] }[] | undefined = session.get('applications');
  const viewApplication = applications?.find((applications) => applications.id === params.id);
  if (!viewApplication) {
    instrumentationService.countHttpStatus('application.view', 404);
    throw new Response(null, { status: 404 });
  }
  const locale = getLocale(request);
  const submittedParsedFormat = viewApplication.submittedOn ? toLocaleDateString(new UTCDate(viewApplication.submittedOn), locale) : undefined;

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('applications:view-application.page-title') }) };

  const idToken: IdToken = session.get('idToken');
  auditService.audit('page-view.application-details', { userId: idToken.sub });
  instrumentationService.countHttpStatus('application-details.view', 200);

  return json({ viewApplication, submittedParsedFormat, meta });
}

export default function ViewApplication() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { viewApplication, submittedParsedFormat } = useLoaderData<typeof loader>();
  const userOrigin = useUserOrigin();
  // TODO: Update with field mappings from Benefit Application from AB-3382
  return (
    <div className="max-w-prose">
      <dl className="divide-y border-y">
        <DescriptionListItem term={t('applications:view-application.submitted-date')}>{`${submittedParsedFormat}`}</DescriptionListItem>
        <DescriptionListItem term={t('applications:view-application.status')}>{viewApplication.status}</DescriptionListItem>
        <DescriptionListItem term={t('applications:view-application.confirmation-code')}>{viewApplication.confirmationCode}</DescriptionListItem>
      </dl>
      {userOrigin && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <ButtonLink id="back-button" to={userOrigin.to} data-gc-analytics-customclick="ESDC-EDSC:CDCP Applications:Back - View application click">
            {t('applications:view-application.back-button')}
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
