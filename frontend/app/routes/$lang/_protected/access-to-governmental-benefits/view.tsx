import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import pageIds from '../../../page-ids.json';
import { ButtonLink } from '~/components/buttons';
import { ContextualAlert } from '~/components/contextual-alert';
import { InlineLink } from '~/components/inline-link';
import { getPersonalInformationRouteHelpers } from '~/route-helpers/personal-information-route-helpers.server';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getLookupService } from '~/services/lookup-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { featureEnabled } from '~/utils/env-utils.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, getLocale } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { UserinfoToken } from '~/utils/raoidc-utils.server';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
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

  const locale = getLocale(request);
  const lookupService = getLookupService();

  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  const personalInformationRouteHelpers = getPersonalInformationRouteHelpers();
  const personalInformation = await personalInformationRouteHelpers.getPersonalInformation(userInfoToken, params, request, session);

  const federalSocialProgramName =
    lookupService
      .getAllFederalSocialPrograms()
      .filter((federalSocialProgram) => federalSocialProgram.id === personalInformation.federalDentalPlanId)
      .map((federalSocialProgram) => getNameByLanguage(locale, federalSocialProgram))[0] ?? '';
  const provincialAndTerritorialProgramName =
    lookupService
      .getAllProvincialTerritorialSocialPrograms()
      .filter((provincialAndTerritorialProgram) => provincialAndTerritorialProgram.id === personalInformation.provincialTerritorialDentalPlanId)
      .map((provincialAndTerritorialProgram) => getNameByLanguage(locale, provincialAndTerritorialProgram))[0] ?? '';

  await raoidcService.handleSessionValidation(request, session);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('access-to-governmental-benefits:access-to-governmental-benefits.view.page-title') }) };

  instrumentationService.countHttpStatus('access-to-governmental-benefits.view', 200);
  const updatedInfo = session.get('personal-info-updated');
  return json({ meta, t, personalInformation, updatedInfo, federalSocialProgramName, provincialAndTerritorialProgramName, csrfToken });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  featureEnabled('update-governmental-benefit');

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
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, updatedInfo, personalInformation, federalSocialProgramName, provincialAndTerritorialProgramName } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const params = useParams();
  const hasDentalPlans = personalInformation.federalDentalPlanId ?? personalInformation.provincialTerritorialDentalPlanId;

  return (
    <div className="max-w-prose">
      {updatedInfo && (
        <div className="mb-5 space-y-4">
          <ContextualAlert type="success">
            <h2 className="text-xl font-semibold">{t('access-to-governmental-benefits:access-to-governmental-benefits.view.info-updated.your-info-has-been-updated')}</h2>
          </ContextualAlert>
        </div>
      )}
      {hasDentalPlans ? (
        <>
          <div className="mb-5 space-y-4">
            {personalInformation.provincialTerritorialDentalPlanId && (
              <div className="mb-5 space-y-4">
                <h2 className="font-bold"> {t('access-to-governmental-benefits:access-to-governmental-benefits.view.provincial-or-territorial-dental-benefit')}</h2>
                <ul className="list-disc space-y-6 pl-7">
                  <li>{provincialAndTerritorialProgramName}</li>
                </ul>
              </div>
            )}
          </div>
          <div className="mb-5 space-y-4">
            {personalInformation.federalDentalPlanId && (
              <div className="mb-5 space-y-4">
                <h2 className="font-bold"> {t('access-to-governmental-benefits:access-to-governmental-benefits.view.federal-benefits-dental-benefits')}</h2>

                <ul className="list-disc space-y-6 pl-7">
                  <li>{federalSocialProgramName} </li>
                </ul>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="mb-5 space-y-4">
          <p>{t('access-to-governmental-benefits:access-to-governmental-benefits.view.no-government-benefits')}</p>
        </div>
      )}
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
