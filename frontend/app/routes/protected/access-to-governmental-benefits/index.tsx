import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useParams } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import pageIds from '../../page-ids.json';
import { InlineLink } from '~/components/inline-link';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { featureEnabled } from '~/utils/env-utils.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  breadcrumbs: [
    // prettier-ignore
    { labelI18nKey: 'access-to-governmental-benefits:access-to-governmental-benefits.index.page-title' },
  ],
  i18nNamespaces: getTypedI18nNamespaces('access-to-governmental-benefits', 'gcweb'),
  pageIdentifier: pageIds.protected.accessToGovermentalBenefits.index,
  pageTitleI18nKey: 'access-to-governmental-benefits:access-to-governmental-benefits.index.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  featureEnabled('update-governmental-benefit');

  const instrumentationService = getInstrumentationService();
  const raoidcService = await getRaoidcService();
  const csrfToken = String(session.get('csrfToken'));

  await raoidcService.handleSessionValidation(request, session);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('access-to-governmental-benefits:access-to-governmental-benefits.index.page-title') }) };

  instrumentationService.countHttpStatus('access-to-governmental-benefits.index', 200);
  return json({ meta, t, csrfToken });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  featureEnabled('update-governmental-benefit');

  const log = getLogger('access-to-governmental-benefits/index');

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

  instrumentationService.countHttpStatus('access-to-governmental-benefits.index', 302);
  return redirect(getPathById('protected/personal-information/index', params));
}

export default function AccessToGovernmentalsBenefitsIndex() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const fetcher = useFetcher<typeof action>();
  const params = useParams();

  return (
    <div className="max-w-prose">
      <div className="mb-5 space-y-4">
        <h2 className="font-bold"> {t('access-to-governmental-benefits:access-to-governmental-benefits.index.intro-text')}</h2>
        <p>{t('access-to-governmental-benefits:access-to-governmental-benefits.index.body-text')}</p>
      </div>
      <div className="mb-5 space-y-4">
        <InlineLink
          routeId="protected/access-to-governmental-benefits/view"
          params={{ ...params }}
          className="font-lato font-semibold"
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Personal Information:Update your access to governmental benefits - Update your dental benefits click"
        >
          {t('access-to-governmental-benefits:access-to-governmental-benefits.index.update-your-access-text')}
        </InlineLink>
      </div>
      <fetcher.Form method="post" noValidate></fetcher.Form>
    </div>
  );
}
