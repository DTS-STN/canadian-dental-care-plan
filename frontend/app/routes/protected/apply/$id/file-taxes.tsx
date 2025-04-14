import type { FormEvent } from 'react';

import { redirect, useFetcher } from 'react-router';

import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';

import type { Route } from './+types/file-taxes';

import { TYPES } from '~/.server/constants';
import { clearProtectedApplyState, loadProtectedApplyState } from '~/.server/routes/helpers/protected-apply-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import type { IdToken } from '~/.server/utils/raoidc.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { InlineLink } from '~/components/inline-link';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-apply', 'gcweb'),
  pageIdentifier: pageIds.protected.apply.fileYourTaxes,
  pageTitleI18nKey: 'protected-apply:file-your-taxes.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const instrumentationService = appContainer.get(TYPES.observability.InstrumentationService);

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const { applicationYear } = loadProtectedApplyState({ params, session });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-apply:file-your-taxes.page-title') }) };

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.domain.services.AuditService).createAudit('page-view.apply.file-taxes', { userId: idToken.sub });

  instrumentationService.countHttpStatus('protected.apply.file-taxes', 200);
  return { meta, taxYear: applicationYear.taxYear };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const instrumentationService = appContainer.get(TYPES.observability.InstrumentationService);

  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });

  const { SCCH_BASE_URI } = appContainer.get(TYPES.configs.ClientConfig);

  const t = await getFixedT(request, handle.i18nNamespaces);

  clearProtectedApplyState({ params, session });

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.domain.services.AuditService).createAudit('update-data.apply.file-taxes', { userId: idToken.sub });

  instrumentationService.countHttpStatus('protected.apply.file-taxes', 302);
  return redirect(t('gcweb:header.menu-dashboard.href', { baseUri: SCCH_BASE_URI }));
}

export default function ProtectedApplyFlowFileYourTaxes({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { taxYear } = loaderData;
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const taxInfo = <InlineLink to={t('protected-apply:file-your-taxes.tax-info-href')} className="external-link" newTabIndicator target="_blank" />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await fetcher.submit(event.currentTarget, { method: 'POST' });
    sessionStorage.removeItem('protected.apply.state');
  }

  return (
    <div className="max-w-prose">
      <div className="mb-8 space-y-4">
        <p>{t('protected-apply:file-your-taxes.ineligible-to-apply')}</p>
        <p>{t('protected-apply:file-your-taxes.tax-not-filed', { taxYear })}</p>
        <p>{t('protected-apply:file-your-taxes.unable-to-assess')}</p>
        <p>
          <Trans ns={handle.i18nNamespaces} i18nKey="protected-apply:file-your-taxes.tax-info" components={{ taxInfo }} />
        </p>
        <p>{t('protected-apply:file-your-taxes.apply-after')}</p>
      </div>
      <fetcher.Form method="post" onSubmit={handleSubmit} noValidate className="flex flex-wrap items-center gap-3">
        <CsrfTokenInput />
        <ButtonLink id="back-button" routeId="protected/apply/$id/tax-filing" params={params} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected:Back - File your taxes click">
          {t('protected-apply:file-your-taxes.back-btn')}
        </ButtonLink>
        <LoadingButton type="submit" variant="primary" loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected:Return dashboard - File your taxes click">
          {t('protected-apply:return-dashboard')}
        </LoadingButton>
      </fetcher.Form>
    </div>
  );
}
