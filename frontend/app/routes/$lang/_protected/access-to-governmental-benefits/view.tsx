import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import pageIds from '../../page-ids.json';
import { ButtonLink } from '~/components/buttons';
import { ContextualAlert } from '~/components/contextual-alert';
import { InlineLink } from '~/components/inline-link';
import { getPersonalInformationRouteHelpers } from '~/route-helpers/personal-information-route-helpers.server';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getLookupService } from '~/services/lookup-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { featureEnabled } from '~/utils/env.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { UserinfoToken } from '~/utils/raoidc-utils.server';
import { getPathById } from '~/utils/route-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  breadcrumbs: [
    // prettier-ignore
    { labelI18nKey: 'access-to-governmental-benefits:access-to-governmental-benefits.view.page-title' },
  ],
  i18nNamespaces: getTypedI18nNamespaces('access-to-governmental-benefits', 'gcweb'),
  pageIdentifier: pageIds.protected.accessToGovermentalBenefits.view,
  pageTitleI18nKey: 'access-to-governmental-benefits:access-to-governmental-benefits.view.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  featureEnabled('update-governmental-benefit');
  const instrumentationService = getInstrumentationService();
  const raoidcService = await getRaoidcService();
  const csrfToken = String(session.get('csrfToken'));

  const lookupService = getLookupService();
  const federalSocialProgramsList = lookupService.getAllFederalSocialPrograms();
  const provincialAndTerritorialProgramsList = lookupService.getAllProvincialTerritorialSocialPrograms();

  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  const personalInformationRouteHelpers = getPersonalInformationRouteHelpers();
  const personalInformation = await personalInformationRouteHelpers.getPersonalInformation(userInfoToken, params, request, session);

  await raoidcService.handleSessionValidation(request, session);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('access-to-governmental-benefits:access-to-governmental-benefits.view.page-title') }) };

  instrumentationService.countHttpStatus('access-to-governmental-benefits.view', 200);
  const updatedInfo = session.get('personal-info-updated');
  return json({ meta, t, personalInformation, updatedInfo, federalSocialProgramsList, provincialAndTerritorialProgramsList, csrfToken });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('access-to-governmental-benefits/view');

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const instrumentationService = getInstrumentationService();
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request, session);

  instrumentationService.countHttpStatus('access-to-governmental-benefits.view', 302);
  return redirect(getPathById('$lang/_protected/access-to-governmental-benefits/view', params));
}

export default function AccessToGovernmentalsBenefitsView() {
  const { t, i18n } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, updatedInfo, personalInformation, federalSocialProgramsList, provincialAndTerritorialProgramsList } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const params = useParams();
  const hasDentalPlans = personalInformation.federalDentalPlanId ?? personalInformation.provincialTerritorialDentalPlanId;

  if (hasDentalPlans) {
    return (
      <div className="max-w-prose">
        <div className="mb-5 space-y-4">
          {updatedInfo && (
            <ContextualAlert type="success">
              <h2 className="text-xl font-semibold">{t('access-to-governmental-benefits:access-to-governmental-benefits.view.info-updated.your-info-has-been-updated')}</h2>
            </ContextualAlert>
          )}
          {personalInformation.provincialTerritorialDentalPlanId ? (
            <div className="mb-5 space-y-4">
              <h2 className="font-bold"> {t('access-to-governmental-benefits:access-to-governmental-benefits.view.provincial-or-territorial-dental-benefit')}</h2>
              <ul className="list-disc space-y-6 pl-7">
                <li>{provincialAndTerritorialProgramsList.find((federalSocialProgram) => federalSocialProgram.id === personalInformation.provincialTerritorialDentalPlanId)?.[i18n.language === 'fr' ? 'nameFr' : 'nameEn'] ?? ' '} </li>
              </ul>
            </div>
          ) : (
            <div className="mb-5 space-y-4">
              <h2 className="font-bold"> {t('access-to-governmental-benefits:access-to-governmental-benefits.view.provincial-or-territorial-dental-benefit')}</h2>
            </div>
          )}
        </div>
        <div className="mb-5 space-y-4">
          {personalInformation.federalDentalPlanId ? (
            <div className="mb-5 space-y-4">
              <h2 className="font-bold"> {t('access-to-governmental-benefits:access-to-governmental-benefits.view.federal-benefits-dental-benefits')}</h2>

              <ul className="list-disc space-y-6 pl-7">
                <li>{federalSocialProgramsList.find((federalSocialProgram) => federalSocialProgram.id === personalInformation.federalDentalPlanId)?.[i18n.language === 'fr' ? 'nameFr' : 'nameEn'] ?? ' '} </li>
              </ul>
            </div>
          ) : (
            <div className="mb-5 space-y-4">
              <h2 className="font-bold"> {t('access-to-governmental-benefits:access-to-governmental-benefits.view.federal-benefits-dental-benefits')}</h2>
            </div>
          )}
        </div>
        <div className="mb-5 space-y-4">
          <InlineLink
            routeId="$lang/_protected/access-to-governmental-benefits/edit"
            params={{ ...params }}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Personal Information:Update your access to governmental benefits - Access to governmental benefits click"
          >
            {t('access-to-governmental-benefits:access-to-governmental-benefits.view.update-your-access-text')}
          </InlineLink>
        </div>

        <fetcher.Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink id="back-button" routeId="$lang/_protected/access-to-governmental-benefits/index" params={params} data-gc-analytics-customclick="ESDC-EDSC:CDCP Personal Information:Back - Access to governmental benefits click">
              {t('access-to-governmental-benefits:access-to-governmental-benefits.view.back')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </div>
    );
  } else {
    return (
      <div className="max-w-prose">
        {updatedInfo && (
          <ContextualAlert type="success">
            <h2 className="text-xl font-semibold">{t('access-to-governmental-benefits:access-to-governmental-benefits.view.info-updated.your-info-has-been-updated')}</h2>
          </ContextualAlert>
        )}
        <div className="mb-5 space-y-4">
          <p>{t('access-to-governmental-benefits:access-to-governmental-benefits.view.no-government-benefits')}</p>
        </div>
        <div className="mb-5 space-y-4">
          <InlineLink
            routeId="$lang/_protected/access-to-governmental-benefits/edit"
            params={{ ...params }}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Personal Information:Update your access to governmental benefits - Access to governmental benefits click"
          >
            {t('access-to-governmental-benefits:access-to-governmental-benefits.view.update-your-access-text')}
          </InlineLink>
        </div>

        <fetcher.Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink id="back-button" routeId="$lang/_protected/access-to-governmental-benefits/index" params={params} data-gc-analytics-customclick="ESDC-EDSC:CDCP Personal Information:Back - Access to governmental benefits click">
              {t('access-to-governmental-benefits:access-to-governmental-benefits.view.back')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </div>
    );
  }
}
