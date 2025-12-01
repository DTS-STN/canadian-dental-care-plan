import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/tax-filing';

import { TYPES } from '~/.server/constants';
import { getPublicApplicationState, savePublicApplicationState } from '~/.server/routes/helpers/public-application-route-helpers';
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

export const handle = { i18nNamespaces: getTypedI18nNamespaces('application', 'gcweb'), pageIdentifier: pageIds.public.application.taxFiling, pageTitleI18nKey: 'application:tax-filing.page-title' } as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = getPublicApplicationState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('application:tax-filing.page-title') }) };

  return { meta, defaultState: state.hasFiledTaxes, taxYear: state.applicationYear.taxYear };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const taxFilingSchema = z.object({ hasFiledTaxes: z.enum(TAX_FILING_OPTION, { error: t('application:tax-filing.error-message.tax-filing-required') }) });

  const parsedDataResult = taxFilingSchema.safeParse({ hasFiledTaxes: formData.get('hasFiledTaxes') });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(z.flattenError(parsedDataResult.error)) }, { status: 400 });
  }

  savePublicApplicationState({ params, session, state: { hasFiledTaxes: parsedDataResult.data.hasFiledTaxes === TAX_FILING_OPTION.yes } });

  if (parsedDataResult.data.hasFiledTaxes === TAX_FILING_OPTION.no) {
    return redirect(getPathById('public/application/$id/file-taxes', params));
  }

  return redirect(getPathById('public/application/$id/eligibility-requirements', params));
}

export default function ApplyFlowTaxFiling({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, taxYear } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, { hasFiledTaxes: 'input-radio-tax-filing-2023-option-0' });

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={10} size="lg" label={t('application:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('application:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <InputRadios
            id="tax-filing-2023"
            name="hasFiledTaxes"
            legend={t('application:tax-filing.form-instructions', { taxYear })}
            options={[
              { value: TAX_FILING_OPTION.yes, children: t('application:tax-filing.radio-options.yes'), defaultChecked: defaultState === true },
              { value: TAX_FILING_OPTION.no, children: t('application:tax-filing.radio-options.no'), defaultChecked: defaultState === false },
            ]}
            errorMessage={errors?.hasFiledTaxes}
            required
          />
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Continue - Tax filing click">
              {t('application:tax-filing.continue-btn')}
            </LoadingButton>
            <ButtonLink
              id="back-button"
              variant="secondary"
              routeId="public/application/$id/eligibility-requirements"
              params={params}
              disabled={isSubmitting}
              startIcon={faChevronLeft}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Back - Tax filing click"
            >
              {t('application:tax-filing.back-btn')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}
