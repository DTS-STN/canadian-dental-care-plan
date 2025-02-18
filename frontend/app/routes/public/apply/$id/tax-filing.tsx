import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/tax-filing';

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

const TAX_FILING_OPTION = { no: 'no', yes: 'yes' } as const;

export const handle = { i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'), pageIdentifier: pageIds.public.apply.taxFiling, pageTitleI18nKey: 'apply:tax-filing.page-title' } as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadApplyState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:tax-filing.page-title') }) };

  return { id: state.id, meta, defaultState: state.taxFiling2023, taxYear: state.applicationYear.taxYear };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const taxFilingSchema = z.object({ taxFiling2023: z.nativeEnum(TAX_FILING_OPTION, { errorMap: () => ({ message: t('apply:tax-filing.error-message.tax-filing-required') }) }) });

  const parsedDataResult = taxFilingSchema.safeParse({ taxFiling2023: formData.get('taxFiling2023') });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  saveApplyState({ params, session, state: { taxFiling2023: parsedDataResult.data.taxFiling2023 === TAX_FILING_OPTION.yes } });

  if (parsedDataResult.data.taxFiling2023 === TAX_FILING_OPTION.no) {
    return redirect(getPathById('public/apply/$id/file-taxes', params));
  }

  return redirect(getPathById('public/apply/$id/type-application', params));
}

export default function ApplyFlowTaxFiling({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, taxYear } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, { taxFiling2023: 'input-radio-tax-filing-2023-option-0' });

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={22} size="lg" label={t('apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('apply:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <InputRadios
            id="tax-filing-2023"
            name="taxFiling2023"
            legend={t('apply:tax-filing.form-instructions', { taxYear })}
            options={[
              { value: TAX_FILING_OPTION.yes, children: t('apply:tax-filing.radio-options.yes'), defaultChecked: defaultState === true },
              { value: TAX_FILING_OPTION.no, children: t('apply:tax-filing.radio-options.no'), defaultChecked: defaultState === false },
            ]}
            errorMessage={errors?.taxFiling2023}
            required
          />
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Continue - Tax filing click">
              {t('apply:tax-filing.continue-btn')}
            </LoadingButton>
            <ButtonLink id="back-button" routeId="public/apply/$id/type-application" params={params} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Back - Tax filing click">
              {t('apply:tax-filing.back-btn')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}
