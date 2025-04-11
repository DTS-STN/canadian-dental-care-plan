import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/tax-filing';

import { TYPES } from '~/.server/constants';
import { loadProtectedApplyState, saveProtectedApplyState } from '~/.server/routes/helpers/protected-apply-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import type { IdToken } from '~/.server/utils/raoidc.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

const TAX_FILING_OPTION = { no: 'no', yes: 'yes' } as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-apply', 'gcweb'),
  pageIdentifier: pageIds.protected.apply.taxFiling,
  pageTitleI18nKey: 'protected-apply:tax-filing.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const instrumentationService = appContainer.get(TYPES.observability.InstrumentationService);

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedApplyState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-apply:tax-filing.page-title') }) };

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.domain.services.AuditService).createAudit('page-view.renew.apply.tax-filing', { userId: idToken.sub });

  instrumentationService.countHttpStatus('protected.apply.tax-filing', 200);
  return { id: state.id, meta, defaultState: state.hasFiledTaxes, taxYear: state.applicationYear.taxYear };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const instrumentationService = appContainer.get(TYPES.observability.InstrumentationService);

  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const taxFilingSchema = z.object({ hasFiledTaxes: z.nativeEnum(TAX_FILING_OPTION, { errorMap: () => ({ message: t('protected-apply:tax-filing.error-message.tax-filing-required') }) }) });

  const parsedDataResult = taxFilingSchema.safeParse({ hasFiledTaxes: formData.get('hasFiledTaxes') });

  if (!parsedDataResult.success) {
    instrumentationService.countHttpStatus('protected.apply.tax-filing', 400);
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  saveProtectedApplyState({ params, session, state: { hasFiledTaxes: parsedDataResult.data.hasFiledTaxes === TAX_FILING_OPTION.yes } });

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.domain.services.AuditService).createAudit('update-data.renew.apply.tax-filing', { userId: idToken.sub });

  instrumentationService.countHttpStatus('protected.apply.tax-filing', 302);

  if (parsedDataResult.data.hasFiledTaxes === TAX_FILING_OPTION.no) {
    return redirect(getPathById('protected/apply/$id/file-taxes', params));
  }

  return redirect(getPathById('protected/apply/$id/type-application', params));
}

export default function ProtectedApplyFlowTaxFiling({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, taxYear } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, { hasFiledTaxes: 'input-radio-tax-filing-2023-option-0' });

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={10} size="lg" label={t('protected-apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('protected-apply:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <InputRadios
            id="tax-filing-2023"
            name="hasFiledTaxes"
            legend={t('protected-apply:tax-filing.form-instructions', { taxYear })}
            options={[
              { value: TAX_FILING_OPTION.yes, children: t('protected-apply:tax-filing.radio-options.yes'), defaultChecked: defaultState === true },
              { value: TAX_FILING_OPTION.no, children: t('protected-apply:tax-filing.radio-options.no'), defaultChecked: defaultState === false },
            ]}
            errorMessage={errors?.hasFiledTaxes}
            required
          />
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected:Continue - Tax filing click">
              {t('protected-apply:tax-filing.continue-btn')}
            </LoadingButton>
            <ButtonLink
              id="back-button"
              routeId="protected/apply/$id/terms-and-conditions"
              params={params}
              disabled={isSubmitting}
              startIcon={faChevronLeft}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected:Back - Tax filing click"
            >
              {t('protected-apply:tax-filing.back-btn')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}
