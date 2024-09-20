import type { ChangeEvent } from 'react';

import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData, useParams, useSearchParams } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../page-ids.json';
import { ButtonLink } from '~/components/buttons';
import { ContextualAlert } from '~/components/contextual-alert';
import { InlineLink } from '~/components/inline-link';
import { InputSelect } from '~/components/input-select';
import { getAuditService } from '~/services/audit-service.server';
import { getBenefitApplicationService } from '~/services/benefit-application-service.server';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { extractDateParts } from '~/utils/date-utils';
import { featureEnabled } from '~/utils/env-utils.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { IdToken, UserinfoToken } from '~/utils/raoidc-utils.server';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'applications:index.page-title' }],
  i18nNamespaces: getTypedI18nNamespaces('applications', 'gcweb'),
  pageIdentifier: pageIds.protected.applications.index,
  pageTitleI18nKey: 'applications:index.page-title',
} as const satisfies RouteHandleData;

const orderEnumSchema = z.enum(['asc', 'desc']);

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  if (!data) return [];
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { configProvider, serviceProvider, session }, params, request }: LoaderFunctionArgs) {
  featureEnabled('view-applications');

  const auditService = getAuditService();
  const instrumentationService = getInstrumentationService();
  const raoidcService = await getRaoidcService();

  await raoidcService.handleSessionValidation(request, session);

  const sortParam = new URL(request.url).searchParams.get('sort');
  const sortOrder = orderEnumSchema.catch('desc').parse(sortParam);

  const userInfoToken: UserinfoToken = session.get('userInfoToken');

  const benefitApplicationService = getBenefitApplicationService({ federalGovernmentInsurancePlanService: serviceProvider.getFederalGovernmentInsurancePlanService() });
  const applications = await benefitApplicationService.getApplications(userInfoToken.sub, sortOrder);
  session.set('applications', applications);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('applications:index.page-title') }) };

  const idToken: IdToken = session.get('idToken');
  auditService.audit('page-view.applications', { userId: idToken.sub });
  instrumentationService.countHttpStatus('applications.view', 200);

  const { SCCH_BASE_URI } = configProvider.getClientConfig();
  return json({ applications, meta, sortOrder, SCCH_BASE_URI });
}

export default function ApplicationsIndex() {
  const [, setSearchParams] = useSearchParams();
  const { t } = useTranslation(handle.i18nNamespaces);
  const { applications, sortOrder, SCCH_BASE_URI } = useLoaderData<typeof loader>();
  const params = useParams();

  function handleOnSortOrderChange(e: ChangeEvent<HTMLSelectElement>) {
    setSearchParams((prev) => {
      prev.set('sort', e.target.value);
      return prev;
    });
  }

  return (
    <>
      {applications.length === 0 ? (
        <ContextualAlert type="info">
          <p>{t('applications:index.no-application')}</p>
        </ContextualAlert>
      ) : (
        <>
          <div className="my-6">
            <InputSelect
              className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4"
              id="sort-order"
              value={sortOrder}
              onChange={handleOnSortOrderChange}
              label={t('applications:index.filter')}
              name="sortOrder"
              options={[
                { value: orderEnumSchema.enum.desc, children: t('applications:index.newest') },
                { value: orderEnumSchema.enum.asc, children: t('applications:index.oldest') },
              ]}
            />
          </div>

          <ul className="divide-y border-y">
            {applications.map((application) => {
              const gcAnalyticsCustomClickValue = `ESDC-EDSC:CDCP Applications Click:${application.confirmationCode}`;
              return (
                <li key={application.id} className="py-4 sm:py-6">
                  <InlineLink id="view-application-details" routeId="protected/applications/$id" className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4" params={{ ...params, id: application.id }} data-gc-analytics-customclick={gcAnalyticsCustomClickValue}>
                    {t('applications:index.application-title', { year: application.submittedOn ? extractDateParts(application.submittedOn).year : '' })}
                  </InlineLink>
                  <p className="mt-1 text-sm text-gray-500">{t('applications:index.date', { date: application.submittedOn })}</p>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <div className="my-6 flex flex-wrap items-center gap-3">
        <ButtonLink id="back-button" to={t('gcweb:header.menu-dashboard.href', { baseUri: SCCH_BASE_URI })} data-gc-analytics-customclick="ESDC-EDSC:CDCP Applications:Back - Applications click">
          {t('applications:index.back-button')}
        </ButtonLink>
      </div>
    </>
  );
}
