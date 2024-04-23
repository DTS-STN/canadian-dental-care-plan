import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import pageIds from '../../page-ids.json';
import { Button } from '~/components/buttons';
import { ContextualAlert } from '~/components/contextual-alert';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { featureEnabled } from '~/utils/env.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { getPathById } from '~/utils/route-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  breadcrumbs: [
    // prettier-ignore
    { labelI18nKey: 'access-to-governmental-benefits:access-to-governmental-benefits.confirm.page-title' },
  ],
  i18nNamespaces: getTypedI18nNamespaces('access-to-governmental-benefits', 'gcweb'),
  pageIdentifier: pageIds.protected.accessToGovermentalBenefits,
  pageTitleI18nKey: 'access-to-governmental-benefits:access-to-governmental-benefits.confirm.page-title',
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
  const meta = { title: t('gcweb:meta.title.template', { title: t('access-to-governmental-benefits:access-to-governmental-benefits.confirm.page-title') }) };

  instrumentationService.countHttpStatus('access-to-governmental-benefits.access-to-governmental-benefits.confirm', 200);
  return json({ meta, t, csrfToken });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('access-to-governmental-benefits/confirm');

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

  instrumentationService.countHttpStatus('access-to-governmental-benefits.confirm', 302);
  return redirect(getPathById('$lang+/_protected+/access-to-governmental-benefits+/index', params));
}

export default function AccessToGovernmentalsBenefitsConfirm() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();

  return (
    <div className="max-w-prose">
      <>
        <div className="mb-5">
          <ContextualAlert type="success">
            <div className="mb-5 mt-5 gap-3 space-y-5">
              <p>
                {t('access-to-governmental-benefits.confirm.your-info-has-been-updated')}
                <br />
              </p>
            </div>
          </ContextualAlert>
        </div>
        <fetcher.Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <div className="flex flex-wrap items-center gap-3">
            <Button id="back-button">{t('access-to-governmental-benefits:access-to-governmental-benefits.confirm.button.back')}</Button>
          </div>
        </fetcher.Form>
      </>
    </div>
  );
}
