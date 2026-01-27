import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/new-or-returning';

import { TYPES } from '~/.server/constants';
import { loadApplyState, saveApplyState } from '~/.server/routes/helpers/apply-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
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

const RENEWING_COVERAGE_OPTION = { no: 'no', yes: 'yes' } as const;

export const handle = { i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'), pageIdentifier: pageIds.public.apply.taxFiling, pageTitleI18nKey: 'apply:new-or-returning.page-title' } as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadApplyState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:new-or-returning.page-title') }) };

  return { meta, defaultState: state.isRenewingCoverage, taxYear: state.applicationYear.taxYear };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const isRenewingCoverageSchema = z.object({
    isRenewingCoverage: z.boolean(t('apply:new-or-returning.error-message.new-or-returning-required')),
  });

  const parsedDataResult = isRenewingCoverageSchema.safeParse({
    isRenewingCoverage: formData.get('isRenewingCoverage') ? formData.get('isRenewingCoverage') === RENEWING_COVERAGE_OPTION.yes : undefined,
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(z.flattenError(parsedDataResult.error)) }, { status: 400 });
  }

  saveApplyState({ params, session, state: { isRenewingCoverage: parsedDataResult.data.isRenewingCoverage } });

  if (parsedDataResult.data.isRenewingCoverage) {
    return redirect(getPathById('public/apply/$id/renewal-soon', params));
  }

  return redirect(getPathById('public/apply/$id/tax-filing', params));
}

export default function ApplyFlowNewOrReturning({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, taxYear } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    isRenewingCoverage: 'input-radio-new-or-returning-option-0',
  });

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={5} size="lg" label={t('apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('apply:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <InputRadios
            id="new-or-returning"
            name="isRenewingCoverage"
            legend={t('apply:new-or-returning.form-instructions', { taxYear })}
            options={[
              { value: RENEWING_COVERAGE_OPTION.yes, children: t('apply:new-or-returning.radio-options.yes'), defaultChecked: defaultState === true },
              { value: RENEWING_COVERAGE_OPTION.no, children: t('apply:new-or-returning.radio-options.no'), defaultChecked: defaultState === false },
            ]}
            errorMessage={errors?.isRenewingCoverage}
            required
          />
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Continue - New or returning member click">
              {t('apply:new-or-returning.continue-btn')}
            </LoadingButton>
            <ButtonLink
              id="back-button"
              variant="secondary"
              routeId="public/apply/$id/terms-and-conditions"
              params={params}
              disabled={isSubmitting}
              startIcon={faChevronLeft}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Back - New or returning member click"
            >
              {t('apply:new-or-returning.back-btn')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}
